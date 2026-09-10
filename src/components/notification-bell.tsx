import { BellIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { orgAlertsQueryOptions } from "@/lib/alerts.queries";
import { timeAgo } from "@/lib/format";

export function NotificationBell() {
	// Same query the /alerts and dashboard pages already use — likely warm
	// from cache already if either was visited this session.
	const { data: alerts } = useQuery(orgAlertsQueryOptions());
	const nonInfo = (alerts ?? []).filter((a) => a.level !== "info");
	const recent = (alerts ?? []).slice(0, 5);

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={
						nonInfo.length > 0
							? `Notifications, ${nonInfo.length} unread`
							: "Notifications"
					}
					className="group relative"
				>
					<BellIcon className="size-4 transition-transform duration-150 ease-out group-hover:animate-bell-ring" />
					{nonInfo.length > 0 && (
						<span className="absolute right-1 top-1 grid h-4 min-w-4 animate-badge-in place-items-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
							{nonInfo.length > 9 ? "9+" : nonInfo.length}
						</span>
					)}
				</Button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align="end"
					sideOffset={8}
					className="z-50 w-80 origin-(--radix-popover-content-transform-origin) border border-border bg-popover text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-[250ms]"
				>
					<div className="border-b border-border px-4 py-3">
						<h2 className="text-sm font-semibold">Notifications</h2>
					</div>
					{recent.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No alerts yet.
						</p>
					) : (
						<ul className="max-h-80 divide-y divide-border overflow-y-auto">
							{recent.map((a) => (
								<li key={a.id} className="flex gap-3 px-4 py-3">
									<span
										className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${a.level === "critical" ? "bg-destructive" : a.level === "warning" ? "bg-warning" : "bg-muted-foreground"}`}
									/>
									<div className="min-w-0">
										<div className="text-sm font-medium truncate">
											{a.title}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{a.message}
										</div>
										<div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
											{a.repoFullName} · {timeAgo(a.createdAt)}
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
					<Popover.Close asChild>
						<Link
							to="/alerts"
							className="block border-t border-border px-4 py-2.5 text-center text-xs text-primary hover:underline"
						>
							View all alerts
						</Link>
					</Popover.Close>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
