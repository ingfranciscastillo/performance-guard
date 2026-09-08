import { createServerFn } from "@tanstack/react-start";
import { count, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { pullRequests, repos } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";

export interface RepoListItem {
	id: string;
	fullName: string;
	defaultBranch: string;
	/** Total PRs Budgetly has recorded for this repo. There's no GitHub webhook
	 * ingestion yet, so this is always 0 until that exists — not "open" vs
	 * "closed", since we don't track PR state at all yet. */
	prCount: number;
	lastRunAt: string | null;
	/** Average Performance Score across recorded PRs, or null if there are none yet. */
	avgPerf: number | null;
}

export const getOrgRepos = createServerFn({ method: "GET" }).handler(
	async (): Promise<RepoListItem[]> => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) return [];

		const rows = await db
			.select({
				id: repos.id,
				fullName: repos.fullName,
				defaultBranch: repos.defaultBranch,
				prCount: count(pullRequests.id),
				lastRunAt: max(pullRequests.openedAt),
				avgPerf: sql<
					string | null
				>`avg((${pullRequests.metrics}->>'PERF')::numeric)`,
			})
			.from(repos)
			.leftJoin(pullRequests, eq(pullRequests.repoId, repos.id))
			.where(eq(repos.organizationId, organizationId))
			.groupBy(repos.id)
			.orderBy(repos.fullName);

		return rows.map((r) => ({
			id: r.id,
			fullName: r.fullName,
			defaultBranch: r.defaultBranch,
			prCount: Number(r.prCount),
			lastRunAt: r.lastRunAt ? new Date(r.lastRunAt).toISOString() : null,
			avgPerf: r.avgPerf != null ? Math.round(Number(r.avgPerf)) : null,
		}));
	},
);
