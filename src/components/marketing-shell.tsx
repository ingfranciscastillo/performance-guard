import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function MarketingShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="sticky top-0 z-30 border-b border-border bg-background">
				<div className="mx-auto flex h-16 max-w-6xl items-center px-5">
					<Link to="/">
						<Logo />
					</Link>
					<nav className="ml-10 hidden items-center gap-7 text-sm text-muted-foreground md:flex">
						<a href="#features" className="hover:text-foreground">
							Features
						</a>
						<a href="#how" className="hover:text-foreground">
							How it works
						</a>
						<Link to="/pricing" className="hover:text-foreground">
							Pricing
						</Link>
						<a href="#faq" className="hover:text-foreground">
							FAQ
						</a>
					</nav>
					<div className="ml-auto flex items-center gap-2">
						<ThemeToggle />
						<Link to="/login" className="hidden sm:inline-flex">
							<Button variant="ghost" size="sm">
								Sign in
							</Button>
						</Link>
						<Link to="/login">
							<Button
								size="sm"
								className="bg-brand text-brand-foreground hover:bg-brand/90"
							>
								Connect a repo
							</Button>
						</Link>
					</div>
				</div>
			</header>
			<main className="flex-1">{children}</main>
			<footer className="border-t border-border">
				<div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start">
					<div className="max-w-xs">
						<Logo />
						<p className="mt-3 text-sm text-muted-foreground">
							Performance budgets enforced on every pull request, before a
							regression ever reaches production.
						</p>
					</div>
					<div className="grid flex-1 grid-cols-2 gap-8 text-sm sm:grid-cols-4 md:ml-auto">
						<div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground">
								Product
							</div>
							<div className="mt-3 flex flex-col gap-2">
								<a
									href="#features"
									className="text-foreground/80 hover:text-foreground"
								>
									Features
								</a>
								<Link
									to="/pricing"
									className="text-foreground/80 hover:text-foreground"
								>
									Pricing
								</Link>
								<Link
									to="/dashboard"
									className="text-foreground/80 hover:text-foreground"
								>
									Live demo
								</Link>
							</div>
						</div>
						<div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground">
								Company
							</div>
							<div className="mt-3 flex flex-col gap-2">
								<a
									href="#"
									className="text-foreground/80 hover:text-foreground"
								>
									Status
								</a>
								<a
									href="#"
									className="text-foreground/80 hover:text-foreground"
								>
									Docs
								</a>
							</div>
						</div>
						<div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground">
								Legal
							</div>
							<div className="mt-3 flex flex-col gap-2">
								<a
									href="#"
									className="text-foreground/80 hover:text-foreground"
								>
									Privacy
								</a>
								<a
									href="#"
									className="text-foreground/80 hover:text-foreground"
								>
									Terms
								</a>
							</div>
						</div>
					</div>
				</div>
				<div className="border-t border-border">
					<div className="mx-auto max-w-6xl px-5 py-4 font-mono text-xs text-muted-foreground">
						© {new Date().getFullYear()} Budgetly Labs
					</div>
				</div>
			</footer>
		</div>
	);
}
