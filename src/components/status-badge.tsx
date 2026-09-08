import type { PrStatus } from "@/lib/mock-data";

const styles: Record<PrStatus, string> = {
  passing: "bg-primary/15 text-primary border-primary/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  failing: "bg-destructive/15 text-destructive border-destructive/30",
};

const labels: Record<PrStatus, string> = {
  passing: "Passing",
  warning: "Warning",
  failing: "Failing",
};

export function StatusBadge({ status }: { status: PrStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "passing" ? "bg-primary" : status === "warning" ? "bg-warning" : "bg-destructive"}`} />
      {labels[status]}
    </span>
  );
}
