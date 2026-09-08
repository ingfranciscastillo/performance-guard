import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, budgets, repos } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import { type GhRepo, listGithubRepos } from "@/lib/github";
import type { Action, MetricKey, Severity } from "@/lib/mock-data";

export const getConnectableRepos = createServerFn({ method: "GET" }).handler(
	async (): Promise<GhRepo[]> => {
		const session = await ensureSession();

		const [githubAccount] = await db
			.select({ accessToken: account.accessToken })
			.from(account)
			.where(
				and(
					eq(account.userId, session.user.id),
					eq(account.providerId, "github"),
				),
			)
			.limit(1);

		if (!githubAccount?.accessToken) {
			throw new Error(
				"No GitHub account connected. Sign in with GitHub to connect repositories.",
			);
		}

		return listGithubRepos(githubAccount.accessToken);
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

		const presetBudgets = PRESET_BUDGETS[data.preset] ?? [];
		let connected = 0;

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
				})
				.onConflictDoNothing({
					target: [repos.organizationId, repos.githubRepoId],
				})
				.returning({ id: repos.id });

			if (!inserted) continue; // already connected to this org
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
		}

		return { connected };
	});
