import {
	ArrowRight,
	Bell,
	GitPullRequest,
	ShieldCheck,
	ShieldWarning,
	TrendDown,
	TrendUp,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { ALERTS, PRS, REPOS, timeSeries } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [{ title: "Dashboard: Budgetly" }] }),
	component: Dashboard,
});

function Dashboard() {
	const series = timeSeries("global", 30);
	const stats = [
		{
			label: "Repositories",
			value: REPOS.length,
			icon: ShieldCheck,
			trend: "+1 this week",
		},
		{
			label: "Open PRs",
			value: PRS.length,
			icon: GitPullRequest,
			trend: "3 new today",
		},
		{
			label: "Failing budgets",
			value: PRS.filter((p) => p.status === "failing").length,
			icon: ShieldWarning,
			trend: "down from 8",
			trendDown: true,
		},
		{
			label: "Active alerts",
			value: ALERTS.filter((a) => a.level !== "info").length,
			icon: Bell,
			trend: "2 critical",
		},
	];
	return (
		<AppShell title="Overview">
			<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((s) => (
					<Card key={s.label} className="p-5">
						<div className="flex items-center justify-between">
							<span className="text-xs uppercase tracking-wider text-muted-foreground">
								{s.label}
							</span>
							<s.icon className="h-4 w-4 text-muted-foreground" />
						</div>
						<div className="mt-3 font-mono text-3xl font-semibold">
							{s.value}
						</div>
						<div
							className={`mt-1 text-xs flex items-center gap-1 ${s.trendDown ? "text-success" : "text-muted-foreground"}`}
						>
							{s.trendDown ? (
								<TrendDown className="h-3 w-3" />
							) : (
								<TrendUp className="h-3 w-3" />
							)}
							{s.trend}
						</div>
					</Card>
				))}
			</div>

			<div className="mt-6 grid lg:grid-cols-3 gap-4">
				<Card className="p-5 lg:col-span-2">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-semibold">Performance Score, workspace</h2>
							<p className="text-xs text-muted-foreground">
								Last 30 days, p50 across repos
							</p>
						</div>
						<span className="font-mono text-2xl font-semibold">
							{series.at(-1)?.perf}
							<span className="text-muted-foreground text-sm">/100</span>
						</span>
					</div>
					<div className="mt-4 h-56">
						<ResponsiveContainer>
							<AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
								<defs>
									<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
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
									tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
									stroke="var(--color-muted-foreground)"
								/>
								<YAxis
									domain={[40, 100]}
									tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
									stroke="var(--color-muted-foreground)"
								/>
								<Tooltip
									contentStyle={{
										background: "var(--color-card)",
										border: "1px solid var(--color-border)",
										fontSize: 12,
										fontFamily: "JetBrains Mono",
									}}
								/>
								<Area
									dataKey="perf"
									stroke="var(--color-success)"
									strokeWidth={2}
									fill="url(#g1)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Card>

				<Card className="p-5">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Active alerts</h2>
						<Link to="/alerts" className="text-xs text-primary hover:underline">
							View all
						</Link>
					</div>
					<ul className="mt-4 space-y-3">
						{ALERTS.slice(0, 4).map((a) => (
							<li key={a.id} className="flex gap-3 items-start">
								<span
									className={`mt-1 h-1.5 w-1.5 rounded-full ${a.level === "critical" ? "bg-destructive" : a.level === "warning" ? "bg-warning" : "bg-muted-foreground"}`}
								/>
								<div className="min-w-0">
									<div className="text-sm font-medium truncate">{a.title}</div>
									<div className="text-xs text-muted-foreground truncate">
										{a.message}
									</div>
									<div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
										{a.repoId} · {a.channel} · {a.createdAt}
									</div>
								</div>
							</li>
						))}
					</ul>
				</Card>
			</div>

			<div className="mt-6 grid lg:grid-cols-2 gap-4">
				<Card className="p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">Repositories</h2>
						<Link
							to="/repositories"
							className="text-xs text-primary hover:underline"
						>
							All repos
						</Link>
					</div>
					<ul className="divide-y divide-border">
						{REPOS.map((r) => (
							<li key={r.id}>
								<Link
									to="/repositories/$repoId"
									params={{ repoId: r.id }}
									className="flex items-center gap-4 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md"
								>
									<div className="h-9 w-9 rounded-md bg-muted grid place-items-center font-mono text-xs">
										{r.name.slice(0, 2)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium truncate">
											{r.fullName}
										</div>
										<div className="text-xs text-muted-foreground">
											{r.openPrs} open PRs, last run {r.lastRun}
										</div>
									</div>
									<div className="text-right">
										<div className="font-mono text-sm font-semibold">
											{r.health}
											<span className="text-muted-foreground text-xs">
												/100
											</span>
										</div>
										<div
											className={`text-[10px] ${r.failingPrs ? "text-destructive" : "text-success"}`}
										>
											{r.failingPrs ? `${r.failingPrs} failing` : "all green"}
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground" />
								</Link>
							</li>
						))}
					</ul>
				</Card>

				<Card className="p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">Recent pull requests</h2>
						<Link to="/pulls" className="text-xs text-primary hover:underline">
							All PRs
						</Link>
					</div>
					<ul className="divide-y divide-border">
						{PRS.slice(0, 6).map((p) => (
							<li key={p.id}>
								<Link
									to="/pulls/$prId"
									params={{ prId: p.id }}
									className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md"
								>
									<span className="font-mono text-xs text-muted-foreground w-12">
										#{p.number}
									</span>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium truncate">
											{p.title}
										</div>
										<div className="text-xs text-muted-foreground truncate font-mono">
											{p.repoId} · {p.author} · {p.openedAt}
										</div>
									</div>
									<StatusBadge status={p.status} />
								</Link>
							</li>
						))}
					</ul>
				</Card>
			</div>
		</AppShell>
	);
}
