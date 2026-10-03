import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Database, FlaskConical } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/panel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — SprintShield" },
      {
        name: "description",
        content:
          "Early Sprint Risk Prediction and Mitigation in Agile Software Development Using Project Metrics: problem, dataset, methodology and limitations.",
      },
      { property: "og:title", content: "About the Project — SprintShield" },
      {
        property: "og:description",
        content: "The research behind SprintShield: TAWOS dataset, methodology, research gap and limitations.",
      },
    ],
  }),
  component: AboutPage,
});

/** TAWOS dataset figures as reported in the research scope. */
const DATASET = [
  ["36", "Projects"],
  ["4,594", "Sprints"],
  ["458,232", "Issues"],
  ["174,915", "Change records"],
];

/** Features engineered from the sprint change history. */
const FEATURES = [
  "Progress vs expected trajectory",
  "Planned vs completed story points",
  "Scope-change activity (issues added / removed / re-estimated)",
  "Blocked issue count",
  "Workload per developer",
  "Historical velocity vs committed load",
  "Process instability (status / assignee / sprint changes)",
  "Pace deficit (remaining points vs historical daily rate)",
];

/** Model pipeline stages — honest status. */
const PIPELINE = [
  { label: "Dataset identified (TAWOS — 36 projects, 4,594 sprints)", done: true },
  { label: "Preprocessing design (temporal snapshot reconstruction)", done: true },
  { label: "Temporal filtering design (no outcome leakage)", done: true },
  { label: "Feature engineering design (7 metric groups)", done: true },
  { label: "Baseline Risk Engine implemented (deterministic, transparent)", done: true },
  { label: "Decision-support dashboard built", done: true },
  { label: "Mitigation action framework implemented", done: true },
  { label: "Model training on TAWOS", done: false },
  { label: "k-fold cross-validation with temporal split", done: false },
  { label: "Model evaluation (precision, recall, F1, AUC)", done: false },
  { label: "Probability calibration (Platt scaling)", done: false },
  { label: "Live Jira data integration", done: false },
];

/** Demo workspace vs research dataset distinction. */
const WORKSPACE_INFO = [
  {
    label: "Research Dataset",
    icon: Database,
    color: "text-analytic",
    bg: "border-analytic/25 bg-analytic/5",
    items: [
      "36 real Jira projects from open-source repositories",
      "4,594 sprints with full change history",
      "458,232 issues tracked over time",
      "174,915 sprint-related change records",
      "Used for: feature validation, model training (pending), evaluation (pending)",
    ],
  },
  {
    label: "Demo Workspace",
    icon: FlaskConical,
    color: "text-primary",
    bg: "border-primary/20 bg-primary/5",
    items: [
      "3 synthetic projects (Atlas, Nimbus, Harbor)",
      "24 illustrative sprints with daily snapshots",
      "Data generated from realistic parameter seeds",
      "Used for: system demonstration and UI testing",
      "NOT from the TAWOS dataset",
    ],
  },
];

function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Research project"
        title="Early Sprint Risk Prediction and Mitigation"
        subtitle="In Agile Software Development using project metrics."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Problem statement">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sprint delays are usually recognised only at the sprint review — when it is too late to
            intervene. Risk signals such as scope churn, blocked work and workload imbalance appear
            much earlier in Jira project metrics, but are rarely combined into a single, explainable
            early warning.
          </p>
        </Panel>

        <Panel title="Research objectives">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Identify</strong> Agile project metrics that are
              predictive of sprint delivery risk.
            </li>
            <li>
              <strong className="text-foreground">Predict</strong> sprint delay risk while the sprint
              is still in progress, using only metrics available at prediction time.
            </li>
            <li>
              <strong className="text-foreground">Analyse</strong> which metrics contribute most to
              the predicted risk for a given sprint.
            </li>
            <li>
              <strong className="text-foreground">Provide</strong> targeted mitigation guidance,
              linked to the detected risk factors, to support Scrum Masters in real-time decisions.
            </li>
          </ol>
        </Panel>
      </div>

      {/* ── Dataset ────────────────────────────────────────────────── */}
      <Panel
        title="Dataset — TAWOS"
        description="Real-world, open-source Jira project data used for the research. Figures represent the full dataset scope."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {DATASET.map(([v, l]) => (
            <div key={l} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="font-display text-2xl font-semibold tabular-nums">{v}</div>
              <div className="eyebrow mt-1">{l}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Dashboard figures are from the synthetic
          demo workspace, not directly from the TAWOS dataset. The dataset above reflects the
          research scope only.
        </p>
      </Panel>

      {/* ── Dataset vs demo distinction ────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {WORKSPACE_INFO.map((ws) => (
          <Panel key={ws.label} title="">
            <div
              className={`-m-4 mb-0 rounded-t-xl border-b px-4 py-3 ${ws.bg}`}
            >
              <div className={`flex items-center gap-2 font-display text-sm font-semibold ${ws.color}`}>
                <ws.icon className="size-4" />
                {ws.label}
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {ws.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Methodology">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Reconstruct daily sprint snapshots from issue change-history records.</li>
            <li>
              Engineer features from each snapshot (see feature list below), ensuring only
              information available up to that day is used.
            </li>
            <li>Label each sprint by whether it was delivered on time (binary outcome).</li>
            <li>
              Apply temporal filtering — models are trained on earlier sprints and evaluated on
              later sprints to prevent data leakage.
            </li>
            <li>
              Score each mid-sprint snapshot to produce a risk level and ranked factor list.
            </li>
            <li>Map active risk factors to targeted mitigation actions.</li>
          </ol>
        </Panel>

        <Panel title="Engineered features">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Research gap">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Most existing work predicts sprint outcomes retrospectively or focuses on effort
            estimation at sprint planning. Few studies combine mid-sprint prediction with
            explainable factor analysis and actionable mitigation guidance in a single decision-support
            system.
          </p>
        </Panel>

        <Panel title="Proposed system">
          <p className="text-sm leading-relaxed text-muted-foreground">
            SprintShield connects project data, daily sprint metrics, risk scoring, factor
            explanation and mitigation into one workflow. The prediction engine is a replaceable
            module: a trained classification model can be substituted without changing the
            dashboards or mitigation logic.
          </p>
        </Panel>
      </div>

      {/* ── Model pipeline ─────────────────────────────────────────── */}
      <Panel
        title="Model pipeline readiness"
        description="Truthful status of each development stage. Completed stages are implemented; pending stages represent future work."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {PIPELINE.map((stage) => (
            <div
              key={stage.label}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                stage.done
                  ? "border-risk-low/25 bg-risk-low/5 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {stage.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-low" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
              )}
              {stage.label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No accuracy, precision, recall, F1 or AUC figures are reported. These will be available
          after model training and evaluation on the TAWOS dataset.
        </p>
      </Panel>

      <Panel title="Limitations and honest scope">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Demo implementation only.</strong> The current
            application uses a transparent, deterministic Baseline Risk Engine — not a trained
            machine-learning model. No accuracy, precision, recall or F1 figures are claimed.
          </li>
          <li>
            <strong className="text-foreground">Synthetic demo data.</strong> All dashboard figures
            are generated from a realistic demo workspace, not directly extracted from TAWOS. They
            serve as illustrative examples of the system concept.
          </li>
          <li>
            <strong className="text-foreground">No live Jira integration.</strong> Data ingestion
            from a live Jira instance is not yet implemented.
          </li>
          <li>
            <strong className="text-foreground">Model training pending.</strong> Classifier training,
            cross-validation and evaluation on the TAWOS dataset represent the next development
            phase.
          </li>
          <li>
            <strong className="text-foreground">Delay probability = risk score.</strong> Until
            proper probability calibration (e.g., Platt scaling) is applied to a trained classifier,
            the delay probability is set equal to the risk score as a placeholder.
          </li>
        </ul>
      </Panel>
    </AppShell>
  );
}
