import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  Lock,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ContributingFactors } from "@/components/contributing-factors";
import { PageHeader, Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskTrendChart } from "@/components/risk-trend-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { computeRisk, riskSeries } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Early Sprint Risk Prediction — SprintShield" },
      {
        name: "description",
        content:
          "Pick a project, sprint and snapshot day to assess risk using only metrics available at that point in the sprint.",
      },
      { property: "og:title", content: "Early Sprint Risk Prediction — SprintShield" },
      {
        property: "og:description",
        content: "Mid-sprint risk prediction from project metrics, with no outcome leakage.",
      },
    ],
  }),
  component: PredictionsPage,
});

/** Model pipeline stages — truthful, no fabricated accuracy. */
const PIPELINE_STAGES = [
  { label: "Dataset identified (TAWOS)", done: true },
  { label: "Preprocessing design", done: true },
  { label: "Temporal filtering design", done: true },
  { label: "Feature engineering design", done: true },
  { label: "Baseline Risk Engine implemented", done: true },
  { label: "Model training", done: false },
  { label: "Cross-validation", done: false },
  { label: "Evaluation on TAWOS", done: false },
  { label: "Probability calibration", done: false },
];

function PredictionsPage() {
  const { projects, sprints, selectedProject, selectedSprint, selectProject, selectSprint, thresholds } =
    useStore();
  const [day, setDay] = useState<number | null>(null);

  const projectSprints = sprints.filter((s) => s.projectId === selectedProject?.id);
  const sprint = selectedSprint;
  const maxDay = sprint?.currentDay ?? 1;
  const activeDay = Math.min(day ?? maxDay, maxDay);
  const risk = sprint ? computeRisk(sprint, thresholds, activeDay) : undefined;
  const series = sprint ? riskSeries(sprint, thresholds) : [];

  // Days NOT yet available — post-snapshot window
  const daysReserved = sprint ? sprint.lengthDays - activeDay : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Baseline Risk Engine — Demo Implementation"
        title="Early Sprint Risk Prediction"
        subtitle="Risk is computed using only information recorded up to the selected snapshot day. The final sprint outcome is never used as a prediction input."
      />

      {/* ── Academic status banner ─────────────────────────────────── */}
      <div className="rounded-xl border border-analytic/30 bg-analytic/5 px-4 py-3 text-xs text-analytic">
        <strong className="font-semibold">Research status:</strong>{" "}
        Illustrative baseline — model training and evaluation on the TAWOS dataset are pending. No accuracy,
        F1 or AUC figures are claimed.
      </div>

      {/* ── Prediction inputs ─────────────────────────────────────── */}
      <Panel title="Prediction inputs">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="eyebrow mb-1.5">Project</div>
            <Select
              value={selectedProject?.id}
              onValueChange={(v) => {
                selectProject(v);
                setDay(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="eyebrow mb-1.5">Sprint</div>
            <Select
              value={sprint?.id}
              onValueChange={(v) => {
                selectSprint(v);
                setDay(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.status === "active" ? " · active" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="eyebrow mb-1.5">
              Snapshot day — Day {activeDay} / {sprint?.lengthDays ?? 0}
            </div>
            <Slider
              min={1}
              max={maxDay}
              step={1}
              value={[activeDay]}
              onValueChange={([v]) => setDay(v)}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Prediction uses information available up to Day {activeDay}.
            </p>
          </div>
        </div>
      </Panel>

      {/* ── Temporal integrity panel ──────────────────────────────── */}
      {sprint && (
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoBox label="Prediction snapshot" value={`Day ${activeDay} of ${sprint.lengthDays}`} />
          <InfoBox
            label="Data used"
            value={`Days 1–${activeDay}`}
            sub="Only metrics available up to this day are used as inputs."
          />
          <InfoBox
            label="Outcome window"
            value={
              daysReserved > 0
                ? `Days ${activeDay + 1}–${sprint.lengthDays} (${daysReserved} days reserved)`
                : "Sprint complete — full data available"
            }
            sub={
              daysReserved > 0
                ? "Post-snapshot data is withheld to prevent outcome leakage."
                : undefined
            }
            reserved={daysReserved > 0}
          />
        </div>
      )}

      {!sprint || !risk ? (
        <Panel title="No risk prediction available">
          <p className="text-sm text-muted-foreground">
            Select a sprint with recorded snapshots to compute a prediction.
          </p>
        </Panel>
      ) : (
        <>
          {/* ── Prediction output ─────────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Prediction">
              <div className="flex flex-col items-center gap-4">
                <RiskGauge score={risk.score} level={risk.level} size={180} label="Risk score" />
                <RiskBadge level={risk.level} score={risk.score} size="md" />
                <dl className="w-full space-y-1.5 text-sm">
                  <Row label="Risk score" value={`${risk.score} / 100`} />
                  <Row
                    label="Risk level"
                    value={risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
                    note={`Threshold: ≥ ${risk.level === "low" ? "0" : risk.level === "medium" ? "40" : risk.level === "high" ? "60" : "80"}`}
                  />
                  <Row label="Snapshot" value={`Day ${activeDay} of ${sprint.lengthDays}`} />
                  <Row label="Days remaining" value={`${risk.daysRemaining}`} />
                  <Row
                    label="Progress"
                    value={`${Math.round(risk.progressRatio * 100)}%`}
                    note={`expected ${Math.round(risk.expectedProgressRatio * 100)}%`}
                  />
                </dl>
                <div className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">BASELINE ENGINE</span> · Not a trained
                  ML model. Deterministic, transparent scoring.
                </div>
              </div>
            </Panel>
            <Panel title="Contributing factors" className="lg:col-span-2">
              <ContributingFactors factors={risk.factors} />
            </Panel>
          </div>

          {/* ── Risk timeline ─────────────────────────────────────── */}
          <Panel
            title="Risk Score Timeline"
            description={`Day-by-day risk for ${sprint.name}. The selected snapshot day is highlighted.`}
          >
            <RiskTrendChart
              data={series}
              thresholds={thresholds}
              selectedDay={activeDay}
              height={260}
            />
          </Panel>

          {/* ── Metric summary + explanation ──────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Metric summary"
              description={`All inputs used for the Day ${activeDay} prediction. Post-snapshot data is withheld.`}
            >
              <dl className="divide-y divide-border rounded-lg border border-border">
                {[
                  ["Completed story points", risk.snapshot.completedPoints],
                  ["Planned story points", risk.snapshot.plannedPoints],
                  ["Historical velocity", sprint.historicalVelocity],
                  ["Issues in sprint", risk.snapshot.issuesTotal],
                  ["Issues added", risk.snapshot.issuesAdded],
                  ["Issues removed", risk.snapshot.issuesRemoved],
                  ["Story-point changes", risk.snapshot.storyPointChanges],
                  ["Blocked issues", risk.snapshot.blockedIssues],
                  ["Status changes", risk.snapshot.statusChanges],
                  ["Assignee changes", risk.snapshot.assigneeChanges],
                  ["Sprint reassignments", risk.snapshot.reassignments],
                  ["Developers", risk.snapshot.devCount],
                  ["Days remaining", risk.daysRemaining],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between px-3 py-2 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Data provenance:</strong> Sprint snapshot (illustrative
                demo workspace). No live Jira connection.
              </p>
            </Panel>

            <div className="space-y-4">
              <Panel title="Risk explanation">
                <RiskExplanation risk={risk} />
              </Panel>

              {/* ── Model pipeline status ───────────────────────── */}
              <Panel title="Model pipeline status" description="What has been built vs what remains for the ML stage.">
                <ul className="space-y-2">
                  {PIPELINE_STAGES.map((stage) => (
                    <li key={stage.label} className="flex items-center gap-2.5 text-sm">
                      {stage.done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-risk-low" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={stage.done ? "text-foreground" : "text-muted-foreground"}>
                        {stage.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          {/* ── Sprint goal ───────────────────────────────────────── */}
          <Panel title="Sprint goal">
            <p className="text-sm text-muted-foreground italic">"{sprint.goal}"</p>
          </Panel>
        </>
      )}
    </AppShell>
  );
}

/** Temporal integrity info box. */
function InfoBox({
  label,
  value,
  sub,
  reserved,
}: {
  label: string;
  value: string;
  sub?: string;
  reserved?: boolean;
}) {
  return (
    <div
      className={`surface rounded-xl p-4 ${reserved ? "border-analytic/25 bg-analytic/5" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        {reserved && <Lock className="size-3.5 text-analytic" aria-hidden />}
        <div className={`eyebrow ${reserved ? "text-analytic" : ""}`}>{label}</div>
      </div>
      <div className="mt-1.5 font-display text-sm font-semibold">{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
        {note && <span className="block text-[10px] text-muted-foreground/70">{note}</span>}
      </dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
