import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bolt,
  Database,
  GitCompare,
  Info,
  Layers,
  LineChart,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskBadge } from "@/components/risk-badge";
import { RiskTrendChart } from "@/components/risk-trend-chart";
import { Button } from "@/components/ui/button";
import { computeRisk, DEFAULT_THRESHOLDS, riskSeries } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SprintShield — See sprint risk before the sprint slips" },
      {
        name: "description",
        content:
          "SprintShield monitors an active Agile sprint, predicts delay risk from project metrics, explains the contributing factors and recommends mitigation.",
      },
      { property: "og:title", content: "SprintShield — See sprint risk before the sprint slips" },
      {
        property: "og:description",
        content:
          "Early sprint risk prediction and mitigation for Agile teams, driven by real project metrics.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Radar,
    title: "Early Risk Detection",
    body: "Identify potential sprint problems while there is still time to act, not at the retrospective.",
  },
  {
    icon: ScanSearch,
    title: "Explainable Predictions",
    body: "Every score breaks down into the project metrics that produced it, with weighted contributions.",
  },
  {
    icon: LineChart,
    title: "Metric-Based Analysis",
    body: "Workload, progress, scope changes, historical performance and team process activity in one view.",
  },
  {
    icon: Bolt,
    title: "Mitigation Guidance",
    body: "Turn each detected risk signal into a concrete, trackable corrective action for the team.",
  },
];

const PIPELINE = [
  { label: "Project Data", icon: Database, desc: "TAWOS Jira history" },
  { label: "Preprocessing", icon: Layers, desc: "Snapshot reconstruction" },
  { label: "Feature Engineering", icon: GitCompare, desc: "7 metric groups" },
  { label: "Mid-Sprint Snapshot", icon: ScanSearch, desc: "Temporal integrity" },
  { label: "Risk Prediction", icon: ShieldCheck, desc: "Baseline Engine" },
  { label: "Factor Analysis", icon: LineChart, desc: "Weighted contributions" },
  { label: "Mitigation Guidance", icon: Bolt, desc: "Actionable decisions" },
];

/** Observe → Predict → Explain → Act */
const WORKFLOW = [
  { step: "Observe", desc: "Select a sprint and snapshot day" },
  { step: "Predict", desc: "Engine scores risk from metrics" },
  { step: "Explain", desc: "See which factors drive the score" },
  { step: "Act", desc: "Start a mitigation action" },
];

function Landing() {
  const navigate = useNavigate();
  const { sprints, launchDemo, selectSprint } = useStore();
  const hero = sprints.find((s) => s.name === "Sprint 42");
  const risk = hero ? computeRisk(hero, DEFAULT_THRESHOLDS) : undefined;
  const series = hero ? riskSeries(hero, DEFAULT_THRESHOLDS) : [];

  const openDemo = () => {
    launchDemo();
    if (hero) selectSprint(hero.id);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/team">Team</Link>
            </Button>
            <Button size="sm" onClick={openDemo}>
              Open Dashboard
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hero-glow relative overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="size-3.5" /> Baseline Risk Engine · Demo workspace ready
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            See sprint risk before the sprint slips.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            SprintShield analyzes Agile project metrics during an active sprint to identify early warning
            signals, explain contributing factors, and support corrective action.
          </p>

          {/* ── Observe → Predict → Explain → Act ─────────────────── */}
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
            {WORKFLOW.map((w, i) => (
              <div key={w.step} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="size-4 text-muted-foreground/50 shrink-0" />}
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="font-display font-semibold text-primary">{w.step}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={openDemo}>
              Explore Demo <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/about">Read the research</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo Workspace — 3 projects, 24 sprints and daily sprint snapshots. No setup required.
          </p>

          {/* ── Live Sprint 42 preview ───────────────────────────── */}
          {hero && risk && (
            <div className="surface mt-14 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="eyebrow">Project Atlas · {hero.name} · Day {hero.currentDay} / {hero.lengthDays}</div>
                  <div className="mt-1 font-display text-lg font-semibold">Current sprint risk</div>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge level={risk.level} score={risk.score} size="md" />
                  <div className="text-xs text-muted-foreground">
                    Baseline Risk Engine<br />
                    <span className="text-[10px] text-analytic">Illustrative demo</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
                <div className="flex flex-col items-center gap-3">
                  <RiskGauge score={risk.score} level={risk.level} size={168} label="Risk score" />
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-center">
                    <div>
                      <dt className="text-muted-foreground">Progress</dt>
                      <dd className="font-semibold tabular-nums">{Math.round(risk.progressRatio * 100)}%</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Expected</dt>
                      <dd className="font-semibold tabular-nums">{Math.round(risk.expectedProgressRatio * 100)}%</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Blockers</dt>
                      <dd className="font-semibold tabular-nums">{risk.snapshot.blockedIssues}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Scope Δ</dt>
                      <dd className="font-semibold tabular-nums">
                        {risk.snapshot.issuesAdded + risk.snapshot.issuesRemoved + risk.snapshot.storyPointChanges}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="min-w-0">
                  <RiskTrendChart data={series} thresholds={DEFAULT_THRESHOLDS} height={210} />
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" />
                All numbers shown are from the demo workspace and driven by the same Baseline Risk Engine
                used throughout the application. Not from real project data.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="eyebrow mb-3">What SprintShield does</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="surface rounded-xl p-6 transition-colors hover:border-primary/30">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            From raw Jira project data to a decision the team can act on
          </h2>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((step, i) => (
              <li
                key={step.label}
                className="surface relative rounded-xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 font-display text-sm font-medium">{step.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{step.desc}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          See sprint risk before the sprint slips.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Sprint 42 in the demo workspace is currently{" "}
          {risk ? (
            <span className="font-semibold text-risk-high">{risk.level} risk ({risk.score} / 100)</span>
          ) : (
            "high risk"
          )}{" "}
          — open the dashboard to see why and what to do about it.
        </p>
        <div className="mt-7 flex justify-center">
          <Button size="lg" onClick={openDemo}>
            Launch Demo Workspace <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          <span>SprintShield · Team 5 — Agile Software Development</span>
          <span className="flex gap-4">
            <Link to="/about" className="hover:text-foreground">
              About the project
            </Link>
            <Link to="/team" className="hover:text-foreground">
              Team
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
