import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PRS, formatMetric, metricDelta } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/pulls/")({
  head: () => ({ meta: [{ title: "Pull Requests: Budgetly" }] }),
  component: Pulls,
});

function Pulls() {
  return (
    <AppShell title="Pull Requests">
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-3">PR</th>
              <th className="text-left font-medium px-5 py-3">Title</th>
              <th className="text-left font-medium px-5 py-3">Repo</th>
              <th className="text-left font-medium px-5 py-3">LCP</th>
              <th className="text-left font-medium px-5 py-3">Score</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PRS.map((p) => {
              const lcpD = metricDelta("LCP", p.metrics.LCP, p.baseline.LCP);
              const perfD = metricDelta("PERF", p.metrics.PERF, p.baseline.PERF);
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{p.number}</td>
                  <td className="px-5 py-3"><Link to="/pulls/$prId" params={{ prId: p.id }} className="font-medium hover:text-primary">{p.title}</Link><div className="text-xs text-muted-foreground font-mono">{p.author} · {p.openedAt}</div></td>
                  <td className="px-5 py-3 font-mono text-xs">{p.repoId}</td>
                  <td className="px-5 py-3 font-mono"><span>{formatMetric("LCP", p.metrics.LCP)}</span> <span className={`text-xs ml-1 ${lcpD.better ? "text-success" : "text-destructive"}`}>{lcpD.diff >= 0 ? "+" : ""}{lcpD.pct.toFixed(0)}%</span></td>
                  <td className="px-5 py-3 font-mono"><span>{p.metrics.PERF}</span> <span className={`text-xs ml-1 ${perfD.better ? "text-success" : "text-destructive"}`}>{perfD.diff >= 0 ? "+" : ""}{perfD.diff}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
