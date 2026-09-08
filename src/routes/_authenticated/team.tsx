import { PlusIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MEMBERS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/team")({
	head: () => ({ meta: [{ title: "Team: Budgetly" }] }),
	component: Team,
});

const roleStyles: Record<string, string> = {
	Owner: "bg-primary/15 text-primary",
	Admin: "bg-accent text-accent-foreground",
	Developer: "bg-muted text-foreground",
	Viewer: "bg-muted text-muted-foreground",
};

function Team() {
	return (
		<AppShell title="Team">
			<div className="grid lg:grid-cols-3 gap-4">
				<Card className="p-5 lg:col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">Members ({MEMBERS.length})</h2>
						<Button size="sm">
							<PlusIcon className="h-4 w-4 mr-1.5" /> Invite
						</Button>
					</div>
					<ul className="divide-y divide-border">
						{MEMBERS.map((m) => (
							<li key={m.id} className="flex items-center gap-4 py-3">
								<div className="h-9 w-9 rounded-full bg-linear-to-br from-primary/60 to-primary/20 grid place-items-center text-xs font-semibold text-primary-foreground">
									{m.name
										.split(" ")
										.map((x) => x[0])
										.slice(0, 2)
										.join("")}
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium">{m.name}</div>
									<div className="text-xs text-muted-foreground font-mono">
										{m.email}
									</div>
								</div>
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleStyles[m.role]}`}
								>
									{m.role}
								</span>
							</li>
						))}
					</ul>
				</Card>

				<Card className="p-5">
					<h2 className="font-semibold">Invite teammates</h2>
					<p className="text-xs text-muted-foreground mt-1">
						Send an invite link by email.
					</p>
					<div className="mt-4 space-y-3">
						<Input placeholder="email@company.com" />
						<select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
							<option>Developer</option>
							<option>Admin</option>
							<option>Viewer</option>
						</select>
						<Button className="w-full">Send invite</Button>
					</div>
					<div className="mt-6">
						<div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
							Roles
						</div>
						<ul className="text-xs space-y-1.5 text-muted-foreground">
							<li>
								<b className="text-foreground">Owner</b> · full control, billing
							</li>
							<li>
								<b className="text-foreground">Admin</b> · manage repos,
								budgets, members
							</li>
							<li>
								<b className="text-foreground">Developer</b> · view + override
								PR checks
							</li>
							<li>
								<b className="text-foreground">Viewer</b> · read-only dashboards
							</li>
						</ul>
					</div>
				</Card>
			</div>
		</AppShell>
	);
}
