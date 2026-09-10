import { PlusIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppShell } from "@/components/app-shell";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { EASE_IN, staggerContainer, staggerItem } from "@/lib/motion";
import { orgReposQueryOptions } from "@/lib/repos.queries";

export const Route = createFileRoute("/_authenticated/repositories/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(orgReposQueryOptions()),
	head: () => ({ meta: [{ title: "Repositories: Vitalgate" }] }),
	component: Repos,
});

function Repos() {
	const { data: repos } = useSuspenseQuery(orgReposQueryOptions());
	const reduce = useReducedMotion();

	return (
		<AppShell title="Repositories">
			<div className="flex items-center justify-between mb-5">
				<p className="text-sm text-muted-foreground">
					{repos.length} repositories connected via GitHub App.
				</p>
				<Link to="/repositories/new">
					<Button className="group">
						<PlusIcon className="h-4 w-4 mr-1.5 transition-transform duration-150 ease-out group-hover:rotate-90" />
						Connect repo
					</Button>
				</Link>
			</div>
			{repos.length === 0 ? (
				<Card className="p-10 text-center">
					<p className="text-sm text-muted-foreground">
						No repositories connected yet.
					</p>
					<Link to="/repositories/new" className="mt-4 inline-block">
						<Button size="sm">
							<PlusIcon className="h-4 w-4 mr-1.5" /> Connect a repository
						</Button>
					</Link>
				</Card>
			) : (
				<Reveal>
					<Card className="overflow-hidden p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
									<tr>
										<th className="text-left font-medium px-5 py-3">
											Repository
										</th>
										<th className="text-left font-medium px-5 py-3">
											Default branch
										</th>
										<th className="text-left font-medium px-5 py-3">
											PRs tracked
										</th>
										<th className="text-left font-medium px-5 py-3">Health</th>
										<th className="text-left font-medium px-5 py-3">
											Last run
										</th>
										<th />
									</tr>
								</thead>
								<motion.tbody
									className="divide-y divide-border"
									variants={staggerContainer}
									initial="hidden"
									animate="show"
								>
									<AnimatePresence initial={false} mode="popLayout">
										{repos.map((r) => (
											<motion.tr
												key={r.id}
												layout
												variants={staggerItem(reduce)}
												exit={{
													opacity: 0,
													transition: { duration: 0.15, ease: EASE_IN },
												}}
												className="hover:bg-muted/30"
											>
												<td className="px-5 py-3">
													<Link
														to="/repositories/$repoId"
														params={{ repoId: r.id }}
														className="font-medium hover:text-primary"
													>
														{r.fullName}
													</Link>
												</td>
												<td className="px-5 py-3 font-mono text-xs text-muted-foreground">
													{r.defaultBranch}
												</td>
												<td className="px-5 py-3 font-mono">{r.prCount}</td>
												<td className="px-5 py-3">
													{r.avgPerf == null ? (
														<span className="font-mono text-muted-foreground">
															—
														</span>
													) : (
														<span
															className={`font-mono ${r.avgPerf > 85 ? "text-success" : r.avgPerf > 70 ? "text-warning-foreground" : "text-destructive"}`}
														>
															{r.avgPerf}/100
														</span>
													)}
												</td>
												<td className="px-5 py-3 text-muted-foreground">
													{timeAgo(r.lastRunAt)}
												</td>
												<td className="px-5 py-3 text-right">
													<Link
														to="/repositories/$repoId"
														params={{ repoId: r.id }}
														className="text-xs text-primary hover:underline"
													>
														Open
													</Link>
												</td>
											</motion.tr>
										))}
									</AnimatePresence>
								</motion.tbody>
							</table>
						</div>
					</Card>
				</Reveal>
			)}
		</AppShell>
	);
}
