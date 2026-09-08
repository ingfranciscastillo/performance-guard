import { cn } from "cn";

export function Logo({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span className="grid size-6 shrink-0 place-items-center border border-foreground text-[13px] font-black text-foreground">
				B
			</span>
			<span className="text-[15px] font-extrabold tracking-tight text-foreground">
				Budgetly
			</span>
		</div>
	);
}
