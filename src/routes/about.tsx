import { createFileRoute } from "@tanstack/react-router";

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
        </ul>
      </Panel>
    </AppShell>
  );
}
