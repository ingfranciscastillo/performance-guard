import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, budgets, repos } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import {
	commitWorkflowFile,
	detectPackageManager,
	type GhRepo,
	getPackageJson,
	isYarnBerryLockfile,
	listGithubRepos,
	pickServeScript,
} from "@/lib/github";
import type { Action, MetricKey, Severity } from "@/lib/mock-data";
import { vitalgateWorkflowYaml } from "@/lib/workflow-template";

async function getGithubAccessToken(userId: string): Promise<string> {
	const [githubAccount] = await db
		.select({ accessToken: account.accessToken })
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, "github")))
		.limit(1);

	if (!githubAccount?.accessToken) {
		throw new Error(
			"No GitHub account connected. Sign in with GitHub to connect repositories.",
		);
	}
	return githubAccount.accessToken;
}

export const getConnectableRepos = createServerFn({ method: "GET" }).handler(
	async (): Promise<GhRepo[]> => {
		const session = await ensureSession();
		const accessToken = await getGithubAccessToken(session.user.id);
		return listGithubRepos(accessToken);
	},
);

type PresetBudget = {
	metric: MetricKey;
	max: number;
	severity: Severity;
	action: Action;
};

/**
 * Budget preset values, kept server-side as the source of truth (the client
 * only sends the preset id). Mirrors the thresholds shown in the preset
 * descriptions in repositories/new.tsx; FCP/TBT aren't shown there but are
 * filled in proportionally so every connected repo gets all 6 metrics.
 */
const PRESET_BUDGETS: Record<string, PresetBudget[]> = {
	default: [
		{ metric: "LCP", max: 2500, severity: "fail", action: "block" },
		{ metric: "INP", max: 200, severity: "fail", action: "block" },
		{ metric: "CLS", max: 0.1, severity: "warn", action: "comment" },
		{ metric: "FCP", max: 1800, severity: "warn", action: "comment" },
		{ metric: "TBT", max: 300, severity: "warn", action: "comment" },
		{ metric: "PERF", max: 90, severity: "fail", action: "block" },
	],
	strict: [
		{ metric: "LCP", max: 2000, severity: "fail", action: "block" },
		{ metric: "INP", max: 150, severity: "fail", action: "block" },
		{ metric: "CLS", max: 0.05, severity: "warn", action: "comment" },
		{ metric: "FCP", max: 1500, severity: "warn", action: "comment" },
		{ metric: "TBT", max: 200, severity: "warn", action: "comment" },
		{ metric: "PERF", max: 95, severity: "fail", action: "block" },
	],
	relaxed: [
		{ metric: "LCP", max: 3500, severity: "warn", action: "comment" },
		{ metric: "INP", max: 300, severity: "warn", action: "comment" },
		{ metric: "CLS", max: 0.15, severity: "warn", action: "comment" },
		{ metric: "FCP", max: 2800, severity: "warn", action: "comment" },
		{ metric: "TBT", max: 500, severity: "warn", action: "comment" },
		{ metric: "PERF", max: 75, severity: "fail", action: "block" },
	],
	// "Configure budgets manually after connecting" — no rows written.
	custom: [],
};

interface ConnectRepositoriesInput {
	repos: Pick<
		GhRepo,
		"id" | "name" | "fullName" | "defaultBranch" | "private"
	>[];
	preset: string;
	/** When false, downgrade every "block" action to "comment" (no merge gating). */
	branchProtect: boolean;
	/**
	 * User-provided override for the workflow's serve command/port, applied to
	 * every repo in this batch. When omitted, each repo's package.json is
	 * inspected instead (see pickServeScript) — falls back to a placeholder
	 * the user must edit by hand if nothing can be detected.
	 */
	startScript?: string;
	port?: number;
	/**
	 * Names (never values) of repo secrets the generated workflow should
	 * forward to the started server — e.g. ["DATABASE_URL"] for a repo whose
	 * SSR loader errors on every request without a DB connection string.
	 * Applied to every repo in this batch, same as startScript/port.
	 */
	envVarNames?: string[];
}

const DEFAULT_PORT = 3000;
const FALLBACK_START_SCRIPT = "start"; // TODO: replace me — no start/preview/serve script was found

/** A GitHub Actions secret/env var name: letters, digits, underscores, not starting with a digit. */
const ENV_VAR_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Cleans up user-typed env var names: trims, drops anything that isn't a
 * valid identifier (silently — this only controls which `secrets.<NAME>`
 * references get written into YAML we generate, not user-facing validation),
 * and dedupes. VITALGATE_TOKEN is already wired in separately, so a repeat
 * entry for it would just be a harmless no-op duplicate — still stripped to
 * keep the generated workflow's env block clean.
 */
function sanitizeEnvVarNames(names: string[] | undefined): string[] {
	if (!names) return [];
	const seen = new Set<string>();
	for (const raw of names) {
		const name = raw.trim();
		if (
			!name ||
			!ENV_VAR_NAME_PATTERN.test(name) ||
			name === "VITALGATE_TOKEN"
		) {
			continue;
		}
		seen.add(name);
	}
	return Array.from(seen);
}

/**
 * Where Vitalgate is reachable, for the workflow's `fetch(...)` call to our
 * own ingest endpoint. Derived from the request that's connecting the repo
 * (the browser's Origin header) rather than an env var, so it's automatically
 * correct on localhost, a Vercel preview, and prod without any manual step —
 * and stays correct if the deployment domain ever changes.
 */
function getVitalgateOrigin(): string {
	const headers = getRequestHeaders();
	const origin = headers.get("origin");
	if (origin) return origin;

	const host = headers.get("host");
	if (host) {
		const proto = headers.get("x-forwarded-proto") ?? "https";
		return `${proto}://${host}`;
	}

	return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export const connectRepositories = createServerFn({ method: "POST" })
	.validator((data: ConnectRepositoriesInput) => data)
	.handler(async ({ data }) => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) {
			throw new Error(
				"No active organization. Set one from Settings before connecting repos.",
			);
		}

		const accessToken = await getGithubAccessToken(session.user.id);
		const vitalgateOrigin = getVitalgateOrigin();
		const presetBudgets = PRESET_BUDGETS[data.preset] ?? [];
		const envVarNames = sanitizeEnvVarNames(data.envVarNames);
		let connected = 0;
		let workflowsAdded = 0;
		let workflowsUpdated = 0;
		const workflowErrors: string[] = [];

		for (const repo of data.repos) {
			const [inserted] = await db
				.insert(repos)
				.values({
					organizationId,
					githubRepoId: repo.id,
					name: repo.name,
					fullName: repo.fullName,
					defaultBranch: repo.defaultBranch,
					private: repo.private,
					envVarNames,
				})
				.onConflictDoNothing({
					target: [repos.organizationId, repos.githubRepoId],
				})
				.returning({ id: repos.id });

			if (inserted) {
				connected++;

				if (presetBudgets.length > 0) {
					await db.insert(budgets).values(
						presetBudgets.map((b) => ({
							repoId: inserted.id,
							metric: b.metric,
							max: b.max,
							severity: b.severity,
							action: (data.branchProtect
								? b.action
								: b.action === "block"
									? "comment"
									: b.action) as Action,
						})),
					);
				}
			} else {
				// Already connected to this org — "connecting" it again is how a
				// user regenerates the workflow (no separate disconnect flow yet),
				// so update the stored env var names and fall through to recommit
				// the workflow file below. Budgets are deliberately left untouched:
				// re-applying the preset here would clobber anything the user has
				// customized since.
				const [existing] = await db
					.update(repos)
					.set({ envVarNames })
					.where(
						and(
							eq(repos.organizationId, organizationId),
							eq(repos.githubRepoId, repo.id),
						),
					)
					.returning({ id: repos.id });
				if (!existing) continue; // shouldn't happen, but nothing to regenerate against
			}

			// The package manager comes from the repo's own lockfile — it isn't a
			// user preference, it's a fact about the project (installing with the
			// wrong one breaks against the committed lockfile).
			const packageManager = await detectPackageManager(
				accessToken,
				repo.fullName,
			);
			const pkg = await getPackageJson(accessToken, repo.fullName);

			// A user-typed override applies to every repo in this batch; otherwise
			// detect per-repo from package.json (each repo may serve differently).
			const startScript =
				data.startScript?.trim() ||
				pickServeScript(pkg?.scripts ?? {}) ||
				FALLBACK_START_SCRIPT;
			const port = data.port ?? DEFAULT_PORT;

			// pnpm/setup requires an exact version — it only reads one from
			// package.json's "packageManager" field itself, and most repos don't
			// declare one. Use the repo's pin when present (matches its lockfile
			// exactly), else "latest", an npm dist-tag pnpm/setup resolves itself.
			const pnpmVersionMatch = pkg?.packageManager?.match(/^pnpm@(.+)$/);
			const pnpmVersion = pnpmVersionMatch?.[1] ?? "latest";

			// Yarn Classic (v1) and Berry (v2+) are mutually incompatible and
			// Corepack's un-pinned fallback is always Classic — wrong whenever the
			// repo actually uses Berry. Trust an explicit pin when there is one
			// (matches whatever generated the lockfile); otherwise sniff the
			// lockfile itself, the only reliable signal when nothing is pinned.
			const yarnVersionMatch = pkg?.packageManager?.match(/^yarn@(.+)$/);
			const yarnVersion = yarnVersionMatch?.[1];
			const yarnIsBerry =
				packageManager === "yarn"
					? yarnVersion
						? !yarnVersion.startsWith("1.")
						: await isYarnBerryLockfile(accessToken, repo.fullName)
					: false;

			// Best-effort: a repo we can't write the workflow to (e.g. the OAuth
			// token doesn't cover it, or GitHub API hiccup) still stays connected
			// in Vitalgate — the user can add the workflow by hand.
			const workflowResult = await commitWorkflowFile(
				accessToken,
				repo.fullName,
				vitalgateWorkflowYaml({
					defaultBranch: repo.defaultBranch,
					githubRepoId: repo.id,
					packageManager,
					pnpmVersion,
					yarnIsBerry,
					yarnVersion,
					startScript,
					port,
					envVarNames,
					vitalgateOrigin,
				}),
			);
			if (workflowResult.status === "created") workflowsAdded++;
			if (workflowResult.status === "updated") workflowsUpdated++;
			if (workflowResult.status === "error") {
				workflowErrors.push(`${repo.fullName}: ${workflowResult.message}`);
			}
		}

		return { connected, workflowsAdded, workflowsUpdated, workflowErrors };
	});
