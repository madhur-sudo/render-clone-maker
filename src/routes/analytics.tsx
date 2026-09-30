import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/panel";
import { RiskTrendChart } from "@/components/risk-trend-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { riskSeries } from "@/lib/risk-engine";
import { RISK_VAR } from "@/lib/risk-ui";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SprintShield" },
      {
        name: "description",
        content:
          "Cross-sprint analytics: risk trend, historical velocity, completion rate, scope-change activity, workload and blocked issues.",
      },
      { property: "og:title", content: "Analytics — SprintShield" },
      {
        property: "og:description",
        content: "Compare risk, velocity, completion and scope churn across a project's sprint history.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const AXIS = { fill: "var(--color-muted-foreground)", fontSize: 11 };
const TOOLTIP = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function AnalyticsPage() {
  const {
    projects,
    sprints,
    selectedProject,
    selectedSprint,
    selectProject,
    selectSprint,
    projectSprints,
    riskFor,
    thresholds,
  } = useStore();
  const [range, setRange] = useState("all");
  const [completedOnly, setCompletedOnly] = useState(false);

  const history = useMemo(() => {
    let list = projectSprints;
    if (completedOnly) list = list.filter((s) => s.status === "completed");
    if (range !== "all") list = list.slice(-Number(range));
    return list.map((s) => {
      const r = riskFor(s);
      const snap = r.snapshot;
      return {
        name: s.name.replace("Sprint ", "S"),
        risk: r.score,
        level: r.level,
        velocity: s.historicalVelocity,
        delivered: snap.completedPoints,
        completion: Math.round(r.progressRatio * 100),
        scope: snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges,
        workload: Number((snap.issuesTotal / Math.max(1, snap.devCount)).toFixed(1)),
        blocked: snap.blockedIssues,
      };
    });
  }, [projectSprints, completedOnly, range, riskFor]);

  const series = useMemo(
    () => (selectedSprint ? riskSeries(selectedSprint, thresholds) : []),
    [selectedSprint, thresholds],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Analytics"
        title="Sprint analytics"
        subtitle="Compare risk and delivery metrics across the sprint history of the selected project."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedProject?.id} onValueChange={selectProject}>
              <SelectTrigger className="w-40">
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
            <Select value={selectedSprint?.id} onValueChange={selectSprint}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sprints
                  .filter((s) => s.projectId === selectedProject?.id)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sprints</SelectItem>
                <SelectItem value="5">Last 5 sprints</SelectItem>
                <SelectItem value="3">Last 3 sprints</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <Switch checked={completedOnly} onCheckedChange={setCompletedOnly} />
              Completed only
            </label>
          </div>
        }
      />

      {history.length === 0 ? (
        <Panel title="No sprint data available">
          <p className="text-sm text-muted-foreground">
            Adjust the filters to include at least one sprint.
          </p>
        </Panel>
      ) : (
        <>
          <Panel
            title="Sprint Risk Trend"
            description={`Day-by-day risk for ${selectedSprint?.name ?? "the selected sprint"}.`}
          >
            <RiskTrendChart data={series} thresholds={thresholds} height={260} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Risk by sprint">
              <Chart>
                <BarChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="risk" name="Risk score" radius={[4, 4, 0, 0]}>
                    {history.map((h) => (
                      <Cell key={h.name} fill={RISK_VAR[h.level]} />
                    ))}
                  </Bar>
                </BarChart>
              </Chart>
            </Panel>

            <Panel title="Historical Velocity">
              <Chart>
                <LineChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line type="monotone" dataKey="velocity" name="Velocity" stroke="var(--chart-1)" strokeWidth={2} />
                  <Line type="monotone" dataKey="delivered" name="Delivered" stroke="var(--chart-2)" strokeWidth={2} />
                </LineChart>
              </Chart>
            </Panel>

            <Panel title="Completion Rate">
              <Chart>
                <BarChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="completion" name="Completion %" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </Chart>
            </Panel>

            <Panel title="Scope Change Activity">
              <Chart>
                <BarChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="scope" name="Scope changes" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </Chart>
            </Panel>

            <Panel title="Workload per developer">
              <Chart>
                <LineChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line type="monotone" dataKey="workload" name="Issues / dev" stroke="var(--chart-5)" strokeWidth={2} />
                </LineChart>
              </Chart>
            </Panel>

            <Panel title="Blocked Issues">
              <Chart>
                <BarChart data={history} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="blocked" name="Blocked issues" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </Chart>
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Chart({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
