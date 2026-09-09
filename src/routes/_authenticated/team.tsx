import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/team")({
	head: () => ({ meta: [{ title: "Team: Vitalgate" }] }),
	component: Team,
});

// The only roles better-auth's organization plugin actually enforces here —
// no custom roles/permissions are configured (see auth.ts). Showing more
// than these would let someone pick a role the API rejects.
const INVITE_ROLES = ["member", "admin"] as const;

const roleStyles: Record<string, string> = {
	owner: "bg-primary/15 text-primary",
	admin: "bg-accent text-accent-foreground",
	member: "bg-muted text-foreground",
};

function initials(name: string) {
	return name
		.split(" ")
		.map((x) => x[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function Team() {
	const { data: session } = authClient.useSession();
	const { data: org, isPending } = authClient.useActiveOrganization();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<(typeof INVITE_ROLES)[number]>("member");
	const [inviting, setInviting] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const members = org?.members ?? [];
	const pendingInvitations = (org?.invitations ?? []).filter(
		(i) => i.status === "pending",
	);

	const handleInvite = async () => {
		if (!email.trim()) {
			toast.error("Enter an email address");
			return;
		}
		setInviting(true);
		const { error } = await authClient.organization.inviteMember({
			email: email.trim(),
			role,
		});
		setInviting(false);
		if (error) {
			toast.error(error.message ?? "Could not send invite");
			return;
		}
		toast.success(`Invited ${email.trim()}`);
		setEmail("");
	};

	const handleRemove = async (memberId: string) => {
		setBusyId(memberId);
		const { error } = await authClient.organization.removeMember({
			memberIdOrEmail: memberId,
		});
		setBusyId(null);
		if (error) toast.error(error.message ?? "Could not remove member");
	};

	const handleCancelInvite = async (invitationId: string) => {
		setBusyId(invitationId);
		const { error } = await authClient.organization.cancelInvitation({
			invitationId,
		});
		setBusyId(null);
		if (error) toast.error(error.message ?? "Could not cancel invite");
	};

	return (
		<AppShell title="Team">
			<div className="grid lg:grid-cols-3 gap-4">
				<Card className="p-5 lg:col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">
							Members {isPending ? "" : `(${members.length})`}
						</h2>
					</div>
					{isPending ? (
						<p className="text-sm text-muted-foreground py-6 text-center">
							Loading…
						</p>
					) : (
						<ul className="divide-y divide-border">
							{members.map((m) => (
								<li key={m.id} className="flex items-center gap-4 py-3">
									{m.user.image ? (
										<img
											src={m.user.image}
											alt={m.user.name}
											className="h-9 w-9 shrink-0 rounded-full object-cover"
										/>
									) : (
										<div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-primary/60 to-primary/20 grid place-items-center text-xs font-semibold text-primary-foreground">
											{initials(m.user.name || m.user.email)}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium">
											{m.user.name}
											{m.user.id === session?.user.id && (
												<span className="ml-1.5 text-xs text-muted-foreground">
													(you)
												</span>
											)}
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											{m.user.email}
										</div>
									</div>
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${roleStyles[m.role] ?? "bg-muted text-foreground"}`}
									>
										{m.role}
									</span>
									{m.role !== "owner" && (
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Remove ${m.user.name}`}
											disabled={busyId === m.id}
											onClick={() => handleRemove(m.id)}
										>
											<XIcon className="h-3.5 w-3.5 text-destructive" />
										</Button>
									)}
								</li>
							))}
						</ul>
					)}

					{pendingInvitations.length > 0 && (
						<>
							<div className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-2">
								Pending invitations
							</div>
							<ul className="divide-y divide-border">
								{pendingInvitations.map((inv) => (
									<li
										key={inv.id}
										className="flex items-center gap-4 py-2.5 text-sm"
									>
										<div className="flex-1 min-w-0 text-muted-foreground font-mono truncate">
											{inv.email}
										</div>
										<span
											className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${roleStyles[inv.role] ?? "bg-muted text-foreground"}`}
										>
											{inv.role}
										</span>
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Cancel invitation to ${inv.email}`}
											disabled={busyId === inv.id}
											onClick={() => handleCancelInvite(inv.id)}
										>
											<XIcon className="h-3.5 w-3.5 text-destructive" />
										</Button>
									</li>
								))}
							</ul>
						</>
					)}
				</Card>

				<Card className="p-5">
					<h2 className="font-semibold">Invite teammates</h2>
					<p className="text-xs text-muted-foreground mt-1">
						Send an invite link by email.
					</p>
					<div className="mt-4 space-y-3">
						<Input
							type="email"
							placeholder="email@company.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<select
							value={role}
							onChange={(e) =>
								setRole(e.target.value as (typeof INVITE_ROLES)[number])
							}
							className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
						>
							{INVITE_ROLES.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
						<Button
							className="w-full"
							disabled={inviting}
							onClick={handleInvite}
						>
							<PlusIcon className="h-4 w-4 mr-1.5" />
							{inviting ? "Sending…" : "Send invite"}
						</Button>
					</div>
					<div className="mt-6">
						<div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
							Roles
						</div>
						<ul className="text-xs space-y-1.5 text-muted-foreground">
							<li>
								<b className="text-foreground">Owner</b> · full control, can't
								be removed
							</li>
							<li>
								<b className="text-foreground">Admin</b> · manage members and
								settings
							</li>
							<li>
								<b className="text-foreground">Member</b> · standard access
							</li>
						</ul>
					</div>
				</Card>
			</div>
		</AppShell>
	);
}
