import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { useStore } from "@/lib/store";
import type { Sprint } from "@/lib/types";

function metricsFor(sprint: Sprint) {
  const snap = sprint.snapshots[sprint.snapshots.length - 1];
  const churn = snap ? snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges : 0;
  const scopePct = snap ? Math.min(100, Math.round((churn / Math.max(6, snap.issuesTotal * 0.55)) * 100)) : 0;
  return { snap, scopePct };
}

export function SprintTable({ sprints }: { sprints: Sprint[] }) {
  const { riskFor, projects } = useStore();

  if (sprints.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
        No sprints match the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Sprint", "Status", "Risk", "Progress", "Velocity", "Scope change", "Days left", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprints.map((sprint) => {
              const risk = riskFor(sprint);
              const { scopePct } = metricsFor(sprint);
              const project = projects.find((p) => p.id === sprint.projectId);
              return (
                <tr key={sprint.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link to="/sprints/$sprintId" params={{ sprintId: sprint.id }} className="block">
                      <div className="font-medium">{sprint.name}</div>
                      <div className="text-xs text-muted-foreground">{project?.name}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sprint.status} /></td>
                  <td className="px-4 py-3"><RiskBadge level={risk.level} score={risk.score} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(risk.progressRatio * 100)}%` }} />
                      </div>
                      <span className="tabular-nums text-xs">{Math.round(risk.progressRatio * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{sprint.historicalVelocity}</td>
                  <td className="px-4 py-3 tabular-nums">{scopePct}%</td>
                  <td className="px-4 py-3 tabular-nums">{risk.daysRemaining}</td>
                  <td className="px-4 py-3">
                    <Link to="/sprints/$sprintId" params={{ sprintId: sprint.id }} aria-label={`Open ${sprint.name}`}>
                      <ChevronRight className="size-4 text-muted-foreground transition-colors hover:text-primary" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {sprints.map((sprint) => {
          const risk = riskFor(sprint);
          const { scopePct } = metricsFor(sprint);
          return (
            <Link
              key={sprint.id}
              to="/sprints/$sprintId"
              params={{ sprintId: sprint.id }}
              className="block rounded-lg border border-border bg-background/40 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-medium">{sprint.name}</span>
                <RiskBadge level={risk.level} score={risk.score} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Progress {Math.round(risk.progressRatio * 100)}%</span>
                <span>Velocity {sprint.historicalVelocity}</span>
                <span>Scope {scopePct}%</span>
                <span>{risk.daysRemaining} days left</span>
              </div>
              <div className="mt-2"><StatusBadge status={sprint.status} /></div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
