import type { PackageManager } from "@/lib/github";
import { WORKFLOW_MANAGED_MARKER } from "@/lib/github";

/**
 * Per-manager setup/install YAML block. Deliberately no hardcoded tool
 * versions: pnpm/setup reads the exact pnpm version from the repo's own
 * package.json ("packageManager" field) so it always matches whatever
 * generated the lockfile, and "lts/*" tracks whichever Node LTS is current
 * instead of going stale the moment a specific number is deprecated.
 */
function setupAndInstall(manager: PackageManager): string {
	switch (manager) {
		case "pnpm":
			// pnpm/setup installs Node + pnpm and runs `pnpm install` itself, so
			// there's no separate "Install dependencies" step to keep in sync.
			// No explicit frozen-lockfile flag needed: pnpm already defaults to
			// --frozen-lockfile behavior whenever the CI env var is set, which
			// GitHub Actions always sets.
			return `      - uses: pnpm/setup@v2
        with:
          cache: true`;
		case "yarn":
			return `      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: yarn

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable`;
		case "npm":
			return `      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: npm

      - name: Install dependencies
        run: npm ci`;
	}
}

function runScript(manager: PackageManager, script: string): string {
	switch (manager) {
		case "pnpm":
			return `pnpm run ${script}`;
		case "yarn":
			return `yarn ${script}`;
		case "npm":
			return `npm run ${script}`;
	}
}

/**
 * GitHub Action template committed to a repo when it's connected. Every
 * value below — package manager, its version, the serve script, the port,
 * and where to report results — is resolved once at connect time from the
 * repo's own files and the request that connected it, instead of guessed
 * defaults baked into the template. Re-running "detect" only happens by
 * disconnecting and reconnecting the repo on Budgetly, which regenerates
 * this whole file (see WORKFLOW_MANAGED_MARKER).
 */
export function budgetlyWorkflowYaml(opts: {
	defaultBranch: string;
	githubRepoId: string;
	packageManager: PackageManager;
	/** package.json script name that serves the production build (e.g. "start", "preview"). */
	startScript: string;
	/** Port the serve script listens on once started. */
	port: number;
	/** Origin Budgetly is reachable at, e.g. "https://budgetly.example.com" — no trailing slash. */
	budgetlyOrigin: string;
}): string {
	return `${WORKFLOW_MANAGED_MARKER} Reconnecting this repository on Budgetly regenerates this file — edits made directly here will be overwritten.
name: Budgetly Performance Budgets

on:
  pull_request:
    branches: ["${opts.defaultBranch}"]

env:
  BUDGETLY_PORT: ${opts.port}

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    # Bounds the whole job so a hung dev server (or anything else) fails loudly
    # instead of running until someone notices and cancels it by hand.
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7

${setupAndInstall(opts.packageManager)}

      - name: Build
        run: ${runScript(opts.packageManager, "build")}

      - name: Start server in background
        run: |
          ${runScript(opts.packageManager, opts.startScript)} &
          npx --yes wait-on "http://localhost:\${{ env.BUDGETLY_PORT }}" --timeout 60000

      - name: Run Lighthouse
        timeout-minutes: 5
        run: npx --yes lighthouse "http://localhost:\${{ env.BUDGETLY_PORT }}" --output=json --output-path=./lighthouse.json --chrome-flags="--headless --no-sandbox" --max-wait-for-load=45000

      - name: Report to Budgetly
        env:
          BUDGETLY_TOKEN: \${{ secrets.BUDGETLY_TOKEN }}
          PR_NUMBER: \${{ github.event.pull_request.number }}
          PR_TITLE: \${{ github.event.pull_request.title }}
          PR_AUTHOR: \${{ github.event.pull_request.user.login }}
          PR_BRANCH: \${{ github.event.pull_request.head.ref }}
        run: |
          node -e '
          const fs = require("fs");
          const report = JSON.parse(fs.readFileSync("./lighthouse.json", "utf8"));
          const a = report.audits;
          const metrics = {
            LCP: a["largest-contentful-paint"].numericValue,
            CLS: a["cumulative-layout-shift"].numericValue,
            FCP: a["first-contentful-paint"].numericValue,
            TBT: a["total-blocking-time"].numericValue,
            PERF: Math.round(report.categories.performance.score * 100),
          };
          // Lighthouse (lab data) has no INP audit — INP is a field metric,
          // not something a single synthetic run produces. Left out on purpose.
          fetch("${opts.budgetlyOrigin}/api/ingest", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer " + process.env.BUDGETLY_TOKEN,
            },
            body: JSON.stringify({
              githubRepoId: "${opts.githubRepoId}",
              prNumber: Number(process.env.PR_NUMBER),
              prTitle: process.env.PR_TITLE,
              prAuthor: process.env.PR_AUTHOR,
              branch: process.env.PR_BRANCH,
              metrics,
            }),
          }).then(async (res) => {
            const body = await res.json();
            console.log(JSON.stringify(body, null, 2));
            if (!res.ok) process.exit(1);
            if (body.status === "failing") {
              console.error("Budgetly: a required performance budget was violated.");
              process.exit(1);
            }
          });
          '

# Setup checklist:
# 1. Add a repo secret named BUDGETLY_TOKEN (Settings > Secrets and
#    variables > Actions) with the token from Budgetly's Settings page.
# 2. Package manager (${opts.packageManager}), serve script ("${opts.startScript}"),
#    and port (${opts.port}) were detected from this repo at connect time.
#    Wrong? Disconnect and reconnect the repo on Budgetly (or type an
#    override when connecting) to regenerate this file — don't edit the
#    values above by hand, they'll be overwritten on the next reconnect.
`;
}
