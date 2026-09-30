import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ContributingFactors } from "@/components/contributing-factors";
import { PageHeader, Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskGauge } from "@/components/risk-gauge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { computeRisk } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Early Sprint Risk Prediction — SprintShield" },
      {
        name: "description",
        content:
          "Pick a project, sprint and snapshot day to compute delay risk from only the metrics available at that point in the sprint.",
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

function PredictionsPage() {
  const { projects, sprints, selectedProject, selectedSprint, selectProject, selectSprint, thresholds } =
    useStore();
  const [day, setDay] = useState<number | null>(null);

  const projectSprints = sprints.filter((s) => s.projectId === selectedProject?.id);
  const sprint = selectedSprint;
  const maxDay = sprint?.currentDay ?? 1;
  const activeDay = Math.min(day ?? maxDay, maxDay);
  const risk = sprint ? computeRisk(sprint, thresholds, activeDay) : undefined;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Baseline Risk Engine — Demo Implementation"
        title="Early Sprint Risk Prediction"
        subtitle="Risk is computed using only information recorded up to the selected snapshot day. The final sprint outcome is never used as an input."
      />

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
          </div>
        </div>
      </Panel>

      {!sprint || !risk ? (
        <Panel title="No risk prediction available">
          <p className="text-sm text-muted-foreground">
            Select a sprint with recorded snapshots to compute a prediction.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Prediction">
              <div className="flex flex-col items-center gap-4">
                <RiskGauge score={risk.score} level={risk.level} size={180} />
                <RiskBadge level={risk.level} score={risk.score} size="md" />
                <dl className="w-full space-y-1.5 text-sm">
                  <Row label="Risk score" value={`${risk.score} / 100`} />
                  <Row label="Delay probability" value={`${risk.delayProbability}%`} />
                  <Row label="Snapshot" value={`Day ${activeDay} of ${sprint.lengthDays}`} />
                </dl>
              </div>
            </Panel>
            <Panel title="Contributing factors" className="lg:col-span-2">
              <ContributingFactors factors={risk.factors} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Metric summary" description={`Inputs used for the day ${activeDay} prediction.`}>
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
            </Panel>
            <Panel title="Risk Explanation">
              <RiskExplanation risk={risk} />
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
