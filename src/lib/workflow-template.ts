/**
 * Generic GitHub Action template committed to a repo when it's connected.
 * The serve command and port are filled in from either an auto-detected
 * package.json script or a value the user typed when connecting — never
 * hardcoded, since every project's build/serve setup differs. The repo id,
 * default branch, and ingest payload wiring are filled in since we already
 * know them.
 */
export function budgetlyWorkflowYaml(opts: {
	defaultBranch: string;
	githubRepoId: string;
	/** package.json script name that serves the production build (e.g. "start", "preview"). */
	startScript: string;
	/** Port the serve script listens on once started. */
	port: number;
}): string {
	return `name: Budgetly Performance Budgets

on:
  pull_request:
    branches: ["${opts.defaultBranch}"]

env:
  BUDGETLY_PORT: ${opts.port}

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Detect package manager
        id: pm
        run: |
          if [ -f pnpm-lock.yaml ]; then echo "manager=pnpm" >> "$GITHUB_OUTPUT"
          elif [ -f yarn.lock ]; then echo "manager=yarn" >> "$GITHUB_OUTPUT"
          else echo "manager=npm" >> "$GITHUB_OUTPUT"
          fi

      - name: Install dependencies
        run: |
          case "\${{ steps.pm.outputs.manager }}" in
            pnpm) pnpm install --frozen-lockfile ;;
            yarn) yarn install --frozen-lockfile ;;
            npm) npm ci ;;
          esac

      - name: Build
        run: |
          case "\${{ steps.pm.outputs.manager }}" in
            pnpm) pnpm run build ;;
            yarn) yarn build ;;
            npm) npm run build ;;
          esac

      - name: Start server in background
        run: |
          case "\${{ steps.pm.outputs.manager }}" in
            pnpm) pnpm run ${opts.startScript} & ;;
            yarn) yarn ${opts.startScript} & ;;
            npm) npm run ${opts.startScript} & ;;
          esac
          npx wait-on http://localhost:\${{ env.BUDGETLY_PORT }}

      - name: Run Lighthouse
        run: npx lighthouse http://localhost:\${{ env.BUDGETLY_PORT }} --output=json --output-path=./lighthouse.json --chrome-flags="--headless --no-sandbox"

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
          fetch("https://YOUR-BUDGETLY-DOMAIN/api/ingest", {
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
# 1. Replace YOUR-BUDGETLY-DOMAIN above with where Budgetly is deployed.
# 2. Add a repo secret named BUDGETLY_TOKEN (Settings > Secrets and
#    variables > Actions) with the token from Budgetly's Settings page.
# 3. Package manager (pnpm/yarn/npm) is auto-detected from the lockfile.
#    The serve script ("${opts.startScript}") and port (${opts.port}) were
#    detected from this repo's package.json at connect time — change the
#    "env: BUDGETLY_PORT" value above, or the script name in the "Start
#    server in background" step, if they're wrong or change later.
`;
}
