import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AlertOctagon,
  ArrowLeft,
  CircleDot,
  Shuffle,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { ContributingFactors } from "@/components/contributing-factors";
import { MetricCard } from "@/components/metric-card";
import { MitigationCard } from "@/components/mitigation-card";
import { PageHeader, Panel } from "@/components/panel";
import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { RiskExplanation } from "@/components/risk-explanation";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskTrendChart } from "@/components/risk-trend-chart";
import { SnapshotModal } from "@/components/snapshot-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { riskSeries } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sprints/$sprintId")({
  head: () => ({
    meta: [
      { title: "Sprint detail — SprintShield" },
      {
        name: "description",
        content:
          "Full sprint breakdown: risk score, metric charts, contributing factors, timeline, issues and mitigation actions.",
      },
      { property: "og:title", content: "Sprint detail — SprintShield" },
      {
        property: "og:description",
        content: "Risk, metrics, timeline, issues and mitigation for a single sprint.",
      },
    ],
  }),
  component: SprintDetail,
});

const CHART_AXIS = { fill: "var(--color-muted-foreground)", fontSize: 11 };

function SprintDetail() {
  const { sprintId } = useParams({ from: "/sprints/$sprintId" });
  const { sprints, riskFor, thresholds, mitigationsFor, setMitigationStatus } = useStore();
  const [snapshotDay, setSnapshotDay] = useState<number | null>(null);

  const sprint = sprints.find((s) => s.id === sprintId);

  const series = useMemo(() => (sprint ? riskSeries(sprint, thresholds) : []), [sprint, thresholds]);

  if (!sprint) {
    return (
      <AppShell>
        <Panel title="Sprint not found">
          <p className="text-sm text-muted-foreground">
            This sprint no longer exists in the demo workspace.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/sprints">Back to sprints</Link>
          </Button>
        </Panel>
      </AppShell>
    );
  }

  const risk = riskFor(sprint);
  const snap = risk.snapshot;
  const actions = mitigationsFor(sprint);

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/sprints">
          <ArrowLeft className="size-3.5" /> All sprints
        </Link>
      </Button>

      <PageHeader
        eyebrow={sprint.goal}
        title={sprint.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={sprint.status} />
            <RiskBadge level={risk.level} score={risk.score} size="md" />
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs tabular-nums">
              {Math.round(risk.progressRatio * 100)}% progress
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs tabular-nums">
              {risk.score}% risk score
            </span>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          {[
            ["overview", "Overview"],
            ["metrics", "Metrics"],
            ["risk", "Risk Analysis"],
            ["timeline", "Timeline"],
            ["issues", "Issues"],
            ["mitigation", "Mitigation"],
          ].map(([v, label]) => (
            <TabsTrigger key={v} value={v}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Current risk" className="lg:col-span-1">
              <div className="flex flex-col items-center gap-4">
                <RiskGauge score={risk.score} level={risk.level} size={176} />
                <p className="text-center text-xs text-muted-foreground">
                  Day {snap.day} of {sprint.lengthDays} · {risk.daysRemaining} days remaining
                </p>
              </div>
            </Panel>
            <Panel title="Risk trend" className="lg:col-span-2">
              <RiskTrendChart
                data={series}
                thresholds={thresholds}
                height={240}
                onSelectDay={setSnapshotDay}
              />
            </Panel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Progress"
              value={`${Math.round(risk.progressRatio * 100)}%`}
              sub={`${snap.completedPoints} / ${snap.plannedPoints} pts`}
              progress={risk.progressRatio * 100}
            />
            <MetricCard label="Blocked issues" value={snap.blockedIssues} sub="Currently blocked" icon={AlertOctagon} tone={snap.blockedIssues >= 3 ? "high" : "medium"} />
            <MetricCard label="Scope changes" value={snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges} sub="Added / removed / re-pointed" icon={Shuffle} tone="medium" />
            <MetricCard label="Developers" value={snap.devCount} sub={`${(snap.issuesTotal / snap.devCount).toFixed(1)} issues each`} icon={Users} tone="analytic" />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Progress vs planned work">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={CHART_AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="completedPoints" name="Completed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="plannedPoints" name="Planned" stroke="var(--chart-1)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Scope changes and blockers per day">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={CHART_AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={CHART_AXIS} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="scopeChanges" name="Scope changes" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="blocked" name="Blocked" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel title="Contributing factors" className="lg:col-span-2">
            <ContributingFactors factors={risk.factors} />
          </Panel>
          <Panel title="Risk Explanation">
            <RiskExplanation risk={risk} />
          </Panel>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Panel title="Sprint timeline" description="Chronological events recorded during the sprint.">
            {sprint.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded for this sprint.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-5">
                {sprint.events.map((e, i) => (
                  <li key={`${e.day}-${i}`} className="relative">
                    <CircleDot
                      className={cn(
                        "absolute -left-[1.6rem] top-0.5 size-3.5",
                        e.type === "blocker"
                          ? "text-risk-high"
                          : e.type === "scope"
                            ? "text-risk-medium"
                            : e.type === "process"
                              ? "text-analytic"
                              : "text-risk-low",
                      )}
                    />
                    <div className="text-xs text-muted-foreground">Day {e.day}</div>
                    <div className="font-display text-sm font-medium">{e.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <Panel title="Issues affecting this sprint" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-border">
              {sprint.issues.map((issue) => (
                <li key={issue.key} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                  <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                  <span className="text-xs text-muted-foreground">{issue.assignee}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">{issue.points} pts</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      issue.status === "blocked"
                        ? "border-risk-high/30 bg-risk-high/12 text-risk-high"
                        : issue.status === "done"
                          ? "border-risk-low/30 bg-risk-low/12 text-risk-low"
                          : issue.status === "in_progress"
                            ? "border-primary/30 bg-primary/12 text-primary"
                            : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="mitigation" className="mt-4">
          <Panel title="Recommended actions" description="Derived from this sprint's risk factors.">
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mitigation actions yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {actions.map((m) => (
                  <MitigationCard
                    key={m.id}
                    action={m}
                    sprintName={sprint.name}
                    onStatusChange={setMitigationStatus}
                  />
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <SnapshotModal
        sprint={sprint}
        day={snapshotDay}
        open={snapshotDay !== null}
        onOpenChange={(open) => !open && setSnapshotDay(null)}
      />
    </AppShell>
  );
}
