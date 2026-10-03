import { cn } from "@/lib/utils";
import { IMPACT_BG } from "@/lib/risk-ui";
import type { RiskFactor } from "@/lib/types";

export function ContributingFactors({
  factors,
  showDetail = true,
}: {
  factors: RiskFactor[];
  showDetail?: boolean;
}) {
  const active = factors.filter((f) => f.value > 0.02);
  const totalContribution = active.reduce((s, f) => s + f.contribution, 0);

  if (active.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contributing risk factors detected for this snapshot.
      </p>
    );
  }

  return (
    <div className="space-y-4">
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
              {/* Bar width = normalised signal strength (0..1) */}
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
              <div className="flex min-w-[7rem] flex-col items-end">
                <span className="text-xs tabular-nums font-semibold">
                  +{f.contribution.toFixed(1)} pts
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  of max {f.maxContribution}
                </span>
              </div>
            </div>
            {showDetail && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
            )}
          </li>
        ))}
      </ol>

      {/* Score breakdown footer */}
      <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Total factor contribution
          </span>
          <span className="font-display font-semibold tabular-nums">
            {totalContribution.toFixed(1)} pts
          </span>
        </div>
        <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          {active.map((f) => (
            <div
              key={f.key}
              className={cn(
                "h-full transition-[width] duration-700",
                f.impact === "high"
                  ? "bg-risk-high"
                  : f.impact === "medium"
                    ? "bg-risk-medium"
                    : "bg-risk-low",
              )}
              style={{ width: `${totalContribution > 0 ? (f.contribution / totalContribution) * 100 : 0}%` }}
              title={`${f.label}: +${f.contribution.toFixed(1)} pts`}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Source: Baseline Risk Engine · Snapshot day · Demo workspace
        </p>
      </div>
    </div>
  );
}
