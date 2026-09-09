import {
	DiscordLogoIcon,
	EnvelopeSimpleIcon,
	GithubLogoIcon,
	SlackLogoIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { CiTokenCard } from "@/components/ci-token-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setInitialPassword } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import {
	disconnectIntegration,
	getIntegrationAuthorizeUrl,
} from "@/lib/integrations.functions";
import { integrationsOverviewQueryOptions } from "@/lib/integrations.queries";
import type { IntegrationProvider } from "@/lib/mock-data";
import { setNotificationPref } from "@/lib/notification-prefs.functions";
import { notificationPrefsQueryOptions } from "@/lib/notification-prefs.queries";

export const Route = createFileRoute("/_authenticated/settings")({
	head: () => ({ meta: [{ title: "Settings: Budgetly" }] }),
	component: Settings,
});

function OrganizationCard() {
	const { data: org, isPending } = authClient.useActiveOrganization();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [saving, setSaving] = useState(false);

	// Re-syncs only when the org's actual name/slug change (this page's own
	// save, or an edit made elsewhere) — not on every refetch of the org
	// object (e.g. from a member joining on the Team page), which would
	// otherwise stomp on an in-progress, unsaved edit here.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
	useEffect(() => {
		if (org) {
			setName(org.name);
			setSlug(org.slug);
		}
	}, [org?.name, org?.slug]);

	const handleSave = async () => {
		setSaving(true);
		const { error } = await authClient.organization.update({
			data: { name, slug },
		});
		setSaving(false);
		if (error) {
			toast.error(error.message ?? "Could not update organization");
			return;
		}
		toast.success("Organization updated");
	};

	return (
		<Card className="p-6 max-w-xl">
			<h2 className="font-semibold">Organization</h2>
			<div className="mt-4 grid gap-4">
				<div>
					<Label htmlFor="orgname">Workspace name</Label>
					<Input
						id="orgname"
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={isPending}
						className="mt-1.5"
					/>
				</div>
				<div>
					<Label htmlFor="slug">Slug</Label>
					<Input
						id="slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						disabled={isPending}
						className="mt-1.5 font-mono"
					/>
				</div>
				<div className="pt-2">
					<Button
						onClick={handleSave}
						disabled={isPending || saving || !name.trim() || !slug.trim()}
					>
						{saving ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</div>
		</Card>
	);
}

function NotificationsCard() {
	const { data: prefs, isPending } = useQuery(notificationPrefsQueryOptions());
	const queryClient = useQueryClient();

	const togglePref = useMutation({
		mutationFn: setNotificationPref,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
		},
		onError: () => toast.error("Could not update the preference"),
	});

	return (
		<Card className="p-6 max-w-xl">
			<h2 className="font-semibold">Notification preferences</h2>
			<p className="mt-1 text-xs text-muted-foreground">
				Personal — these don't change what the org's Alert rules fire, only
				whether you're emailed about it.
			</p>
			{isPending ? (
				<p className="mt-4 text-sm text-muted-foreground">Loading…</p>
			) : (
				<ul className="mt-4 divide-y divide-border">
					{prefs?.map((p) => (
						<li key={p.key} className="flex items-center justify-between py-3">
							<div>
								<span className="text-sm">{p.label}</span>
								<p className="text-xs text-muted-foreground">{p.desc}</p>
							</div>
							<Switch
								checked={p.enabled}
								disabled={togglePref.isPending}
								onCheckedChange={(enabled) =>
									togglePref.mutate({
										data: { pref: p.key, enabled: Boolean(enabled) },
									})
								}
							/>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}

function IntegrationCardShell({
	icon: Icon,
	name,
	connected,
	desc,
	children,
}: {
	icon: ComponentType<{ className?: string }>;
	name: string;
	connected: boolean;
	desc: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="p-5">
			<div className="flex items-start gap-3">
				<div className="h-9 w-9 rounded-md bg-muted grid place-items-center">
					<Icon className="h-4 w-4" />
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<span className="font-medium">{name}</span>
						{connected && (
							<span className="rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px]">
								Connected
							</span>
						)}
					</div>
					<p className="text-xs text-muted-foreground mt-1">{desc}</p>
				</div>
			</div>
			<div className="mt-4">{children}</div>
		</Card>
	);
}

function IntegrationsTab() {
	const { data, isPending } = useQuery(integrationsOverviewQueryOptions());
	const queryClient = useQueryClient();
	const [connecting, setConnecting] = useState<IntegrationProvider | null>(
		null,
	);

	// The OAuth callback redirects back here with ?integration=&status=&reason=
	// — surface that once, then strip it so a refresh doesn't re-toast it.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const integration = params.get("integration");
		const status = params.get("status");
		if (!integration || !status) return;

		const providerName = integration === "slack" ? "Slack" : "Discord";
		if (status === "connected") {
			toast.success(`${providerName} connected`);
		} else {
			const reason = params.get("reason");
			toast.error(
				`Could not connect ${providerName}${reason ? `: ${reason}` : ""}`,
			);
		}
		queryClient.invalidateQueries({ queryKey: ["integrations-overview"] });
		window.history.replaceState({}, "", window.location.pathname);
	}, [queryClient]);

	const disconnect = useMutation({
		mutationFn: disconnectIntegration,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["integrations-overview"] });
			toast.success("Disconnected");
		},
		onError: () => toast.error("Could not disconnect"),
	});

	const connect = async (provider: IntegrationProvider) => {
		setConnecting(provider);
		try {
			const url = await getIntegrationAuthorizeUrl({ data: provider });
			window.location.href = url;
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not start connection",
			);
			setConnecting(null);
		}
	};

	if (isPending || !data) {
		return <p className="mt-6 text-sm text-muted-foreground">Loading…</p>;
	}

	return (
		<div className="mt-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
			<IntegrationCardShell
				icon={GithubLogoIcon}
				name="GitHub"
				connected={data.github.connected}
				desc={
					data.github.connected
						? `${data.github.repoCount} repo${data.github.repoCount === 1 ? "" : "s"} connected`
						: "Not connected"
				}
			>
				<Link to="/repositories">
					<Button variant="outline" size="sm">
						Manage
					</Button>
				</Link>
			</IntegrationCardShell>

			<IntegrationCardShell
				icon={SlackLogoIcon}
				name="Slack"
				connected={data.slack.connected}
				desc={
					data.slack.connected
						? (data.slack.label ?? "Connected")
						: "Not connected"
				}
			>
				{data.slack.connected ? (
					<Button
						variant="outline"
						size="sm"
						disabled={disconnect.isPending}
						onClick={() => disconnect.mutate({ data: "slack" })}
					>
						Disconnect
					</Button>
				) : (
					<Button
						size="sm"
						disabled={connecting === "slack"}
						onClick={() => connect("slack")}
					>
						{connecting === "slack" ? "Connecting…" : "Connect"}
					</Button>
				)}
			</IntegrationCardShell>

			<IntegrationCardShell
				icon={DiscordLogoIcon}
				name="Discord"
				connected={data.discord.connected}
				desc={
					data.discord.connected
						? (data.discord.label ?? "Connected")
						: "Not connected"
				}
			>
				{data.discord.connected ? (
					<Button
						variant="outline"
						size="sm"
						disabled={disconnect.isPending}
						onClick={() => disconnect.mutate({ data: "discord" })}
					>
						Disconnect
					</Button>
				) : (
					<Button
						size="sm"
						disabled={connecting === "discord"}
						onClick={() => connect("discord")}
					>
						{connecting === "discord" ? "Connecting…" : "Connect"}
					</Button>
				)}
			</IntegrationCardShell>

			<IntegrationCardShell
				icon={EnvelopeSimpleIcon}
				name="Email digest"
				connected={data.emailDigest.enabled}
				desc={
					data.emailDigest.enabled
						? "Weekly, to every org member"
						: "Off — enable under Alert rules"
				}
			>
				<Link to="/alerts">
					<Button variant="outline" size="sm">
						Manage
					</Button>
				</Link>
			</IntegrationCardShell>
		</div>
	);
}

function SecurityCard() {
	const queryClient = useQueryClient();
	const { data: accounts, isPending } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			const { data, error } = await authClient.listAccounts();
			if (error) throw new Error(error.message ?? "Could not load accounts");
			return data;
		},
	});
	// Every current user signed up via GitHub — no credential (email+password)
	// account exists yet. Setting one (no current password to verify) and
	// changing one (must verify the current password) are different
	// better-auth calls, so which form renders depends on this.
	const hasPassword =
		accounts?.some((a) => a.providerId === "credential") ?? false;

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);

	const reset = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
	};

	const handleSubmit = async () => {
		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Passwords don't match");
			return;
		}

		setSaving(true);
		if (hasPassword) {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
			});
			setSaving(false);
			if (error) {
				toast.error(error.message ?? "Could not change password");
				return;
			}
			toast.success("Password changed");
		} else {
			try {
				await setInitialPassword({ data: { newPassword } });
			} catch (err) {
				setSaving(false);
				toast.error(
					err instanceof Error ? err.message : "Could not set password",
				);
				return;
			}
			setSaving(false);
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			toast.success("Password set");
		}
		reset();
	};

	return (
		<Card className="p-6 max-w-xl">
			<h2 className="font-semibold">Password</h2>
			<p className="mt-1 text-xs text-muted-foreground">
				{isPending
					? "Loading…"
					: hasPassword
						? "Change the password used to sign in with email."
						: "You signed up with GitHub and have no password yet — set one to also sign in with email."}
			</p>
			{!isPending && (
				<div className="mt-4 grid gap-4">
					{hasPassword && (
						<div>
							<Label htmlFor="current-password">Current password</Label>
							<Input
								id="current-password"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="mt-1.5"
							/>
						</div>
					)}
					<div>
						<Label htmlFor="new-password">New password</Label>
						<Input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="mt-1.5"
						/>
					</div>
					<div>
						<Label htmlFor="confirm-password">Confirm new password</Label>
						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="mt-1.5"
						/>
					</div>
					<div className="pt-2">
						<Button
							onClick={handleSubmit}
							disabled={
								saving ||
								!newPassword ||
								!confirmPassword ||
								(hasPassword && !currentPassword)
							}
						>
							{saving
								? "Saving…"
								: hasPassword
									? "Change password"
									: "Set password"}
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
}

function Settings() {
	return (
		<AppShell title="Settings">
			<Tabs defaultValue="org">
				<TabsList>
					<TabsTrigger value="org">Organization</TabsTrigger>
					<TabsTrigger value="integrations">Integrations</TabsTrigger>
					<TabsTrigger value="billing">Billing</TabsTrigger>
					<TabsTrigger value="notifications">Notifications</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
				</TabsList>

				<TabsContent value="org" className="mt-6 space-y-4">
					<OrganizationCard />
					<CiTokenCard />
				</TabsContent>

				<TabsContent value="integrations">
					<IntegrationsTab />
				</TabsContent>

				<TabsContent value="billing" className="mt-6">
					<Card className="p-6 max-w-xl">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="font-semibold">Current plan</h2>
								<p className="text-sm text-muted-foreground">
									Team, billed monthly
								</p>
							</div>
							<span className="font-mono text-2xl font-semibold">
								$149<span className="text-muted-foreground text-sm">/mo</span>
							</span>
						</div>
						<div className="mt-6 grid grid-cols-2 gap-4 text-sm">
							<div>
								<div className="text-xs text-muted-foreground">Renews</div>
								<div className="font-mono mt-1">Jul 12, 2026</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Seats used</div>
								<div className="font-mono mt-1">5 / unlimited</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">
									Repos monitored
								</div>
								<div className="font-mono mt-1">4</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">
									Lighthouse runs (mo)
								</div>
								<div className="font-mono mt-1">12,403</div>
							</div>
						</div>
						<div className="mt-6 flex gap-2">
							<Button variant="outline">Manage plan</Button>
							<Button variant="ghost">Download invoice</Button>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="notifications" className="mt-6">
					<NotificationsCard />
				</TabsContent>

				<TabsContent value="security" className="mt-6">
					<SecurityCard />
				</TabsContent>
			</Tabs>
		</AppShell>
	);
}
