import { Link } from "@tanstack/react-router";
import { BarChart3, Pencil, Trash2, Users } from "lucide-react";

import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  const { sprints, riskFor, selectProject } = useStore();
  const projectSprints = sprints.filter((s) => s.projectId === project.id);
  const active = projectSprints.find((s) => s.status === "active");
  const risk = active ? riskFor(active) : undefined;
  const velocity = projectSprints.length
    ? Math.round(
        projectSprints.reduce((sum, s) => sum + s.historicalVelocity, 0) / projectSprints.length,
      )
    : 0;

  return (
    <article className="surface flex flex-col rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{project.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> {project.team} · {project.members} members
          </p>
        </div>
        {risk && <RiskBadge level={risk.level} score={risk.score} />}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{project.description}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border bg-background/40 p-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Active sprint</dt>
          <dd className="mt-1 text-sm font-medium">{active?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums">
            {risk ? `${Math.round(risk.progressRatio * 100)}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Velocity</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums">{velocity}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" onClick={() => selectProject(project.id)}>
          <Link to="/dashboard">Open project</Link>
        </Button>
        <Button asChild size="sm" variant="secondary" onClick={() => selectProject(project.id)}>
          <Link to="/analytics">
            <BarChart3 className="size-3.5" /> View analytics
          </Link>
        </Button>
        <div className="ml-auto flex gap-1">
          <Button size="icon" variant="ghost" aria-label="Edit project" onClick={() => onEdit(project)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Delete project" onClick={() => onDelete(project)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
