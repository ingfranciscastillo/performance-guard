import {
	ArrowLeftIcon,
	CheckCircleIcon,
	GithubLogoIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	head: () => ({
		meta: [
			{ title: "Sign in: Budgetly" },
			{
				name: "description",
				content:
					"Sign in to Budgetly with GitHub to monitor performance budgets on every PR.",
			},
		],
	}),
	component: Login,
});

function Login() {
	return (
		<div className="grid min-h-screen bg-background text-foreground md:grid-cols-2">
			<aside className="hidden flex-col justify-between border-r border-border bg-muted/30 p-10 md:flex">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftIcon className="h-4 w-4" /> Back to home
				</Link>

				<div className="flex flex-1 items-center justify-center py-10">
					<PrCheckPreview />
				</div>

				<TestimonialCarousel />
			</aside>

			<section className="relative flex flex-col px-6 py-8 sm:px-10">
				<div className="flex items-center justify-between">
					<Link to="/">
						<Logo />
					</Link>
					<ThemeToggle />
				</div>

				<div className="flex flex-1 items-center">
					<div className="mx-auto w-full max-w-sm">
						<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
							Welcome back
						</h1>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Sign in with GitHub to keep performance budgets enforced on every
							pull request. We only request the minimum scopes needed.
						</p>

						<Button
							className="mt-8 w-full bg-foreground text-background hover:bg-foreground/90"
							size="lg"
							onClick={() => {
								void authClient.signIn.social({
									provider: "github",
									callbackURL: "/dashboard",
								});
							}}
						>
							<GithubLogoIcon className="mr-2 h-4 w-4" weight="fill" /> Continue
							with GitHub
						</Button>

						<ul className="mt-6 space-y-2 text-xs text-muted-foreground">
							<li className="flex items-center gap-2">
								<CheckCircleIcon className="h-3.5 w-3.5 text-primary" /> Read
								access to PRs and commits
							</li>
							<li className="flex items-center gap-2">
								<CheckCircleIcon className="h-3.5 w-3.5 text-primary" /> Post
								status checks and comments
							</li>
							<li className="flex items-center gap-2">
								<CheckCircleIcon className="h-3.5 w-3.5 text-primary" /> Revoke
								anytime from GitHub settings
							</li>
						</ul>

						<div className="mt-10 text-xs text-muted-foreground">
							By continuing you agree to our{" "}
							<a href="#" className="underline hover:text-foreground">
								Terms
							</a>{" "}
							and{" "}
							<a href="#" className="underline hover:text-foreground">
								Privacy Policy
							</a>
							.
						</div>
					</div>
				</div>

				<div className="font-mono text-xs text-muted-foreground">
					© {new Date().getFullYear()} Budgetly Labs
				</div>
			</section>
		</div>
	);
}

const TESTIMONIALS = [
	{
		quote:
			"Budgetly caught a 38% LCP regression before it hit prod. It paid for itself in one sprint.",
		name: "Marta Ruiz",
		role: "Staff Engineer, Acme Storefront",
		initials: "MR",
	},
	{
		quote:
			"Our PR reviews used to skip performance entirely. Now it's a required check, not a suggestion.",
		name: "Noor Aljasmi",
		role: "Engineering Manager, Rivergate",
		initials: "NA",
	},
	{
		quote:
			"Per-route budgets caught a checkout regression our monitoring never would have flagged.",
		name: "Tomás Ferreira",
		role: "Platform Lead, Basalt Health",
		initials: "TF",
	},
];

function TestimonialCarousel() {
	const [index, setIndex] = useState(0);
	const reduce = useReducedMotion();

	// `index` is intentionally a dependency: restarts the 6s countdown whenever
	// the slide changes (auto or manual) so a manual click isn't overridden by
	// a stale timer a moment later.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
	useEffect(() => {
		if (reduce) return;
		const id = setInterval(() => {
			setIndex((i) => (i + 1) % TESTIMONIALS.length);
		}, 6000);
		return () => clearInterval(id);
	}, [reduce, index]);

	const t = TESTIMONIALS[index];

	return (
		<div className="max-w-md">
			<div className="min-h-20">
				<AnimatePresence mode="wait">
					<motion.div
						key={index}
						initial={reduce ? false : { opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={reduce ? undefined : { opacity: 0, y: -6 }}
						transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
					>
						<p className="text-base leading-relaxed text-foreground/90">
							"{t.quote}"
						</p>
						<div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
							<div className="grid h-8 w-8 shrink-0 place-items-center bg-primary/15 font-mono text-xs text-primary">
								{t.initials}
							</div>
							<div>
								<div className="font-medium text-foreground">{t.name}</div>
								<div className="text-xs">{t.role}</div>
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
			<div className="mt-8 flex items-center gap-1.5">
				{TESTIMONIALS.map((testimonial, i) => (
					<button
						key={testimonial.name}
						type="button"
						onClick={() => setIndex(i)}
						aria-label={`Show testimonial from ${testimonial.name}`}
						aria-current={i === index}
						className={`h-1.5 rounded-full transition-all duration-200 ${
							i === index
								? "w-6 bg-brand"
								: "w-1.5 bg-foreground/20 hover:bg-foreground/40"
						}`}
					/>
				))}
			</div>
		</div>
	);
}

function PrCheckPreview() {
	return (
		<div className="w-full max-w-md border border-border bg-card">
			<div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-xs text-muted-foreground">
				<div className="flex gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
					<span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
					<span className="h-2.5 w-2.5 rounded-full bg-success/70" />
				</div>
				<span className="ml-3">acme/web, PR #1247</span>
			</div>
			<div className="grid grid-cols-2 divide-x divide-y divide-border">
				{[
					{ k: "LCP", v: "3.42s", d: "+38%", bad: true },
					{ k: "INP", v: "182ms", d: "-4%", bad: false },
					{ k: "CLS", v: "0.07", d: "+0.01", bad: false },
					{ k: "Score", v: "71", d: "-19", bad: true },
				].map((m) => (
					<div key={m.k} className="p-4">
						<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
							{m.k}
						</div>
						<div className="mt-1.5 font-mono text-xl font-semibold">{m.v}</div>
						<div
							className={`mt-0.5 font-mono text-[11px] ${m.bad ? "text-destructive" : "text-success"}`}
						>
							{m.d} vs main
						</div>
					</div>
				))}
			</div>
			<div className="border-t border-border bg-muted/30 p-3 font-mono text-[11px]">
				<div className="text-destructive">
					✗ LCP budget exceeded, blocking merge
				</div>
				<div className="text-success">✓ INP within budget</div>
			</div>
		</div>
	);
}
