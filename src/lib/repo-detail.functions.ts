import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets, pullRequests, repos } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import type { Action, MetricKey, PrStatus, Severity } from "@/lib/mock-data";

export interface RepoDetailBudget {
	metric: MetricKey;
	max: number;
	severity: Severity;
	action: Action;
}

export interface RepoDetailPull {
	id: string;
	number: number;
	title: string;
	author: string;
	status: PrStatus;
}

export interface RepoDetailSeriesPoint {
	date: string;
	lcp: number | null;
	inp: number | null;
	perf: number | null;
}

export interface RepoDetail {
	id: string;
	fullName: string;
	defaultBranch: string;
	avgPerf: number | null;
	lastRunAt: string | null;
	budgets: RepoDetailBudget[];
	pulls: RepoDetailPull[];
	series: RepoDetailSeriesPoint[];
}

export const getRepoDetail = createServerFn({ method: "GET" })
	.validator((repoId: string) => repoId)
	.handler(async ({ data: repoId }): Promise<RepoDetail | null> => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) return null;

		// Scoped to the active org, not just the id — a UUID guess from another
		// org's repo must not leak data.
		const [repo] = await db
			.select({
				id: repos.id,
				fullName: repos.fullName,
				defaultBranch: repos.defaultBranch,
			})
			.from(repos)
			.where(
				and(eq(repos.id, repoId), eq(repos.organizationId, organizationId)),
			)
			.limit(1);
		if (!repo) return null;

		const [budgetRows, pullRows, [agg], seriesRows] = await Promise.all([
			db
				.select({
					metric: budgets.metric,
					max: budgets.max,
					severity: budgets.severity,
					action: budgets.action,
				})
				.from(budgets)
				.where(eq(budgets.repoId, repoId)),
			db
				.select({
					id: pullRequests.id,
					number: pullRequests.number,
					title: pullRequests.title,
					author: pullRequests.author,
					status: pullRequests.status,
				})
				.from(pullRequests)
				.where(eq(pullRequests.repoId, repoId))
				.orderBy(desc(pullRequests.openedAt)),
			db
				.select({
					avgPerf: sql<
						string | null
					>`avg((${pullRequests.metrics}->>'PERF')::numeric)`,
					lastRunAt: max(pullRequests.openedAt),
				})
				.from(pullRequests)
				.where(eq(pullRequests.repoId, repoId)),
			db
				.select({
					date: sql<string>`to_char(date_trunc('day', ${pullRequests.openedAt}), 'MM-DD')`,
					lcp: sql<
						string | null
					>`avg((${pullRequests.metrics}->>'LCP')::numeric)`,
					inp: sql<
						string | null
					>`avg((${pullRequests.metrics}->>'INP')::numeric)`,
					perf: sql<
						string | null
					>`avg((${pullRequests.metrics}->>'PERF')::numeric)`,
				})
				.from(pullRequests)
				.where(eq(pullRequests.repoId, repoId))
				.groupBy(sql`date_trunc('day', ${pullRequests.openedAt})`)
				.orderBy(sql`date_trunc('day', ${pullRequests.openedAt})`),
		]);

		return {
			id: repo.id,
			fullName: repo.fullName,
			defaultBranch: repo.defaultBranch,
			avgPerf: agg?.avgPerf != null ? Math.round(Number(agg.avgPerf)) : null,
			lastRunAt: agg?.lastRunAt ? new Date(agg.lastRunAt).toISOString() : null,
			budgets: budgetRows,
			pulls: pullRows,
			series: seriesRows.map((r) => ({
				date: r.date,
				lcp: r.lcp != null ? Number(r.lcp) : null,
				inp: r.inp != null ? Number(r.inp) : null,
				perf: r.perf != null ? Number(r.perf) : null,
			})),
		};
	});
