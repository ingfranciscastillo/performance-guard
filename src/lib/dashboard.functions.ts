import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { alerts, pullRequests, repos } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";

export interface DashboardStats {
	repoCount: number;
	newReposThisWeek: number;
	/** Total PRs Vitalgate has recorded for the org — not "open" vs "closed", see RepoListItem. */
	prCount: number;
	newPrsToday: number;
	/** PRs currently in a failing state (latest run per PR), not a historical count. */
	failingBudgets: number;
	/** Non-info alerts fired in the last 7 days. */
	activeAlerts: number;
	criticalAlerts: number;
}

export interface DashboardSeriesPoint {
	date: string;
	/** Median (p50) performance score across every repo's runs that day, or null if none ran. */
	perf: number | null;
}

export interface DashboardOverview {
	stats: DashboardStats;
	series: DashboardSeriesPoint[];
}

const EMPTY_OVERVIEW: DashboardOverview = {
	stats: {
		repoCount: 0,
		newReposThisWeek: 0,
		prCount: 0,
		newPrsToday: 0,
		failingBudgets: 0,
		activeAlerts: 0,
		criticalAlerts: 0,
	},
	series: [],
};

export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardOverview> => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) return EMPTY_OVERVIEW;

		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);

		const [[repoAgg], [prAgg], [alertAgg], seriesRows] = await Promise.all([
			db
				.select({
					total: sql<string>`count(*)`,
					newThisWeek: sql<string>`count(*) filter (where ${repos.createdAt} >= ${sevenDaysAgo})`,
				})
				.from(repos)
				.where(eq(repos.organizationId, organizationId)),

			db
				.select({
					total: sql<string>`count(*)`,
					newToday: sql<string>`count(*) filter (where ${pullRequests.openedAt} >= ${startOfToday})`,
					failing: sql<string>`count(*) filter (where ${pullRequests.status} = 'failing')`,
				})
				.from(pullRequests)
				.innerJoin(repos, eq(pullRequests.repoId, repos.id))
				.where(eq(repos.organizationId, organizationId)),

			db
				.select({
					active: sql<string>`count(*) filter (where ${alerts.level} != 'info' and ${alerts.createdAt} >= ${sevenDaysAgo})`,
					critical: sql<string>`count(*) filter (where ${alerts.level} = 'critical' and ${alerts.createdAt} >= ${sevenDaysAgo})`,
				})
				.from(alerts)
				.innerJoin(repos, eq(alerts.repoId, repos.id))
				.where(eq(repos.organizationId, organizationId)),

			db
				.select({
					date: sql<string>`to_char(date_trunc('day', ${pullRequests.openedAt}), 'MM-DD')`,
					perf: sql<
						string | null
					>`percentile_cont(0.5) within group (order by (${pullRequests.metrics}->>'PERF')::numeric)`,
				})
				.from(pullRequests)
				.innerJoin(repos, eq(pullRequests.repoId, repos.id))
				.where(
					and(
						eq(repos.organizationId, organizationId),
						gte(pullRequests.openedAt, thirtyDaysAgo),
					),
				)
				.groupBy(sql`date_trunc('day', ${pullRequests.openedAt})`)
				.orderBy(sql`date_trunc('day', ${pullRequests.openedAt})`),
		]);

		return {
			stats: {
				repoCount: Number(repoAgg?.total ?? 0),
				newReposThisWeek: Number(repoAgg?.newThisWeek ?? 0),
				prCount: Number(prAgg?.total ?? 0),
				newPrsToday: Number(prAgg?.newToday ?? 0),
				failingBudgets: Number(prAgg?.failing ?? 0),
				activeAlerts: Number(alertAgg?.active ?? 0),
				criticalAlerts: Number(alertAgg?.critical ?? 0),
			},
			series: seriesRows.map((r) => ({
				date: r.date,
				perf: r.perf != null ? Math.round(Number(r.perf)) : null,
			})),
		};
	},
);
