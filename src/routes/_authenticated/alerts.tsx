import {
	DiscordLogoIcon,
	EnvelopeSimpleIcon,
	SlackLogoIcon,
} from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { orgAlertsQueryOptions } from "@/lib/alerts.queries";
import { timeAgo } from "@/lib/format";

const channelIcon = {
	slack: SlackLogoIcon,
	discord: DiscordLogoIcon,
	email: EnvelopeSimpleIcon,
} as const;

export const Route = createFileRoute("/_authenticated/alerts")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(orgAlertsQueryOptions()),
	head: () => ({ meta: [{ title: "Alerts: Budgetly" }] }),
	component: Alerts,
});

function Alerts() {
	const { data: alerts } = useSuspenseQuery(orgAlertsQueryOptions());

	return (
		<AppShell title="Alerts">
			<div className="grid lg:grid-cols-3 gap-4">
				<Card className="p-5 lg:col-span-2">
					<h2 className="font-semibold">Recent activity</h2>
					{alerts.length === 0 ? (
						<p className="mt-4 text-sm text-muted-foreground text-center py-6">
							No alerts yet. A required budget violation on a PR shows up here.
						</p>
					) : (
						<ul className="mt-4 divide-y divide-border">
							{alerts.map((a) => {
								const Icon = channelIcon[a.channel];
								return (
									<li key={a.id} className="flex gap-4 py-4">
										<div
											className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${a.level === "critical" ? "bg-destructive/15 text-destructive" : a.level === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}
										>
											<Icon className="h-4 w-4" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">{a.title}</span>
												<span
													className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.level === "critical" ? "bg-destructive/15 text-destructive" : a.level === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}
												>
													{a.level}
												</span>
											</div>
											<p className="text-sm text-muted-foreground mt-0.5">
												{a.message}
											</p>
											<div className="mt-1 font-mono text-[10px] text-muted-foreground">
												{a.repoFullName} · {a.channel} · {timeAgo(a.createdAt)}
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</Card>

				<Card className="p-5">
					<h2 className="font-semibold">Alert rules</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Only "Budget violation" actually fires today. The rest, and picking
						a delivery channel per rule, aren't wired up yet.
					</p>
					<ul className="mt-4 space-y-4">
						{[
							{
								label: "Budget violation",
								desc: "Fire when any PR exceeds a hard budget.",
								active: true,
							},
							{
								label: "3-day regression",
								desc: "Fire on a 3-day worsening trend on any metric.",
								active: false,
							},
							{
								label: "Score below 80",
								desc: "Fire when workspace median score falls under 80.",
								active: false,
							},
							{
								label: "Weekly digest",
								desc: "Email summary every Monday at 9:00.",
								active: false,
							},
						].map((r) => (
							<li
								key={r.label}
								className="flex items-start justify-between gap-4"
							>
								<div>
									<div className="text-sm font-medium">{r.label}</div>
									<div className="text-xs text-muted-foreground">{r.desc}</div>
								</div>
								<Switch checked={r.active} disabled />
							</li>
						))}
					</ul>
				</Card>
			</div>
		</AppShell>
	);
}
