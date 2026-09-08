import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Reveal } from "@/components/reveal";
import { PRS, getRepo, type MetricKey } from "@/lib/mock-data";
import {
  ArrowRight,
  CheckCircle,
  GitBranch,
  GitPullRequest,
  Gauge,
  Bell,
  Stack,
  ShieldCheck,
  SlackLogo,
  FlowArrow,
  Lightning,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Budgetly: Performance Budgets for every Pull Request" },
      { name: "description", content: "Ship faster without shipping regressions. Budgetly runs Lighthouse on every PR, enforces your performance budgets, and blocks merges that break them." },
      { property: "og:title", content: "Budgetly: Performance Budgets for every PR" },
      { property: "og:description", content: "Catch web performance regressions before they reach production." },
    ],
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
  const previewRepo = getRepo(previewPr.repoId)!;
  const previewMetrics: MetricKey[] = ["PERF", "LCP", "INP", "CLS"];

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Now in public beta, free for open source
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Stop shipping
            <br />
            performance <span className="text-primary">regressions.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Budgetly runs Lighthouse on every pull request, diffs it against your
            baseline, and blocks merges that break Core Web Vitals.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login">
              <Button size="lg">
                Connect a repo <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">View live demo</Button>
            </Link>
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="mb-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <GitPullRequest className="size-3.5" weight="bold" />
            {previewRepo.fullName} #{previewPr.number}
            <StatusBadge status={previewPr.status} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {previewMetrics.map((key) => (
              <MetricCard
                key={key}
                metric={key}
                value={previewPr.metrics[key]}
                baseline={previewPr.baseline[key]}
                budget={previewRepo.budgets.find((b) => b.metric === key)?.max}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = ["linear", "vercel", "datadog", "grafana", "sentry", "planetscale"];
  const track = [...logos, ...logos];
  return (
    <div className="border-b border-border bg-card/40 py-8">
      <div className="mx-auto max-w-3xl px-5 text-center text-xs uppercase tracking-wider text-muted-foreground">
        Trusted by engineers from
      </div>
      <div className="group relative mt-5 overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {track.map((slug, i) => (
            <img
              key={`${slug}-${i}`}
              src={`https://cdn.simpleicons.org/${slug}`}
              alt={slug}
              className="h-6 w-auto shrink-0 opacity-50 grayscale transition hover:opacity-90 hover:grayscale-0"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
}

function Flow() {
  const steps = [
    { icon: GitBranch, title: "Connect", body: "Install the GitHub App and pick the repos to monitor, with granular permissions per repo." },
    { icon: Gauge, title: "Budget", body: "Set hard limits for LCP, INP, CLS, FCP, TBT and Performance Score. Choose severity and action." },
    { icon: ShieldCheck, title: "Enforce", body: "Every PR runs Lighthouse, diffs against the baseline, comments inline, and blocks merge on violations." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <span className="text-xs uppercase tracking-wider text-primary">How it works</span>
        <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
          From pull request to production, with guardrails.
        </h2>
      </Reveal>
      <div className="relative mt-16">
        <div className="absolute left-0 right-0 top-5 hidden h-px bg-border md:block" />
        <div className="grid gap-10 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="relative flex flex-col items-start">
                <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-primary">
                  <s.icon className="size-4" weight="bold" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Gauge, title: "Lighthouse CI built-in", body: "Mobile and desktop runs on every commit, with stable medians across multiple passes.", tint: "primary" as const, span: "wide" as const },
    { icon: GitPullRequest, title: "Inline PR comments", body: "Per-metric diffs vs. main land directly in the PR." },
    { icon: Bell, title: "Smart alerts", body: "Slack, Discord and email alerts on threshold breaches.", tint: "muted" as const },
    { icon: ShieldCheck, title: "Required checks", body: "Block merges when a violation is severe enough to matter." },
    { icon: Stack, title: "Per-route budgets", body: "Different limits for home, checkout, product detail." },
    { icon: FlowArrow, title: "Multi-tenant orgs", body: "Workspaces, teams and roles, with viewer-only scope for contractors.", tint: "accent" as const, span: "wide" as const },
  ];
  return (
    <section id="features" className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Performance engineering, in your existing GitHub flow.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.05}
              className={f.span === "wide" ? "md:col-span-2" : undefined}
            >
              <Card
                className={`h-full p-6 transition-colors hover:border-primary/40 ${
                  f.tint === "primary"
                    ? "border-primary/30 bg-primary/[0.06]"
                    : f.tint === "accent"
                      ? "border-accent bg-accent/50"
                      : f.tint === "muted"
                        ? "bg-muted/60"
                        : ""
                }`}
              >
                <div className="grid size-9 place-items-center rounded-md border border-border bg-background text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const points = [
    { pct: 30 }, { pct: 42 }, { pct: 55 }, { pct: 48 }, { pct: 60 }, { pct: 72 }, { pct: 65 },
    { pct: 78 }, { pct: 82 }, { pct: 70 }, { pct: 58 }, { pct: 44 }, { pct: 52 }, { pct: 66 },
    { pct: 74 }, { pct: 80 }, { pct: 88 }, { pct: 76 }, { pct: 62 }, { pct: 50 }, { pct: 40 },
    { pct: 54 }, { pct: 68 }, { pct: 79 }, { pct: 85 }, { pct: 90 }, { pct: 84 }, { pct: 72 },
    { pct: 60 }, { pct: 92 },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One dashboard for every repo, every metric, every regression.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Historical trends, per-route comparisons, and a leaderboard of the PRs
            that hurt the most. Drill from a workspace-wide health score down to a
            single metric.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {["30 / 90 / 365-day trends", "Per-branch and per-route comparisons", "Regression leaderboard by PR author", "Export reports as PDF or shareable links"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> {t}</li>
            ))}
          </ul>
          <div className="mt-8 flex gap-3">
            <Link to="/dashboard"><Button>Open demo dashboard <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" /></Button></Link>
            <Link to="/pricing"><Button variant="outline">See pricing</Button></Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">acme/storefront, last 30 days</div>
                <div className="mt-1 font-mono text-3xl font-semibold">92<span className="text-base text-muted-foreground">/100</span></div>
              </div>
              <Lightning className="h-5 w-5 text-primary" weight="fill" />
            </div>
            <div className="mt-6 flex h-40 items-end gap-1">
              {points.map((p, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${p.pct < 50 ? "bg-destructive/60" : "bg-success/70"}`}
                  style={{ height: `${p.pct}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>30d ago</span><span>today</span>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans = [
    { name: "Starter", price: "$49", desc: "For small teams getting started.", features: ["Up to 10 repositories", "5 team members", "Basic alerts", "3-month history"] },
    { name: "Team", price: "$149", popular: true, desc: "For growing engineering orgs.", features: ["Unlimited repositories", "Unlimited members", "Slack + Discord", "1-year history", "Advanced reports"] },
    { name: "Enterprise", price: "Custom", desc: "For platform teams at scale.", features: ["SSO / SAML", "Custom audits", "SLA and priority support", "On-prem runners"] },
  ];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <span className="text-xs uppercase tracking-wider text-primary">Pricing</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Simple plans that scale with your repos.</h2>
        </Reveal>
        <div className="mt-12 grid items-center gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <Card
                className={`relative h-full p-7 ${
                  p.popular
                    ? "border-primary shadow-lg shadow-primary/10 lg:-translate-y-3 lg:scale-[1.03]"
                    : ""
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-7 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-semibold">{p.price}</span>
                  {p.price !== "Custom" && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <Link to="/login" className="mt-5 block">
                  <Button className="w-full" variant={p.popular ? "default" : "outline"}>
                    {p.price === "Custom" ? "Talk to sales" : "Start free trial"}
                  </Button>
                </Link>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
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
    { q: "How long does setup take?", a: "About 5 minutes. Install the Budgetly GitHub App, pick your repos, and accept the default budgets." },
    { q: "Where do the Lighthouse runs happen?", a: "On our isolated edge runners, with multi-pass medians for stability. Bring-your-own-runner is supported on Team and Enterprise." },
    { q: "Can I have different budgets per route?", a: "Yes. Define route-level budgets in a simple YAML config or via the dashboard." },
    { q: "Does it work with monorepos?", a: "Yes, point each package at its own build output and budget set, all under one repo." },
    { q: "Do you support self-hosting?", a: "Enterprise plans include on-prem runners and a private control plane." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
      <Reveal className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
      </Reveal>
      <Reveal delay={0.08}>
        <Accordion type="single" collapsible className="mt-10">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`i-${i}`}>
              <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
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
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center md:p-14">
          <SlackLogo className="mx-auto h-6 w-6 text-primary" weight="fill" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next PR shouldn't slow your site down.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Install Budgetly in 5 minutes. Free for the first 10 repos, forever.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/login"><Button size="lg">Connect GitHub <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-1" /></Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="outline">Browse demo</Button></Link>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
