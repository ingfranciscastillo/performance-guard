import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { alerts, budgets, pullRequests, repos } from "@/db/schema";
import type { MetricKey, PrStatus, Severity } from "@/lib/mock-data";
import { verifyOrgToken } from "@/lib/verify-org-token.server";

const metricsSchema = z
	.object({
		LCP: z.number().optional(),
		INP: z.number().optional(),
		CLS: z.number().optional(),
		FCP: z.number().optional(),
		TBT: z.number().optional(),
		PERF: z.number().optional(),
	})
	.strict();

const ingestBodySchema = z.object({
	githubRepoId: z.string().min(1),
	prNumber: z.number().int().positive(),
	prTitle: z.string().min(1),
	prAuthor: z.string().min(1),
	branch: z.string().min(1),
	metrics: metricsSchema,
});

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function violatesBudget(metric: MetricKey, value: number, max: number) {
	return metric === "PERF" ? value < max : value > max;
}

async function handleIngest(request: Request) {
	const authHeader = request.headers.get("authorization") ?? "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
	if (!token) return json({ error: "Missing bearer token" }, 401);

	const organizationId = await verifyOrgToken(token);
	if (!organizationId) return json({ error: "Invalid token" }, 401);

	let bodyJson: unknown;
	try {
		bodyJson = await request.json();
	} catch {
		return json({ error: "Body must be JSON" }, 400);
	}

	const parsed = ingestBodySchema.safeParse(bodyJson);
	if (!parsed.success) {
		return json({ error: "Invalid payload", issues: parsed.error.issues }, 400);
	}
	const body = parsed.data;

	const [repo] = await db
		.select({ id: repos.id })
		.from(repos)
		.where(
			and(
				eq(repos.organizationId, organizationId),
				eq(repos.githubRepoId, body.githubRepoId),
			),
		)
		.limit(1);
	if (!repo) {
		return json(
			{ error: "Repo not connected to this organization on Budgetly" },
			404,
		);
	}

	const budgetRows = await db
		.select({
			metric: budgets.metric,
			max: budgets.max,
			severity: budgets.severity,
		})
		.from(budgets)
		.where(eq(budgets.repoId, repo.id));

	let status: PrStatus = "passing";
	const violations: {
		metric: MetricKey;
		value: number;
		max: number;
		severity: Severity;
	}[] = [];
	for (const b of budgetRows) {
		const value = body.metrics[b.metric];
		if (value == null) continue; // Lighthouse didn't report this metric this run
		if (violatesBudget(b.metric, value, b.max)) {
			violations.push({
				metric: b.metric,
				value,
				max: b.max,
				severity: b.severity,
			});
			if (b.severity === "fail") status = "failing";
			else if (status === "passing") status = "warning";
		}
	}

	// Baseline for a brand-new PR row: the repo's most recent other run, or
	// itself if this is the first run ever recorded (nothing to regress from).
	const [lastRun] = await db
		.select({ metrics: pullRequests.metrics })
		.from(pullRequests)
		.where(eq(pullRequests.repoId, repo.id))
		.orderBy(desc(pullRequests.openedAt))
		.limit(1);
	const baseline = lastRun?.metrics ?? body.metrics;

	await db
		.insert(pullRequests)
		.values({
			repoId: repo.id,
			number: body.prNumber,
			title: body.prTitle,
			author: body.prAuthor,
			branch: body.branch,
			status,
			openedAt: new Date(),
			metrics: body.metrics,
			baseline,
		})
		.onConflictDoUpdate({
			target: [pullRequests.repoId, pullRequests.number],
			// baseline/openedAt intentionally not touched — a re-run (new commit
			// pushed to the same PR) keeps comparing against the original baseline.
			set: {
				title: body.prTitle,
				author: body.prAuthor,
				branch: body.branch,
				status,
				metrics: body.metrics,
			},
		});

	// One alert row per failing run — a required (severity "fail") budget was
	// violated, the case the "Budget violation" rule on /alerts describes.
	// "warning"-only runs don't alert: those are soft budgets, not blockers.
	if (status === "failing") {
		const failed = violations.filter((v) => v.severity === "fail");
		const message =
			failed.length === 1
				? `PR #${body.prNumber} exceeded the ${failed[0].metric} budget (${failed[0].value} vs max ${failed[0].max}).`
				: `PR #${body.prNumber} exceeded ${failed.length} required budgets: ${failed.map((v) => v.metric).join(", ")}.`;
		await db.insert(alerts).values({
			repoId: repo.id,
			// No channel integrations (Slack/Discord/email) are wired up yet —
			// "email" is a placeholder until real delivery exists to pick from.
			channel: "email",
			level: "critical",
			title: "Budget violation",
			message,
		});
	}

	return json({ status, violations });
}

export const Route = createFileRoute("/api/ingest")({
	server: {
		handlers: {
			POST: ({ request }) => handleIngest(request),
		},
	},
});
