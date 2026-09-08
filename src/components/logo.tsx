import { Gauge } from "@phosphor-icons/react"
import { cn } from "cn"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Gauge className="size-4" weight="fill" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Guard
      </span>
    </div>
  )
}
