<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Vitalgate logo">
  <h1>Vitalgate</h1>
  <p><strong>Performance budgets for every pull request.</strong></p>
</div>

Vitalgate runs Lighthouse on every GitHub pull request, enforces performance
budgets on Core Web Vitals, and blocks merges that regress LCP, INP, CLS, or
your Lighthouse score — before a regression ever reaches production.

## Features

- **Automated Lighthouse audits** on every pull request, via a GitHub Action
  committed automatically when a repo is connected
- **Per-metric performance budgets** (LCP, INP, CLS, FCP, TBT, Score) with
  warn or block severity per metric
- **Required status checks** that block a merge when a hard budget is
  violated
- **Alerts** for budget violations, 3-day regressions, and org-wide score
  drops, plus an optional weekly digest email
- **Slack and Discord integrations** via OAuth incoming webhooks
- **Multi-tenant organizations** with member roles, invites, and per-org
  settings
- **Dashboard** with workspace-wide trends, repo health, and recent pull
  requests

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
  (React 19, Vite, Nitro)
- [TanStack Router](https://tanstack.com/router) and
  [TanStack Query](https://tanstack.com/query) — routing and data fetching
- [Drizzle ORM](https://orm.drizzle.team/) on
  [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.tech/))
- [Better Auth](https://www.better-auth.com/) — authentication, GitHub
  OAuth, organizations
- [Tailwind CSS](https://tailwindcss.com/) v4,
  [Radix UI](https://www.radix-ui.com/),
  [Phosphor Icons](https://phosphoricons.com/)
- [Resend](https://resend.com/) — transactional email
- [Biome](https://biomejs.dev/) — linting and formatting
