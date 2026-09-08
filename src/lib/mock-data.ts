export type PrStatus = "passing" | "warning" | "failing"

export type MetricKey = "PERF" | "LCP" | "INP" | "CLS"

export const METRIC_META: Record<MetricKey, { label: string; unit: "score" | "ms" | "s" | "unitless"; higherIsBetter: boolean }> = {
  PERF: { label: "Lighthouse performance score", unit: "score", higherIsBetter: true },
  LCP: { label: "Largest Contentful Paint", unit: "s", higherIsBetter: false },
  INP: { label: "Interaction to Next Paint", unit: "ms", higherIsBetter: false },
  CLS: { label: "Cumulative Layout Shift", unit: "unitless", higherIsBetter: false },
}

export function formatMetric(metric: MetricKey, value: number): string {
  switch (METRIC_META[metric].unit) {
    case "score":
      return Math.round(value).toString()
    case "s":
      return `${value.toFixed(2)}s`
    case "ms":
      return `${Math.round(value)}ms`
    default:
      return value.toFixed(3)
  }
}

export function metricDelta(metric: MetricKey, value: number, baseline: number) {
  const diff = value - baseline
  const pct = baseline !== 0 ? (diff / baseline) * 100 : 0
  const higherIsBetter = METRIC_META[metric].higherIsBetter
  const better = diff === 0 ? true : higherIsBetter ? diff > 0 : diff < 0
  return { diff, pct, better }
}
