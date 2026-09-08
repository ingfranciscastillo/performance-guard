import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GithubLogo, CheckCircle, ArrowLeft } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in: Budgetly" },
      { name: "description", content: "Sign in to Budgetly with GitHub to monitor performance budgets on every PR." },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      {/* Brand / preview panel */}
      <aside className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-border bg-gradient-to-br from-primary/10 via-background to-background p-10">
        {/* Decorative brand blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-1/2 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center py-10">
          <FloatingPreview />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-base leading-relaxed text-foreground/90">
            "Budgetly caught a 38% LCP regression before it hit prod. It paid for itself in one sprint."
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-primary/30 grid place-items-center font-mono text-xs text-foreground">MR</div>
            <div>
              <div className="font-medium text-foreground">Marta Ruiz</div>
              <div className="text-xs">Staff Engineer, Acme Storefront</div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
          </div>
        </div>
      </aside>

      {/* Login panel */}
      <section className="relative flex flex-col px-6 sm:px-10 py-8">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Sign in with GitHub to keep performance budgets enforced on every pull request. We only request the minimum scopes needed.
            </p>

            <Button
              className="mt-8 w-full bg-foreground text-background hover:bg-foreground/90"
              size="lg"
              onClick={() => {
                void authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" });
              }}
            >
              <GithubLogo className="mr-2 h-4 w-4" weight="fill" /> Continue with GitHub
            </Button>

            <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Read access to PRs and commits</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Post status checks and comments</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Revoke anytime from GitHub settings</li>
            </ul>

            <div className="mt-10 text-xs text-muted-foreground">
              By continuing you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-mono">© {new Date().getFullYear()} Budgetly Labs</div>
      </section>
    </div>
  );
}

function FloatingPreview() {
  return (
    <div className="w-full max-w-md rotate-[-2deg]">
      <div className="rounded-xl border border-border bg-card shadow-[0_30px_80px_-30px_oklch(0.56_0.19_260_/_0.4)] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-mono text-muted-foreground">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <span className="ml-3">acme/web, PR #1247</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border bg-card">
          {[
            { k: "LCP", v: "3.42s", d: "+38%", bad: true },
            { k: "INP", v: "182ms", d: "-4%", bad: false },
            { k: "CLS", v: "0.07", d: "+0.01", bad: false },
            { k: "Score", v: "71", d: "-19", bad: true },
          ].map((m) => (
            <div key={m.k} className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
              <div className="mt-1.5 font-mono text-xl font-semibold">{m.v}</div>
              <div className={`mt-0.5 font-mono text-[11px] ${m.bad ? "text-destructive" : "text-success"}`}>{m.d} vs main</div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-muted/30 p-3 font-mono text-[11px]">
          <div className="text-destructive">✗ LCP budget exceeded, blocking merge</div>
          <div className="text-success">✓ INP within budget</div>
        </div>
      </div>

      {/* Floating mini-badge */}
      <div className="relative">
        <div className="absolute -top-6 -right-4 rotate-[6deg] rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Visitors</div>
          <div className="font-mono text-sm font-semibold">20,345 <span className="text-primary text-[10px]">+53%</span></div>
        </div>
      </div>
    </div>
  );
}
