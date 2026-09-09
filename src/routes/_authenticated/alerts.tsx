import {
	DiscordLogoIcon,
	EnvelopeSimpleIcon,
	SlackLogoIcon,
} from "@phosphor-icons/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { setAlertRuleEnabled } from "@/lib/alert-rules.functions";
import { alertRulesQueryOptions } from "@/lib/alert-rules.queries";
import { orgAlertsQueryOptions } from "@/lib/alerts.queries";
import { timeAgo } from "@/lib/format";

const channelIcon = {
	slack: SlackLogoIcon,
	discord: DiscordLogoIcon,
	email: EnvelopeSimpleIcon,
} as const;

export const Route = createFileRoute("/_authenticated/alerts")({
	loader: ({ context }) =>
		Promise.all([
			context.queryClient.ensureQueryData(orgAlertsQueryOptions()),
			context.queryClient.ensureQueryData(alertRulesQueryOptions()),
		]),
	head: () => ({ meta: [{ title: "Alerts: Vitalgate" }] }),
	component: Alerts,
});

function Alerts() {
	const { data: alerts } = useSuspenseQuery(orgAlertsQueryOptions());
	const { data: rules } = useSuspenseQuery(alertRulesQueryOptions());
	const queryClient = useQueryClient();

	const toggleRule = useMutation({
		mutationFn: setAlertRuleEnabled,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
		},
		onError: () => toast.error("Could not update the rule"),
	});

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
						Only "Budget violation" actually fires today. The rest save your
						preference for when real evaluation and delivery channels land.
					</p>
					<ul className="mt-4 space-y-4">
						{rules.map((r) => (
							<li
								key={r.key}
								className="flex items-start justify-between gap-4"
							>
								<div>
									<div className="text-sm font-medium">{r.label}</div>
									<div className="text-xs text-muted-foreground">{r.desc}</div>
								</div>
								<Switch
									checked={r.enabled}
									disabled={toggleRule.isPending}
									onCheckedChange={(enabled) =>
										toggleRule.mutate({
											data: { rule: r.key, enabled: Boolean(enabled) },
										})
									}
								/>
							</li>
						))}
					</ul>
				</Card>
			</div>
		</AppShell>
	);
}
