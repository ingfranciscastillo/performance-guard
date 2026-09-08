import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-7 ml-10 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login"><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Start free</Button></Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col md:flex-row items-start md:items-center gap-6 text-sm text-muted-foreground">
          <Logo />
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Status</a>
            <a href="#" className="hover:text-foreground">Docs</a>
          </div>
          <div className="md:ml-auto font-mono text-xs">© {new Date().getFullYear()} Budgetly Labs</div>
        </div>
      </footer>
    </div>
  );
}
