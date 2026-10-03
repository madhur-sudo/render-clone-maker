import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { SnapshotDelta } from "@/lib/store";
import { cn } from "@/lib/utils";

interface DeltaItemProps {
  label: string;
  value: number;
  unit?: string;
  inverted?: boolean; // if true, positive = good (e.g., completedPoints)
}

function DeltaItem({ label, value, unit = "", inverted = false }: DeltaItemProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = inverted ? isPositive : isNegative;
  const isBad = inverted ? isNegative : isPositive;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1 font-display text-sm font-semibold tabular-nums",
          isGood ? "text-risk-low" : isBad ? "text-risk-high" : "text-muted-foreground",
        )}
      >
        {isPositive ? (
          <ArrowUp className="size-3.5" />
        ) : isNegative ? (
          <ArrowDown className="size-3.5" />
        ) : (
          <Minus className="size-3.5" />
        )}
        {Math.abs(value)}
        {unit}
      </span>
    </div>
  );
}

export function WhatChangedPanel({ delta, prevDay }: { delta: SnapshotDelta; prevDay: number }) {
  if (!delta.hasPrev) {
    return (
      <p className="text-sm text-muted-foreground">
        No previous snapshot available for comparison (Day 1 is the first snapshot).
      </p>
    );
  }

  const riskDelta = delta.riskScore - delta.riskScorePrev;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Comparing current snapshot against Day {prevDay}. Positive changes in scope and blockers increase
        risk; positive progress decreases it.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <DeltaItem label="Risk score" value={riskDelta} unit=" pts" />
        <DeltaItem label="Scope changes" value={delta.scopeChanges} />
        <DeltaItem label="Blocked issues" value={delta.blockedIssues} />
        <DeltaItem label="Completed pts" value={delta.completedPoints} inverted />
        <DeltaItem label="Status changes" value={delta.statusChanges} />
        <DeltaItem label="Assignee changes" value={delta.assigneeChanges} />
      </div>
      <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
        <div className="eyebrow mb-1">Summary</div>
        <p className="text-sm leading-relaxed text-muted-foreground">{delta.explanation}</p>
      </div>
    </div>
  );
}
