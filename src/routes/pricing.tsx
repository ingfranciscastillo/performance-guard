import { CheckCircleIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/pricing")({
	head: () => ({
		meta: [
			{ title: "Pricing: Vitalgate" },
			{
				name: "description",
				content:
					"Transparent pricing for teams that take web performance seriously. Free trial, no credit card.",
			},
			{ property: "og:title", content: "Vitalgate pricing" },
			{
				property: "og:description",
				content:
					"Starter, Team and Enterprise plans for performance budget tracking.",
			},
		],
	}),
	component: Pricing,
});

const plans = [
	{
		name: "Starter",
		price: "$49",
		desc: "Small teams getting performance under control.",
		features: [
			"Up to 10 repositories",
			"5 team members",
			"Basic alerts",
			"3-month history",
			"Lighthouse mobile + desktop",
		],
	},
	{
		name: "Team",
		price: "$149",
		popular: true,
		desc: "Growing engineering organizations.",
		features: [
			"Unlimited repositories",
			"Unlimited members",
			"Slack + Discord alerts",
			"1-year history",
			"Advanced reports",
			"Per-route budgets",
		],
	},
	{
		name: "Enterprise",
		price: "Custom",
		desc: "Platform teams that need scale and control.",
		features: [
			"SSO / SAML",
			"Custom audits",
			"Dedicated SLA",
			"Priority support",
			"On-prem runners",
			"Audit log export",
		],
	},
];

function Pricing() {
	return (
		<MarketingShell>
			<section className="mx-auto max-w-6xl px-5 pt-20 pb-12 text-center">
				<span className="text-xs uppercase tracking-wider text-primary">
					Pricing
				</span>
				<h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight">
					Built for teams that ship.
				</h1>
				<p className="mt-4 text-muted-foreground max-w-xl mx-auto">
					Start free, upgrade when your team grows. No per-seat surprises, no
					audit-time renegotiations.
				</p>
			</section>
			<section className="mx-auto max-w-6xl px-5 pb-24">
				<div className="grid md:grid-cols-3 gap-4">
					{plans.map((p) => (
						<Card
							key={p.name}
							className={`p-7 transition-colors duration-200 ${p.popular ? "border-brand" : "hover:border-foreground/30"}`}
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
							<Link to="/login" className="block mt-5">
								<Button
									className={`w-full ${p.popular ? "bg-brand text-brand-foreground hover:bg-brand/90" : ""}`}
									variant={p.popular ? "default" : "outline"}
								>
									{p.price === "Custom" ? "Talk to sales" : "Start free trial"}
								</Button>
							</Link>
							<ul className="mt-6 space-y-2 text-sm">
								{p.features.map((f) => (
									<li key={f} className="flex items-start gap-2">
										<CheckCircleIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />{" "}
										{f}
									</li>
								))}
							</ul>
						</Card>
					))}
				</div>
			</section>
		</MarketingShell>
	);
}
