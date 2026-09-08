import { ArrowDownRight, ArrowUpRight, Minus } from "@phosphor-icons/react";
import { METRIC_META, formatMetric, metricDelta, type MetricKey } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

export function MetricCard({
  metric,
  value,
  baseline,
  budget,
}: {
  metric: MetricKey;
  value: number;
  baseline?: number;
  budget?: number;
}) {
  const meta = METRIC_META[metric];
  const d = baseline != null ? metricDelta(metric, value, baseline) : null;
  const status =
    budget != null
      ? metric === "PERF"
        ? value < budget
          ? "fail"
          : "ok"
        : value > budget
          ? "fail"
          : "ok"
      : "ok";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{metric}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground/80">{meta.label}</div>
        </div>
        {budget != null && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              status === "fail"
                ? "bg-destructive/15 text-destructive"
                : "bg-success/15 text-success"
            }`}
          >
            budget {formatMetric(metric, budget)}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-3xl font-semibold tabular-nums">
          {formatMetric(metric, value)}
        </div>
        {d && (
          <div
            className={`flex items-center gap-0.5 font-mono text-xs ${
              d.diff === 0
                ? "text-muted-foreground"
                : d.better
                  ? "text-success"
                  : "text-destructive"
            }`}
          >
            {d.diff === 0 ? (
              <Minus className="h-3 w-3" />
            ) : d.better ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <ArrowUpRight className="h-3 w-3" />
            )}
            {Math.abs(d.pct).toFixed(1)}%
          </div>
        )}
      </div>
    </Card>
  );
}
