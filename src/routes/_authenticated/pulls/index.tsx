import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";
import { formatMetric, metricDelta } from "@/lib/mock-data";
import { EASE_IN, staggerContainer, staggerItem } from "@/lib/motion";
import { orgPullsQueryOptions } from "@/lib/pulls.queries";

export const Route = createFileRoute("/_authenticated/pulls/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(orgPullsQueryOptions()),
	head: () => ({ meta: [{ title: "Pull Requests: Vitalgate" }] }),
	component: Pulls,
});

function Pulls() {
	const { data: pulls } = useSuspenseQuery(orgPullsQueryOptions());
	const [query, setQuery] = useState("");
	const [repoId, setRepoId] = useState("all");
	const reduce = useReducedMotion();

	const repoOptions = useMemo(() => {
		const seen = new Map<string, string>();
		for (const p of pulls) seen.set(p.repoId, p.repoFullName);
		return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
	}, [pulls]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return pulls.filter((p) => {
			if (repoId !== "all" && p.repoId !== repoId) return false;
			if (!q) return true;
			return (
				p.title.toLowerCase().includes(q) ||
				p.author.toLowerCase().includes(q) ||
				p.repoFullName.toLowerCase().includes(q)
			);
		});
	}, [pulls, query, repoId]);

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
				<>
					<div className="mb-4 flex flex-wrap items-center gap-3">
						<div className="relative max-w-sm flex-1">
							<MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search title, author, repo…"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="h-9 pl-8"
							/>
						</div>
						<select
							value={repoId}
							onChange={(e) => setRepoId(e.target.value)}
							className="h-9 rounded-md border border-input bg-background px-3 text-sm"
						>
							<option value="all">All repositories</option>
							{repoOptions.map(([id, fullName]) => (
								<option key={id} value={id}>
									{fullName}
								</option>
							))}
						</select>
					</div>
					{filtered.length === 0 ? (
						<Card className="p-10 text-center">
							<p className="text-sm text-muted-foreground">
								No pull requests match your filters.
							</p>
						</Card>
					) : (
						<Card className="p-0 overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
										<tr>
											<th className="text-left font-medium px-5 py-3">PR</th>
											<th className="text-left font-medium px-5 py-3">Title</th>
											<th className="text-left font-medium px-5 py-3">Repo</th>
											<th className="text-left font-medium px-5 py-3">LCP</th>
											<th className="text-left font-medium px-5 py-3">Score</th>
											<th className="text-left font-medium px-5 py-3">
												Status
											</th>
										</tr>
									</thead>
									<motion.tbody
										className="divide-y divide-border"
										variants={staggerContainer}
										initial="hidden"
										animate="show"
									>
										<AnimatePresence mode="popLayout">
											{filtered.map((p) => {
												const lcp =
													p.metrics.LCP != null && p.baseline.LCP != null
														? metricDelta("LCP", p.metrics.LCP, p.baseline.LCP)
														: null;
												const perf =
													p.metrics.PERF != null && p.baseline.PERF != null
														? metricDelta(
																"PERF",
																p.metrics.PERF,
																p.baseline.PERF,
															)
														: null;
												return (
													<motion.tr
														key={p.id}
														layout
														variants={staggerItem(reduce)}
														exit={{
															opacity: 0,
															transition: { duration: 0.15, ease: EASE_IN },
														}}
														className="hover:bg-muted/30"
													>
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
																	<span>
																		{formatMetric("LCP", p.metrics.LCP)}
																	</span>{" "}
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
													</motion.tr>
												);
											})}
										</AnimatePresence>
									</motion.tbody>
								</table>
							</div>
						</Card>
					)}
				</>
			)}
		</AppShell>
	);
}
