import { cn } from "@/lib/utils";
import { IMPACT_BG } from "@/lib/risk-ui";
import type { RiskFactor } from "@/lib/types";

export function ContributingFactors({ factors }: { factors: RiskFactor[] }) {
  const active = factors.filter((f) => f.value > 0.02);

  if (active.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contributing risk factors detected for this snapshot.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {active.map((f, i) => (
        <li key={f.key} className="group">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-sm font-medium">{f.label}</span>
            <span
              className={cn(
                "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                IMPACT_BG[f.impact],
              )}
            >
              {f.impact} impact
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700",
                  f.impact === "high"
                    ? "bg-risk-high"
                    : f.impact === "medium"
                      ? "bg-risk-medium"
                      : "bg-risk-low",
                )}
                style={{ width: `${Math.round(f.value * 100)}%` }}
              />
            </div>
            <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
              +{f.contribution} pts
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
        </li>
      ))}
    </ol>
  );
}
