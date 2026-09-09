import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { formatMetric, metricDelta } from "@/lib/mock-data";
import { orgPullsQueryOptions } from "@/lib/pulls.queries";

export const Route = createFileRoute("/_authenticated/pulls/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(orgPullsQueryOptions()),
	head: () => ({ meta: [{ title: "Pull Requests: Vitalgate" }] }),
	component: Pulls,
});

function Pulls() {
	const { data: pulls } = useSuspenseQuery(orgPullsQueryOptions());

	return (
		<AppShell title="Pull Requests">
			{pulls.length === 0 ? (
				<Card className="p-10 text-center">
					<p className="text-sm text-muted-foreground">
						No pull requests recorded yet. They show up here once a connected
						repo's workflow reports a run.
					</p>
				</Card>
			) : (
				<Card className="p-0 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
							<tr>
								<th className="text-left font-medium px-5 py-3">PR</th>
								<th className="text-left font-medium px-5 py-3">Title</th>
								<th className="text-left font-medium px-5 py-3">Repo</th>
								<th className="text-left font-medium px-5 py-3">LCP</th>
								<th className="text-left font-medium px-5 py-3">Score</th>
								<th className="text-left font-medium px-5 py-3">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{pulls.map((p) => {
								const lcp =
									p.metrics.LCP != null && p.baseline.LCP != null
										? metricDelta("LCP", p.metrics.LCP, p.baseline.LCP)
										: null;
								const perf =
									p.metrics.PERF != null && p.baseline.PERF != null
										? metricDelta("PERF", p.metrics.PERF, p.baseline.PERF)
										: null;
								return (
									<tr key={p.id} className="hover:bg-muted/30">
										<td className="px-5 py-3 font-mono text-xs text-muted-foreground">
											#{p.number}
										</td>
										<td className="px-5 py-3">
											<Link
												to="/pulls/$prId"
												params={{ prId: p.id }}
												className="font-medium hover:text-primary"
											>
												{p.title}
											</Link>
											<div className="text-xs text-muted-foreground font-mono">
												{p.author} · {timeAgo(p.openedAt)}
											</div>
										</td>
										<td className="px-5 py-3 font-mono text-xs">
											{p.repoFullName}
										</td>
										<td className="px-5 py-3 font-mono">
											{p.metrics.LCP == null ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<>
													<span>{formatMetric("LCP", p.metrics.LCP)}</span>{" "}
													{lcp && (
														<span
															className={`text-xs ml-1 ${lcp.better ? "text-success" : "text-destructive"}`}
														>
															{lcp.diff >= 0 ? "+" : ""}
															{lcp.pct.toFixed(0)}%
														</span>
													)}
												</>
											)}
										</td>
										<td className="px-5 py-3 font-mono">
											{p.metrics.PERF == null ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<>
													<span>{p.metrics.PERF}</span>{" "}
													{perf && (
														<span
															className={`text-xs ml-1 ${perf.better ? "text-success" : "text-destructive"}`}
														>
															{perf.diff >= 0 ? "+" : ""}
															{perf.diff}
														</span>
													)}
												</>
											)}
										</td>
										<td className="px-5 py-3">
											<StatusBadge status={p.status} />
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</Card>
			)}
		</AppShell>
	);
}
