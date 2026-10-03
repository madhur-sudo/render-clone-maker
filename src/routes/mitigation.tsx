import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { MitigationCard } from "@/components/mitigation-card";
import { PageHeader, Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { IMPACT_BG } from "@/lib/risk-ui";
import { cn } from "@/lib/utils";
import type { MitigationStatus } from "@/lib/types";

export const Route = createFileRoute("/mitigation")({
  head: () => ({
    meta: [
      { title: "Mitigation Center — SprintShield" },
      {
        name: "description",
        content:
          "Turn detected sprint risk factors into prioritised corrective actions and track them from not started to completed.",
      },
      { property: "og:title", content: "Mitigation Center — SprintShield" },
      {
        property: "og:description",
        content: "Prioritised, trackable mitigation actions generated from live sprint risk factors.",
      },
    ],
  }),
  component: MitigationPage,
});

const STATUSES: Array<{ value: MitigationStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "dismissed", label: "Dismissed" },
];

function MitigationPage() {
  const { selectedSprint, selectedProject, mitigations, setMitigationStatus, risk, activeSnapshotDay } = useStore();
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () => mitigations.filter((m) => status === "all" || m.status === status),
    [mitigations, status],
  );

  const counts = useMemo(() => {
    return {
      open: mitigations.filter((m) => m.status === "not_started").length,
      active: mitigations.filter((m) => m.status === "in_progress").length,
      done: mitigations.filter((m) => m.status === "completed").length,
      dismissed: mitigations.filter((m) => m.status === "dismissed").length,
    };
  }, [mitigations]);

  // Top active factors to show the risk → action chain.
  const topFactors = risk?.factors.filter((f) => f.value >= 0.3).slice(0, 3) ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${selectedProject?.name ?? ""} · ${selectedSprint?.name ?? ""}`}
        title="Mitigation Center"
        subtitle="Recommended actions generated directly from the risk factors detected in this sprint. Each action is linked to a contributing signal."
        action={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* ── Risk → Action chain ───────────────────────────────────── */}
      {risk && topFactors.length > 0 && (
        <Panel
          title="Risk → Action connection"
          description={`Current sprint risk: ${risk.score} / 100 (${risk.level}). Actions below are triggered by the factors listed here.`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 py-2">
              <ShieldAlert className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Risk: {risk.score} / 100</span>
              <RiskBadge level={risk.level} />
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            {topFactors.map((f, i) => (
              <div key={f.key} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    IMPACT_BG[f.impact],
                  )}
                >
                  {f.label} (+{f.contribution} pts)
                </span>
              </div>
            ))}
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              {mitigations.length} mitigation action{mitigations.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Snapshot: Day {activeSnapshotDay} of {selectedSprint?.lengthDays ?? "—"} ·{" "}
            Baseline Risk Engine · Illustrative demo workspace.
          </p>
        </Panel>
      )}

      {/* ── Status summary ────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Summary label="Not started" value={counts.open} icon={Clock} className="" />
        <Summary label="In progress" value={counts.active} icon={ShieldAlert} className="border-primary/30 bg-primary/5" />
        <Summary label="Completed" value={counts.done} icon={CheckCircle2} className="border-risk-low/30 bg-risk-low/5" />
        <Summary label="Dismissed" value={counts.dismissed} icon={XCircle} className="" />
      </div>

      {/* ── Actions grid ─────────────────────────────────────────── */}
      <Panel
        title="Recommended actions"
        description={
          risk
            ? `Generated from ${topFactors.length} active risk factor${topFactors.length !== 1 ? "s" : ""} above the action threshold (≥ 30% signal strength).`
            : undefined
        }
      >
        {filtered.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mitigations.length === 0
                ? "No mitigation actions yet — this sprint has no risk factor above the action threshold."
                : "No actions match this status filter."}
            </p>
            {mitigations.length === 0 && (
              <Button asChild className="mt-4" size="sm" variant="secondary">
                <Link to="/predictions">View risk analysis</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((m) => (
              <MitigationCard
                key={m.id}
                action={m}
                sprintName={selectedSprint?.name}
                onStatusChange={setMitigationStatus}
              />
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  className: string;
}) {
  return (
    <div className={cn("surface rounded-xl p-4", className)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <div className="eyebrow">{label}</div>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
