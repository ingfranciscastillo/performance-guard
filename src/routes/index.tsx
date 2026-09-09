import {
	ArrowRightIcon,
	BellIcon,
	CheckCircleIcon,
	FlowArrowIcon,
	GaugeIcon,
	GitBranchIcon,
	GitPullRequestIcon,
	LightningIcon,
	ShieldCheckIcon,
	StackIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { MetricCard } from "@/components/metric-card";
import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/status-badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRepo, type MetricKey, PRS, REPOS } from "@/lib/mock-data";
import { EASE_OUT, staggerContainer, staggerItem } from "@/lib/motion";
import { OG_IMAGE_META, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Vitalgate: Performance Budgets for every Pull Request" },
			{
				name: "description",
				content:
					"Ship faster without shipping regressions. Vitalgate runs Lighthouse on every PR, enforces your performance budgets, and blocks merges that break them.",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: SITE_URL },
			{
				property: "og:title",
				content: "Vitalgate: Performance Budgets for every PR",
			},
			{
				property: "og:description",
				content:
					"Catch web performance regressions before they reach production.",
			},
			...OG_IMAGE_META,
			{ name: "twitter:card", content: "summary_large_image" },
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "SoftwareApplication",
					name: "Vitalgate",
					url: SITE_URL,
					applicationCategory: "DeveloperApplication",
					operatingSystem: "Web",
					description:
						"Enforces Core Web Vitals performance budgets on every GitHub pull request, blocking merges that regress LCP, INP, CLS, and Lighthouse score.",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "USD",
						description: "Free for the first 10 repositories.",
					},
				},
			},
		],
		links: [{ rel: "canonical", href: SITE_URL }],
	}),
	component: Landing,
});

function Landing() {
	return (
		<MarketingShell>
			<Hero />
			<LogoStrip />
			<Flow />
			<Features />
			<DashboardPreview />
			<PricingPreview />
			<Faq />
			<FinalCta />
		</MarketingShell>
	);
}

function Hero() {
	const previewPr = PRS.find((p) => p.status === "failing") ?? PRS[0];
	const previewRepo = getRepo(previewPr.repoId) ?? REPOS[0];
	const previewMetrics: MetricKey[] = ["PERF", "LCP", "INP", "CLS"];
	const reduce = useReducedMotion();
	const item = staggerItem(reduce);

	return (
		<section className="border-b border-border">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-24">
				<motion.div initial="hidden" animate="show" variants={staggerContainer}>
					<motion.h1
						variants={item}
						className="text-4xl font-black leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl"
					>
						Stop shipping performance{" "}
						<span className="text-brand">regressions.</span>
					</motion.h1>
					<motion.p
						variants={item}
						className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
					>
						Vitalgate runs Lighthouse on every pull request, diffs it against
						your baseline, and blocks merges that break Core Web Vitals.
					</motion.p>
					<motion.div
						variants={item}
						className="mt-8 flex flex-wrap items-center gap-3"
					>
						<Link to="/login">
							<Button
								size="lg"
								className="bg-brand text-brand-foreground hover:bg-brand/90"
							>
								Connect a repo
								<ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" />
							</Button>
						</Link>
						<Link to="/dashboard">
							<Button size="lg" variant="outline">
								View live demo
							</Button>
						</Link>
					</motion.div>
				</motion.div>

				<Reveal delay={0.1}>
					<div className="border border-border p-4 sm:p-5">
						<div className="flex items-center gap-2 border-b border-border pb-3 font-mono text-xs text-muted-foreground">
							<GitPullRequestIcon className="size-3.5" weight="bold" />
							{previewRepo.fullName} #{previewPr.number}
							<StatusBadge status={previewPr.status} />
						</div>
						<div className="mt-4 grid grid-cols-2 gap-3">
							{previewMetrics.map((key) => (
								<MetricCard
									key={key}
									metric={key}
									value={previewPr.metrics[key]}
									baseline={previewPr.baseline[key]}
									budget={
										previewRepo.budgets.find((b) => b.metric === key)?.max
									}
								/>
							))}
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function LogoStrip() {
	const logos = [
		"linear",
		"vercel",
		"datadog",
		"grafana",
		"sentry",
		"planetscale",
	];
	const track = [...logos, ...logos];
	return (
		<div className="border-b border-border py-8">
			<div className="mx-auto max-w-3xl px-5 text-center text-xs uppercase tracking-wider text-muted-foreground">
				Trusted by engineers from
			</div>
			<div className="group relative mt-5 overflow-hidden">
				<div className="animate-marquee flex w-max items-center gap-16 group-hover:paused motion-reduce:animate-none">
					{track.map((slug, i) => (
						<img
							// biome-ignore lint/suspicious/noArrayIndexKey: static marquee, logos repeated for the loop
							key={`${slug}-${i}`}
							src={`https://cdn.simpleicons.org/${slug}`}
							alt={slug}
							className="h-6 w-auto shrink-0 opacity-50 grayscale transition hover:opacity-90 hover:grayscale-0"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Flow() {
	const steps = [
		{
			icon: GitBranchIcon,
			title: "Connect",
			body: "Install the GitHub App and pick the repos to monitor, with granular permissions per repo.",
		},
		{
			icon: GaugeIcon,
			title: "Budget",
			body: "Set hard limits for LCP, INP, CLS, FCP, TBT and Performance Score. Choose severity and action.",
		},
		{
			icon: ShieldCheckIcon,
			title: "Enforce",
			body: "Every PR runs Lighthouse, diffs against the baseline, comments inline, and blocks merge on violations.",
		},
	];
	return (
		<section id="how" className="mx-auto max-w-6xl px-5 py-24">
			<Reveal>
				<span className="text-xs uppercase tracking-wider text-primary">
					How it works
				</span>
				<h2 className="mt-2 max-w-lg text-3xl font-extrabold tracking-tight sm:text-4xl">
					From pull request to production, with guardrails.
				</h2>
			</Reveal>
			<div className="mt-14 grid gap-10 border-t border-border pt-10 md:grid-cols-3 md:gap-8">
				{steps.map((s, i) => (
					<Reveal key={s.title} delay={i * 0.08}>
						<div className="flex items-baseline gap-3">
							<span className="font-mono text-sm text-muted-foreground">
								0{i + 1}
							</span>
							<s.icon className="size-4 text-brand" weight="bold" />
							<h3 className="text-lg font-bold">{s.title}</h3>
						</div>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							{s.body}
						</p>
					</Reveal>
				))}
			</div>
		</section>
	);
}

function Features() {
	const groupedFeatures = [
		{
			icon: BellIcon,
			title: "Smart alerts",
			body: "Slack, Discord and email alerts on threshold breaches.",
		},
		{
			icon: ShieldCheckIcon,
			title: "Required checks",
			body: "Block merges when a violation is severe enough to matter.",
		},
		{
			icon: StackIcon,
			title: "Per-route budgets",
			body: "Different limits for home, checkout, product detail.",
		},
		{
			icon: FlowArrowIcon,
			title: "Multi-tenant orgs",
			body: "Workspaces, teams and roles, with viewer-only scope for contractors.",
		},
	];
	return (
		<section id="features" className="border-y border-border">
			<div className="mx-auto max-w-6xl px-5 py-24">
				<Reveal>
					<h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
						Performance engineering, in your existing GitHub flow.
					</h2>
				</Reveal>
				<div className="mt-12 grid gap-4 lg:grid-cols-2">
					<Reveal>
						<div className="flex h-full flex-col border border-border p-6 transition-colors duration-200 hover:border-foreground/25">
							<h3 className="font-bold">Lighthouse CI built-in</h3>
							<p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
								Mobile and desktop runs on every commit, with stable medians
								across multiple passes.
							</p>
							<div className="mt-5 flex-1 border border-border bg-card">
								<div className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground">
									budgets.yml
								</div>
								<pre className="overflow-x-auto px-3 py-3 font-mono text-[12px] leading-relaxed">
									<span className="text-muted-foreground">LCP:</span>
									{"  "}max: 2500ms severity:{" "}
									<span className="text-destructive">fail</span>
									{"\n"}
									<span className="text-muted-foreground">INP:</span>
									{"  "}max: 200ms{"  "}severity:{" "}
									<span className="text-destructive">fail</span>
									{"\n"}
									<span className="text-muted-foreground">CLS:</span>
									{"  "}max: 0.10{"   "}severity:{" "}
									<span className="text-warning">warn</span>
									{"\n"}
									<span className="text-muted-foreground">PERF:</span> min: 90
									{"    "}severity:{" "}
									<span className="text-destructive">fail</span>
								</pre>
							</div>
						</div>
					</Reveal>
					<Reveal delay={0.06}>
						<div className="flex h-full flex-col border border-border p-6 transition-colors duration-200 hover:border-foreground/25">
							<h3 className="font-bold">Inline PR comments</h3>
							<p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
								Per-metric diffs vs. main land directly in the PR, before a
								human ever has to ask.
							</p>
							<div className="mt-5 flex-1 border border-border bg-card">
								<div className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground">
									vitalgate[bot] on acme/storefront#1042
								</div>
								<div className="px-3 py-3 text-[13px] leading-relaxed">
									<span className="font-semibold text-destructive">
										3 metrics regressed
									</span>
									<div className="mt-2 space-y-1 font-mono text-[12px] text-muted-foreground">
										<div>
											LCP <span className="text-foreground">2.1s → 2.9s</span>{" "}
											(+38%, budget 2.5s)
										</div>
										<div>
											INP <span className="text-foreground">140ms → 210ms</span>{" "}
											(+50%, budget 200ms)
										</div>
									</div>
									<p className="mt-2 text-muted-foreground">
										Merge blocked until resolved.
									</p>
								</div>
							</div>
						</div>
					</Reveal>
				</div>
				<Reveal delay={0.1}>
					<div className="mt-4 grid divide-y divide-border border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
						{groupedFeatures.map((f) => (
							<div
								key={f.title}
								className="flex items-start gap-3 p-6 transition-colors duration-200 hover:bg-muted/40"
							>
								<f.icon className="mt-0.5 size-4 shrink-0 text-primary" />
								<div>
									<h3 className="font-bold">{f.title}</h3>
									<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
										{f.body}
									</p>
								</div>
							</div>
						))}
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function AnimatedNumber({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true, amount: 0.6 });
	const reduce = useReducedMotion();
	const [display, setDisplay] = useState(reduce ? value : 0);

	useEffect(() => {
		if (!inView) return;
		if (reduce) {
			setDisplay(value);
			return;
		}
		const controls = animate(0, value, {
			duration: 0.8,
			ease: EASE_OUT,
			onUpdate: (v) => setDisplay(Math.round(v)),
		});
		return () => controls.stop();
	}, [inView, reduce, value]);

	return <span ref={ref}>{display}</span>;
}

function DashboardPreview() {
	const reduce = useReducedMotion();
	const points = [
		{ pct: 30 },
		{ pct: 42 },
		{ pct: 55 },
		{ pct: 48 },
		{ pct: 60 },
		{ pct: 72 },
		{ pct: 65 },
		{ pct: 78 },
		{ pct: 82 },
		{ pct: 70 },
		{ pct: 58 },
		{ pct: 44 },
		{ pct: 52 },
		{ pct: 66 },
		{ pct: 74 },
		{ pct: 80 },
		{ pct: 88 },
		{ pct: 76 },
		{ pct: 62 },
		{ pct: 50 },
		{ pct: 40 },
		{ pct: 54 },
		{ pct: 68 },
		{ pct: 79 },
		{ pct: 85 },
		{ pct: 90 },
		{ pct: 84 },
		{ pct: 72 },
		{ pct: 60 },
		{ pct: 92 },
	];
	return (
		<section className="mx-auto max-w-6xl px-5 py-24">
			<div className="grid items-center gap-12 lg:grid-cols-2">
				<Reveal>
					<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
						One dashboard for every repo, every metric, every regression.
					</h2>
					<p className="mt-4 leading-relaxed text-muted-foreground">
						Historical trends, per-route comparisons, and a leaderboard of the
						PRs that hurt the most. Drill from a workspace-wide health score
						down to a single metric.
					</p>
					<ul className="mt-6 space-y-2 text-sm">
						{[
							"30 / 90 / 365-day trends",
							"Per-branch and per-route comparisons",
							"Regression leaderboard by PR author",
							"Export reports as PDF or shareable links",
						].map((t) => (
							<li key={t} className="flex items-center gap-2">
								<CheckCircleIcon className="h-4 w-4 text-primary" /> {t}
							</li>
						))}
					</ul>
					<div className="mt-8 flex gap-3">
						<Link to="/dashboard">
							<Button className="bg-brand text-brand-foreground hover:bg-brand/90">
								View live demo
								<ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" />
							</Button>
						</Link>
						<Link to="/pricing">
							<Button variant="outline">See pricing</Button>
						</Link>
					</div>
				</Reveal>
				<Reveal delay={0.1}>
					<div className="border border-border p-6">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-xs text-muted-foreground">
									acme/storefront, last 30 days
								</div>
								<div className="mt-1 font-mono text-3xl font-semibold">
									<AnimatedNumber value={92} />
									<span className="text-base text-muted-foreground">/100</span>
								</div>
							</div>
							<LightningIcon className="h-5 w-5 text-brand" weight="light" />
						</div>
						<div className="mt-6 flex h-40 items-end gap-1">
							{points.map((p, i) => (
								<motion.div
									// biome-ignore lint/suspicious/noArrayIndexKey: static mock series, never reordered
									key={i}
									initial={reduce ? false : { scaleY: 0 }}
									whileInView={{ scaleY: 1 }}
									viewport={{ once: true, amount: 0.6 }}
									transition={{
										duration: 0.4,
										delay: Math.min(i * 0.012, 0.3),
										ease: EASE_OUT,
									}}
									style={{ height: `${p.pct}%`, transformOrigin: "bottom" }}
									className={`flex-1 ${p.pct < 50 ? "bg-destructive/60" : "bg-success/70"}`}
								/>
							))}
						</div>
						<div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
							<span>30d ago</span>
							<span>today</span>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function PricingPreview() {
	const plans = [
		{
			name: "Starter",
			price: "$49",
			desc: "For small teams getting started.",
			features: [
				"Up to 10 repositories",
				"5 team members",
				"Basic alerts",
				"3-month history",
			],
		},
		{
			name: "Team",
			price: "$149",
			popular: true,
			desc: "For growing engineering orgs.",
			features: [
				"Unlimited repositories",
				"Unlimited members",
				"Slack + Discord",
				"1-year history",
				"Advanced reports",
			],
		},
		{
			name: "Enterprise",
			price: "Custom",
			desc: "For platform teams at scale.",
			features: [
				"SSO / SAML",
				"Custom audits",
				"SLA and priority support",
				"On-prem runners",
			],
		},
	];
	return (
		<section className="border-y border-border">
			<div className="mx-auto max-w-6xl px-5 py-24">
				<Reveal>
					<span className="text-xs uppercase tracking-wider text-primary">
						Pricing
					</span>
					<h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
						Simple plans that scale with your repos.
					</h2>
				</Reveal>
				<div className="mt-12 grid gap-4 md:grid-cols-3">
					{plans.map((p, i) => (
						<Reveal key={p.name} delay={i * 0.06}>
							<Card
								className={`h-full rounded-md p-7 transition-colors duration-200 ${
									p.popular ? "border-brand" : "hover:border-foreground/30"
								}`}
							>
								<div className="flex items-center justify-between">
									<h3 className="font-bold">{p.name}</h3>
									{p.popular && (
										<span className="border border-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
											Most popular
										</span>
									)}
								</div>
								<div className="mt-3 flex items-baseline gap-1">
									<span className="font-mono text-4xl font-semibold">
										{p.price}
									</span>
									{p.price !== "Custom" && (
										<span className="text-sm text-muted-foreground">/mo</span>
									)}
								</div>
								<p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
								<Link to="/login" className="mt-5 block">
									<Button
										className={`w-full ${p.popular ? "bg-brand text-brand-foreground hover:bg-brand/90" : ""}`}
										variant={p.popular ? "default" : "outline"}
									>
										{p.price === "Custom"
											? "Talk to sales"
											: "Start free trial"}
									</Button>
								</Link>
								<ul className="mt-6 space-y-2 text-sm">
									{p.features.map((f) => (
										<li key={f} className="flex items-start gap-2">
											<CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{" "}
											{f}
										</li>
									))}
								</ul>
							</Card>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}

function Faq() {
	const items = [
		{
			q: "How long does setup take?",
			a: "About 5 minutes. Install the Vitalgate GitHub App, pick your repos, and accept the default budgets.",
		},
		{
			q: "Where do the Lighthouse runs happen?",
			a: "On our isolated edge runners, with multi-pass medians for stability. Bring-your-own-runner is supported on Team and Enterprise.",
		},
		{
			q: "Can I have different budgets per route?",
			a: "Yes. Define route-level budgets in a simple YAML config or via the dashboard.",
		},
		{
			q: "Does it work with monorepos?",
			a: "Yes, point each package at its own build output and budget set, all under one repo.",
		},
		{
			q: "Do you support self-hosting?",
			a: "Enterprise plans include on-prem runners and a private control plane.",
		},
	];
	return (
		<section id="faq" className="mx-auto max-w-3xl px-5 py-24">
			<Reveal className="text-center">
				<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
					Frequently asked questions
				</h2>
			</Reveal>
			<Reveal delay={0.08}>
				<Accordion type="single" collapsible className="mt-10">
					{items.map((it) => (
						<AccordionItem key={it.q} value={it.q}>
							<AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
							<AccordionContent className="text-muted-foreground">
								{it.a}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</Reveal>
		</section>
	);
}

function FinalCta() {
	return (
		<section className="mx-auto max-w-6xl px-5 pb-24">
			<Reveal>
				<div className="border border-border p-10 text-center md:p-14">
					<div className="mx-auto h-1 w-10 bg-brand" />
					<h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
						Your next PR shouldn't slow your site down.
					</h2>
					<p className="mx-auto mt-3 max-w-md text-muted-foreground">
						Install Vitalgate in 5 minutes. Free for the first 10 repos,
						forever.
					</p>
					<div className="mt-7 flex flex-wrap justify-center gap-3">
						<Link to="/login">
							<Button
								size="lg"
								className="bg-brand text-brand-foreground hover:bg-brand/90"
							>
								Connect a repo
								<ArrowRightIcon className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" />
							</Button>
						</Link>
						<Link to="/dashboard">
							<Button size="lg" variant="outline">
								View live demo
							</Button>
						</Link>
					</div>
				</div>
			</Reveal>
		</section>
	);
}
