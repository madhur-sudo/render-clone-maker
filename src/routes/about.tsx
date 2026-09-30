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

const DATASET = [
  ["36", "Projects"],
  ["4,594", "Sprints"],
  ["458,232", "Issues"],
  ["174,915", "Change records"],
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
        <Panel title="Problem">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sprint delays are usually recognised only at the sprint review, when it is too late to act. Signals
            such as scope churn, blocked work and workload imbalance appear much earlier in project metrics but are
            rarely combined into a single, explainable early warning.
          </p>
        </Panel>
        <Panel title="Objectives">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Predict sprint delay risk while the sprint is still in progress.</li>
            <li>Explain which metrics contribute to the risk.</li>
            <li>Recommend concrete mitigation actions per risk factor.</li>
            <li>Support Scrum Masters in day-to-day decisions.</li>
          </ul>
        </Panel>
      </div>

      <Panel title="Dataset — TAWOS" description="Real-world open-source Jira data used for the research.">
        <div className="grid gap-3 sm:grid-cols-4">
          {DATASET.map(([v, l]) => (
            <div key={l} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="font-display text-2xl font-semibold tabular-nums">{v}</div>
              <div className="eyebrow mt-1">{l}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Methodology">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Reconstruct daily sprint snapshots from issue change history.</li>
            <li>Engineer features: progress vs expected, scope churn, blockers, workload, velocity strain, process instability.</li>
            <li>Label each sprint by whether it was delivered on time.</li>
            <li>Train and evaluate models using only data available up to each snapshot day (no outcome leakage).</li>
          </ol>
        </Panel>
        <Panel title="Research gap">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Existing work mostly predicts outcomes after the sprint or focuses on effort estimation. Few studies
            provide mid-sprint prediction combined with explanations and actionable mitigation.
          </p>
        </Panel>
        <Panel title="Proposed system">
          <p className="text-sm leading-relaxed text-muted-foreground">
            SprintShield connects project data, sprint metrics, risk prediction, explanation and mitigation into one
            workflow. The prediction engine is a replaceable module, so a trained model can be plugged in later.
          </p>
        </Panel>
        <Panel title="Limitations">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>This demo uses a transparent Baseline Risk Engine, not a trained machine-learning model.</li>
            <li>All figures in the dashboards are synthetic demo values, not experimental results.</li>
            <li>No live Jira integration in this version.</li>
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
