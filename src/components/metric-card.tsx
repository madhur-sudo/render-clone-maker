import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  progress,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "low" | "medium" | "high" | "critical" | "analytic";
  progress?: number;
}) {
  const toneText: Record<string, string> = {
    default: "text-foreground",
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
    critical: "text-risk-critical",
    analytic: "text-analytic",
  };
  const toneBar: Record<string, string> = {
    default: "bg-primary",
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
    critical: "bg-risk-critical",
    analytic: "bg-analytic",
  };

  return (
    <div className="surface group rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {Icon && (
          <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </div>
      <div className={cn("mt-3 font-display text-2xl font-semibold tabular-nums", toneText[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width] duration-700", toneBar[tone])}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
