import {
	ArrowDownRightIcon,
	ArrowUpRightIcon,
	CheckCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import {
	type Budget,
	formatMetric,
	getPr,
	getRepo,
	METRIC_META,
	type MetricKey,
	metricDelta,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/pulls/$prId")({
	loader: ({ params }) => {
		const pr = getPr(params.prId);
		if (!pr) throw notFound();
		const repo = getRepo(pr.repoId);
		if (!repo) throw notFound();
		return { pr, repo };
	},
	head: ({ params }) => ({ meta: [{ title: `PR ${params.prId}: Budgetly` }] }),
	notFoundComponent: () => (
		<AppShell title="PR not found">
			<p className="text-muted-foreground">No PR with that id.</p>
		</AppShell>
	),
	component: PrDetail,
});

function PrDetail() {
	const { pr, repo } = Route.useLoaderData();
	const metrics = Object.keys(pr.metrics) as MetricKey[];
	const budgetMap = Object.fromEntries(
		(repo.budgets as Budget[]).map((b) => [b.metric, b]),
	) as Record<MetricKey, Budget | undefined>;

	return (
		<AppShell>
			<div className="mb-6">
				<Link
					to="/pulls"
					className="text-xs text-muted-foreground hover:text-foreground"
				>
					← Pull Requests
				</Link>
				<div className="mt-2 flex flex-wrap items-center gap-3">
					<span className="font-mono text-sm text-muted-foreground">
						{repo.fullName} · #{pr.number}
					</span>
					<StatusBadge status={pr.status} />
				</div>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight">
					{pr.title}
				</h1>
				<div className="mt-1 text-xs text-muted-foreground font-mono">
					{pr.branch} → {repo.defaultBranch} · {pr.author} · opened{" "}
					{pr.openedAt}
				</div>
			</div>

			<Card
				className={`p-5 mb-5 border ${pr.status === "failing" ? "border-destructive/40 bg-destructive/5" : pr.status === "warning" ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5"}`}
			>
				<div className="flex items-start gap-3">
					{pr.status === "passing" ? (
						<CheckCircleIcon className="h-5 w-5 text-success mt-0.5" />
					) : (
						<XCircleIcon className="h-5 w-5 text-destructive mt-0.5" />
					)}
					<div>
						<div className="font-semibold">
							{pr.status === "passing"
								? "All budgets within range"
								: pr.status === "warning"
									? "Soft budgets crossed"
									: "Required budget violated, merge blocked"}
						</div>
						<div className="text-sm text-muted-foreground mt-0.5">
							{pr.status === "failing"
								? "This PR cannot be merged until the failing metric is within its budget or an admin overrides it."
								: "Review the deltas below before merging."}
						</div>
					</div>
				</div>
			</Card>

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{metrics.map((k) => (
					<MetricCard
						key={k}
						metric={k}
						value={pr.metrics[k]}
						baseline={pr.baseline[k]}
						budget={budgetMap[k]?.max}
					/>
				))}
			</div>

			<Card className="mt-6 p-0 overflow-hidden">
				<div className="px-5 py-3 border-b border-border bg-muted/30 font-semibold text-sm">
					Detailed comparison
				</div>
				<table className="w-full text-sm">
					<thead className="text-xs uppercase tracking-wider text-muted-foreground">
						<tr>
							<th className="text-left font-medium px-5 py-2.5">Metric</th>
							<th className="text-left font-medium px-5 py-2.5">
								Baseline (main)
							</th>
							<th className="text-left font-medium px-5 py-2.5">This PR</th>
							<th className="text-left font-medium px-5 py-2.5">Δ</th>
							<th className="text-left font-medium px-5 py-2.5">Budget</th>
							<th className="text-left font-medium px-5 py-2.5">Result</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{metrics.map((k) => {
							const d = metricDelta(k, pr.metrics[k], pr.baseline[k]);
							const b = budgetMap[k];
							const violates = b
								? k === "PERF"
									? pr.metrics[k] < b.max
									: pr.metrics[k] > b.max
								: false;
							return (
								<tr key={k}>
									<td className="px-5 py-3">
										<span className="font-mono font-medium">{k}</span>{" "}
										<span className="text-xs text-muted-foreground ml-2">
											{METRIC_META[k].label}
										</span>
									</td>
									<td className="px-5 py-3 font-mono">
										{formatMetric(k, pr.baseline[k])}
									</td>
									<td className="px-5 py-3 font-mono">
										{formatMetric(k, pr.metrics[k])}
									</td>
									<td
										className={`px-5 py-3 font-mono inline-flex items-center gap-1 ${d.better ? "text-success" : d.diff === 0 ? "text-muted-foreground" : "text-destructive"}`}
									>
										{d.better ? (
											<ArrowDownRightIcon className="h-3 w-3" />
										) : d.diff === 0 ? null : (
											<ArrowUpRightIcon className="h-3 w-3" />
										)}
										{d.pct >= 0 ? "+" : ""}
										{d.pct.toFixed(1)}%
									</td>
									<td className="px-5 py-3 font-mono">
										{b ? formatMetric(k, b.max) : "-"}
									</td>
									<td className="px-5 py-3">
										{violates ? (
											<span className="text-destructive font-medium text-xs">
												{b?.severity === "fail" ? "BLOCKED" : "WARN"}
											</span>
										) : (
											<span className="text-success text-xs">OK</span>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>

			<Card className="mt-6 p-5">
				<h2 className="font-semibold">Posted to GitHub</h2>
				<pre className="mt-4 p-4 rounded-md bg-muted/50 border border-border font-mono text-xs overflow-x-auto whitespace-pre-wrap">
					{`## 🟢 Budgetly performance report

| Metric | Baseline | PR | Δ |
|---|---|---|---|
${metrics.map((k) => `| ${k} | ${formatMetric(k, pr.baseline[k])} | ${formatMetric(k, pr.metrics[k])} | ${metricDelta(k, pr.metrics[k], pr.baseline[k]).pct.toFixed(1)}% |`).join("\n")}

${pr.status === "failing" ? "❌ Merge blocked: at least one required budget was violated." : pr.status === "warning" ? "⚠️  Soft budgets crossed, review before merging." : "✅ All budgets within range."}`}
				</pre>
			</Card>
		</AppShell>
	);
}
