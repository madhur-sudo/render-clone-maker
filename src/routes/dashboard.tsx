import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  Bolt,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  History,
  Shuffle,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ContributingFactors } from "@/components/contributing-factors";
import { MetricCard } from "@/components/metric-card";
import { MitigationCard } from "@/components/mitigation-card";
import { Panel, PageHeader } from "@/components/panel";
import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskTrendChart } from "@/components/risk-trend-chart";
import { SnapshotModal } from "@/components/snapshot-modal";
import { WhatChangedPanel } from "@/components/what-changed-panel";
import { Button } from "@/components/ui/button";
import { riskSeries } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Sprint Overview — SprintShield" },
      {
        name: "description",
        content:
          "Monitor your active sprint, see the current risk score and understand which metrics are driving the most risk.",
      },
      { property: "og:title", content: "Sprint Overview — SprintShield" },
      {
        property: "og:description",
        content: "Live sprint risk, contributing factors and mitigation guidance in one dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    selectedProject,
    selectedSprint,
    risk,
    thresholds,
    mitigations,
    setMitigationStatus,
    snapshotDay,
    activeSnapshotDay,
    setSnapshotDay,
    snapshotDelta,
  } = useStore();

  const [
    modalDay,
    setModalDay,
  ] = useState<number | null>(null);

  const series = useMemo(
    () => (selectedSprint ? riskSeries(selectedSprint, thresholds) : []),
    [selectedSprint, thresholds],
  );

  // Find the day that precedes the active snapshot for the delta label.
  const prevDay = useMemo(() => {
    if (!selectedSprint) return undefined;
    const snaps = selectedSprint.snapshots.filter((s) => s.day < activeSnapshotDay);
    return snaps.length > 0 ? snaps[snaps.length - 1].day : undefined;
  }, [selectedSprint, activeSnapshotDay]);

  if (!selectedSprint || !risk) {
    return (
      <AppShell>
        <Panel title="No sprint data available">
          <p className="text-sm text-muted-foreground">
            Select a project with at least one sprint to see risk analysis.
          </p>
        </Panel>
      </AppShell>
    );
  }

  const snap = risk.snapshot;
  const churn = snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges;
  const scopeFactor = risk.factors.find((f) => f.key === "scopeChurn");
  const scopePct = Math.round((scopeFactor?.value ?? 0) * 100);
  const openMitigations = mitigations.filter(
    (m) => m.status === "not_started" || m.status === "in_progress",
  );

  const maxDay = selectedSprint.currentDay;
  const canGoBack = activeSnapshotDay > 1;
  const canGoForward = activeSnapshotDay < maxDay;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${selectedProject?.name ?? "Project"} · ${selectedSprint.name}`}
        title="Sprint Overview"
        subtitle="Early-warning risk analysis based on project metrics recorded up to the selected snapshot day."
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={selectedSprint.status} />
            <Button asChild size="sm" variant="secondary">
              <Link to="/sprints/$sprintId" params={{ sprintId: selectedSprint.id }}>
                Sprint detail
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Snapshot Day Selector ─────────────────────────────────── */}
      <section className="surface rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="eyebrow mb-1">Snapshot Day</div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={!canGoBack}
                onClick={() => setSnapshotDay(activeSnapshotDay - 1)}
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-display text-xl font-semibold tabular-nums w-28 text-center">
                Day {activeSnapshotDay} / {selectedSprint.lengthDays}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={!canGoForward}
                onClick={() => setSnapshotDay(activeSnapshotDay + 1)}
                aria-label="Next day"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div>
            <div className="eyebrow mb-1">Data window</div>
            <p className="text-sm text-muted-foreground">
              Prediction uses information available up to{" "}
              <strong className="text-foreground">Day {activeSnapshotDay}</strong>.
              {activeSnapshotDay < selectedSprint.lengthDays && (
                <span className="ml-1 text-analytic">
                  Days {activeSnapshotDay + 1}–{selectedSprint.lengthDays} withheld.
                </span>
              )}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {/* Day quick-jump buttons */}
            {[1, Math.round(maxDay / 2), maxDay].filter((d, i, arr) => arr.indexOf(d) === i && d >= 1 && d <= maxDay).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={activeSnapshotDay === d ? "default" : "secondary"}
                onClick={() => setSnapshotDay(d)}
                aria-label={`Jump to day ${d}`}
              >
                D{d}
              </Button>
            ))}
            {snapshotDay !== null && (
              <Button size="sm" variant="ghost" onClick={() => setSnapshotDay(null)}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Hero risk card ─────────────────────────────────────────── */}
      <section className="surface hero-glow relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            {/* Gauge shows the overall Baseline Risk Engine score (0–100) */}
            <RiskGauge score={risk.score} level={risk.level} size={208} label="Risk score" />
          </div>
          <div className="min-w-0">
            <div className="eyebrow">
              Baseline Risk Engine · Day {activeSnapshotDay} snapshot
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-semibold uppercase sm:text-5xl">
                {risk.level}
              </span>
              <RiskBadge level={risk.level} score={risk.score} size="md" />
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {risk.explanation}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Snapshot day" value={`Day ${snap.day} / ${selectedSprint.lengthDays}`} />
              <Stat label="Days remaining" value={`${risk.daysRemaining}`} />
              <Stat
                label="Progress"
                value={`${Math.round(risk.progressRatio * 100)}%`}
                hint={`expected ${Math.round(risk.expectedProgressRatio * 100)}%`}
              />
              <Stat label="Risk score" value={`${risk.score} / 100`} hint="Baseline Risk Engine" />
            </dl>
          </div>
        </div>
      </section>

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Sprint progress"
          value={`${Math.round(risk.progressRatio * 100)}%`}
          sub={`${snap.completedPoints} / ${snap.plannedPoints} story points`}
          icon={TrendingUp}
          progress={risk.progressRatio * 100}
        />
        <MetricCard
          label="Risk score"
          value={`${risk.score} / 100`}
          sub={`${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} risk · Baseline Engine`}
          icon={Gauge}
          tone={risk.level}
          progress={risk.score}
        />
        <MetricCard label="Planned work" value={snap.plannedPoints} sub="Story points" icon={Target} />
        <MetricCard
          label="Completed work"
          value={snap.completedPoints}
          sub="Story points"
          icon={CheckCircle2}
          tone="low"
        />
        <MetricCard
          label="Scope change"
          value={`${scopePct}%`}
          sub={`${churn} changes · ${scopePct >= 60 ? "High" : scopePct >= 30 ? "Moderate" : "Low"} activity`}
          icon={Shuffle}
          tone={scopePct >= 60 ? "high" : scopePct >= 30 ? "medium" : "low"}
          progress={scopePct}
        />
        <MetricCard
          label="Blocked issues"
          value={snap.blockedIssues}
          sub="Currently blocked"
          icon={AlertOctagon}
          tone={snap.blockedIssues >= 3 ? "high" : snap.blockedIssues > 0 ? "medium" : "low"}
        />
        <MetricCard
          label="Historical velocity"
          value={selectedSprint.historicalVelocity}
          sub="Story points per sprint"
          icon={History}
          tone="analytic"
        />
        <MetricCard
          label="Time remaining"
          value={`${risk.daysRemaining} days`}
          sub={`of a ${selectedSprint.lengthDays}-day sprint`}
          icon={CalendarClock}
        />
      </section>

      {/* ── Risk timeline ─────────────────────────────────────────── */}
      <Panel
        title="Risk Score Timeline"
        description="Recomputed for every day using only metrics available up to that day (no outcome leakage). Click a day to inspect its snapshot. Dashed line = expected progress."
      >
        <RiskTrendChart
          data={series}
          thresholds={thresholds}
          selectedDay={activeSnapshotDay}
          onSelectDay={(day) => {
            setSnapshotDay(day);
            setModalDay(day);
          }}
        />
      </Panel>

      {/* ── Analysis panels ───────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Contributing factors"
          description="Weighted contribution of each metric group to the current risk score."
          className="lg:col-span-2"
        >
          <ContributingFactors factors={risk.factors} />
        </Panel>

        <Panel title="Risk explanation" description="Baseline Risk Engine">
          <RiskExplanation risk={risk} />
        </Panel>
      </div>

      {/* ── What Changed? ─────────────────────────────────────────── */}
      {snapshotDelta && (
        <Panel
          title={`What changed since Day ${prevDay ?? "—"}?`}
          description="Metric deltas between adjacent snapshots. Red = worsened, green = improved."
        >
          <WhatChangedPanel delta={snapshotDelta} prevDay={prevDay ?? 0} />
        </Panel>
      )}

      {/* ── Recommended mitigation ────────────────────────────────── */}
      <Panel
        title="Recommended mitigation"
        description={`${openMitigations.length} open action${openMitigations.length === 1 ? "" : "s"} derived from the detected risk factors.`}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link to="/mitigation">
              <Bolt className="size-3.5" /> Mitigation Center
            </Link>
          </Button>
        }
      >
        {mitigations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No mitigation actions — no risk factor is above the action threshold.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mitigations.slice(0, 4).map((m) => (
              <MitigationCard
                key={m.id}
                action={m}
                sprintName={selectedSprint.name}
                onStatusChange={setMitigationStatus}
              />
            ))}
          </div>
        )}
      </Panel>

      <SnapshotModal
        sprint={selectedSprint}
        day={modalDay}
        open={modalDay !== null}
        onOpenChange={(open) => !open && setModalDay(null)}
      />
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-sm font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-[10px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}
