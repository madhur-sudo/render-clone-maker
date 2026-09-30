import { cn } from "@/lib/utils";
import { RISK_BG } from "@/lib/risk-ui";
import { RISK_LEVEL_LABEL } from "@/lib/risk-engine";
import type { RiskLevel } from "@/lib/types";

export function RiskBadge({
  level,
  score,
  className,
  size = "sm",
}: {
  level: RiskLevel;
  score?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider",
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        RISK_BG[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {RISK_LEVEL_LABEL[level]}
      {score !== undefined && <span className="tabular-nums opacity-80">{score}%</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-primary/15 border-primary/35 text-primary",
    completed: "bg-muted border-border text-muted-foreground",
    planned: "bg-analytic/12 border-analytic/30 text-analytic",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        map[status] ?? map.planned,
      )}
    >
      {status}
    </span>
  );
}
