import {
	Bell,
	CaretDown,
	ChartBar,
	FolderSimple,
	Gear,
	GitPullRequest,
	MagnifyingGlass,
	SignOut,
	SquaresFour,
	Users,
} from "@phosphor-icons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const nav: {
	to: string;
	label: string;
	icon: ComponentType<{ className?: string; weight?: "regular" | "fill" }>;
}[] = [
	{ to: "/dashboard", label: "Dashboard", icon: SquaresFour },
	{ to: "/repositories", label: "Repositories", icon: FolderSimple },
	{ to: "/pulls", label: "Pull Requests", icon: GitPullRequest },
	{ to: "/alerts", label: "Alerts", icon: Bell },
	{ to: "/team", label: "Team", icon: Users },
	{ to: "/settings", label: "Settings", icon: Gear },
];

function NavList({ pathname }: { pathname: string }) {
	return (
		<nav className="flex-1 space-y-0.5 px-2">
			{nav.map((item) => {
				const active =
					pathname === item.to || pathname.startsWith(`${item.to}/`);
				const Icon = item.icon;
				return (
					<Link
						key={item.to}
						to={item.to}
						className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
							active
								? "bg-sidebar-accent font-medium text-foreground"
								: "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
						}`}
					>
						{active && (
							<span
								className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
								aria-hidden
							/>
						)}
						<Icon className="size-4" weight={active ? "fill" : "regular"} />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

function WorkspaceSwitcher() {
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const name = isPending ? "" : (activeOrg?.name ?? "No workspace");
	const initial = name ? name.charAt(0).toUpperCase() : "?";

	return (
		<button
			type="button"
			className="flex w-full items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			<span className="grid size-5 shrink-0 place-items-center rounded-sm bg-primary/15 text-[10px] font-semibold text-primary">
				{initial}
			</span>
			<span className="truncate">{isPending ? "Loading…" : name}</span>
			<CaretDown className="ml-auto size-3.5 shrink-0" weight="bold" />
		</button>
	);
}

export function AppShell({
	children,
	title,
}: {
	children: ReactNode;
	title?: string;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const initial = session?.user.name?.charAt(0).toUpperCase() ?? "U";

	return (
		<div className="flex min-h-dvh w-full bg-background text-foreground">
			<aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
				<div className="flex h-14 items-center border-b border-border px-5">
					<Link to="/dashboard">
						<Logo />
					</Link>
				</div>
				<div className="px-3 py-3">
					<WorkspaceSwitcher />
				</div>
				<NavList pathname={pathname} />
				<div className="border-t border-border p-3">
					<button
						type="button"
						onClick={() => {
							void authClient.signOut().then(() => navigate({ to: "/login" }));
						}}
						className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<SignOut className="size-4" />
						Sign out
					</button>
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
					<div className="lg:hidden">
						<Logo />
					</div>

					<div className="relative hidden max-w-md flex-1 md:flex">
						<MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search repos, pull requests, metrics"
							className="h-9 border-border bg-muted/40 pl-8"
						/>
					</div>

					<div className="ml-auto flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Notifications">
							<Bell className="size-4" />
						</Button>
						<ThemeToggle />
						<div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
							{initial}
						</div>
					</div>
				</header>

				{title && (
					<div className="flex items-center gap-3 px-4 pb-2 pt-6 lg:px-8">
						<ChartBar className="size-4 text-muted-foreground" />
						<h1 className="text-xl font-semibold tracking-tight">{title}</h1>
					</div>
				)}

				<main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
			</div>
		</div>
	);
}
