import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Budget,
	formatMetric,
	getRepo,
	METRIC_META,
	PRS,
	timeSeries,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/repositories/$repoId")({
	loader: ({ params }) => {
		const repo = getRepo(params.repoId);
		if (!repo) throw notFound();
		return { repo };
	},
	head: ({ params }) => ({ meta: [{ title: `${params.repoId}: Budgetly` }] }),
	notFoundComponent: () => (
		<AppShell title="Repository not found">
			<p className="text-muted-foreground">No repo with that id.</p>
		</AppShell>
	),
	component: RepoDetail,
});

function RepoDetail() {
	const { repo } = Route.useLoaderData();
	const prs = PRS.filter((p) => p.repoId === repo.id);
	const series = timeSeries(repo.id, 30);

	return (
		<AppShell>
			<div className="flex flex-wrap items-end justify-between gap-4 mb-6">
				<div>
					<Link
						to="/repositories"
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						← Repositories
					</Link>
					<h1 className="mt-2 text-2xl font-semibold tracking-tight font-mono">
						{repo.fullName}
					</h1>
					<p className="text-xs text-muted-foreground">
						Default branch{" "}
						<span className="font-mono">{repo.defaultBranch}</span> · last run{" "}
						{repo.lastRun}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-right">
						<div className="text-xs uppercase tracking-wider text-muted-foreground">
							Health
						</div>
						<div className="font-mono text-2xl font-semibold">
							{repo.health}
							<span className="text-sm text-muted-foreground">/100</span>
						</div>
					</div>
				</div>
			</div>

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="pulls">Pull Requests</TabsTrigger>
					<TabsTrigger value="budgets">Budgets</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6 space-y-4">
					<Card className="p-5">
						<h2 className="font-semibold">Performance Score</h2>
						<div className="mt-4 h-56">
							<ResponsiveContainer>
								<AreaChart
									data={series}
									margin={{ left: -10, right: 8, top: 8 }}
								>
									<defs>
										<linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="0%"
												stopColor="var(--color-success)"
												stopOpacity={0.5}
											/>
											<stop
												offset="100%"
												stopColor="var(--color-success)"
												stopOpacity={0}
											/>
										</linearGradient>
									</defs>
									<XAxis
										dataKey="date"
										tick={{ fontSize: 10 }}
										stroke="var(--color-muted-foreground)"
									/>
									<YAxis
										domain={[40, 100]}
										tick={{ fontSize: 10 }}
										stroke="var(--color-muted-foreground)"
									/>
									<Tooltip
										contentStyle={{
											background: "var(--color-card)",
											border: "1px solid var(--color-border)",
											fontSize: 12,
										}}
									/>
									<Area
										dataKey="perf"
										stroke="var(--color-success)"
										strokeWidth={2}
										fill="url(#r1)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</Card>
					<div className="grid md:grid-cols-2 gap-4">
						<Card className="p-5">
							<h2 className="font-semibold">LCP trend</h2>
							<div className="mt-4 h-40">
								<ResponsiveContainer>
									<AreaChart
										data={series}
										margin={{ left: -10, right: 8, top: 8 }}
									>
										<XAxis
											dataKey="date"
											tick={{ fontSize: 10 }}
											stroke="var(--color-muted-foreground)"
										/>
										<YAxis
											tick={{ fontSize: 10 }}
											stroke="var(--color-muted-foreground)"
										/>
										<Tooltip
											contentStyle={{
												background: "var(--color-card)",
												border: "1px solid var(--color-border)",
												fontSize: 12,
											}}
										/>
										<Area
											dataKey="lcp"
											stroke="var(--color-chart-3)"
											fill="var(--color-chart-3)"
											fillOpacity={0.18}
											strokeWidth={2}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</Card>
						<Card className="p-5">
							<h2 className="font-semibold">INP trend</h2>
							<div className="mt-4 h-40">
								<ResponsiveContainer>
									<AreaChart
										data={series}
										margin={{ left: -10, right: 8, top: 8 }}
									>
										<XAxis
											dataKey="date"
											tick={{ fontSize: 10 }}
											stroke="var(--color-muted-foreground)"
										/>
										<YAxis
											tick={{ fontSize: 10 }}
											stroke="var(--color-muted-foreground)"
										/>
										<Tooltip
											contentStyle={{
												background: "var(--color-card)",
												border: "1px solid var(--color-border)",
												fontSize: 12,
											}}
										/>
										<Area
											dataKey="inp"
											stroke="var(--color-chart-4)"
											fill="var(--color-chart-4)"
											fillOpacity={0.18}
											strokeWidth={2}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="pulls" className="mt-6">
					<Card className="p-0 overflow-hidden">
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
								<tr>
									<th className="text-left font-medium px-5 py-3">PR</th>
									<th className="text-left font-medium px-5 py-3">Title</th>
									<th className="text-left font-medium px-5 py-3">Author</th>
									<th className="text-left font-medium px-5 py-3">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{prs.map((p) => (
									<tr key={p.id} className="hover:bg-muted/30">
										<td className="px-5 py-3 font-mono">#{p.number}</td>
										<td className="px-5 py-3">
											<Link
												to="/pulls/$prId"
												params={{ prId: p.id }}
												className="font-medium hover:text-primary"
											>
												{p.title}
											</Link>
										</td>
										<td className="px-5 py-3 text-muted-foreground">
											{p.author}
										</td>
										<td className="px-5 py-3">
											<StatusBadge status={p.status} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</Card>
				</TabsContent>

				<TabsContent value="budgets" className="mt-6">
					<Card className="p-0 overflow-hidden">
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
								<tr>
									<th className="text-left font-medium px-5 py-3">Metric</th>
									<th className="text-left font-medium px-5 py-3">Limit</th>
									<th className="text-left font-medium px-5 py-3">Severity</th>
									<th className="text-left font-medium px-5 py-3">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{(repo.budgets as Budget[]).map((b) => (
									<tr key={b.metric}>
										<td className="px-5 py-3">
											<span className="font-mono font-medium">{b.metric}</span>{" "}
											<span className="text-xs text-muted-foreground ml-2">
												{METRIC_META[b.metric].label}
											</span>
										</td>
										<td className="px-5 py-3 font-mono">
											{formatMetric(b.metric, b.max)}
										</td>
										<td className="px-5 py-3">
											<span
												className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${b.severity === "fail" ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-warning-foreground"}`}
											>
												{b.severity}
											</span>
										</td>
										<td className="px-5 py-3 font-mono text-xs text-muted-foreground">
											{b.action}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="mt-6">
					<Card className="p-5">
						<h2 className="font-semibold">Audit history</h2>
						<ul className="mt-4 space-y-3 text-sm">
							{[
								"Budget LCP changed from 3000ms → 2500ms",
								"Connected to GitHub App v1.4",
								"Slack channel #perf-alerts added",
								"PR #1009 blocked by INP budget",
								"Baseline rebuilt on main",
							].map((m, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static log, index is the display value too
								<li key={i} className="flex gap-3">
									<span className="font-mono text-xs text-muted-foreground">
										{i + 1}d ago
									</span>
									<span>{m}</span>
								</li>
							))}
						</ul>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="mt-6 space-y-4">
					<Card className="p-5">
						<h2 className="font-semibold">Repository settings</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Branch protection, runner region, and webhook delivery
							preferences.
						</p>
						<div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
							<div>
								<div className="text-xs text-muted-foreground">
									Runner region
								</div>
								<div className="mt-1 font-mono">us-east-1</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">
									Lighthouse passes
								</div>
								<div className="mt-1 font-mono">3 (median)</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Form factor</div>
								<div className="mt-1 font-mono">mobile + desktop</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Throttling</div>
								<div className="mt-1 font-mono">Slow 4G</div>
							</div>
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</AppShell>
	);
}
