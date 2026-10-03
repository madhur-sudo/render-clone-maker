import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContributingFactors } from "@/components/contributing-factors";
import { RiskBadge } from "@/components/risk-badge";
import { computeRisk } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";
import type { Sprint } from "@/lib/types";

export function SnapshotModal({
  sprint,
  day,
  open,
  onOpenChange,
}: {
  sprint: Sprint;
  day: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { thresholds } = useStore();
  if (day === null || !open) return null;
  const risk = computeRisk(sprint, thresholds, day);
  const s = risk.snapshot;

  const rows: Array<[string, string]> = [
    ["Completed / planned", `${s.completedPoints} / ${s.plannedPoints} story points`],
    [
      "Progress",
      `${Math.round(risk.progressRatio * 100)}% (expected ${Math.round(risk.expectedProgressRatio * 100)}%)`,
    ],
    ["Issues in sprint", String(s.issuesTotal)],
    ["Issues added", String(s.issuesAdded)],
    ["Issues removed", String(s.issuesRemoved)],
    ["Story-point changes", String(s.storyPointChanges)],
    ["Blocked issues", String(s.blockedIssues)],
    ["Status changes", String(s.statusChanges)],
    ["Assignee changes", String(s.assigneeChanges)],
    ["Sprint reassignments", String(s.reassignments)],
    ["Developers", String(s.devCount)],
    ["Days remaining", String(risk.daysRemaining)],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {sprint.name} — Day {s.day} snapshot
            <RiskBadge level={risk.level} score={risk.score} />
          </DialogTitle>
          <DialogDescription>
            Risk computed using only the metrics available up to Day {s.day} of {sprint.lengthDays}.
            Post-snapshot data is withheld.
          </DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border rounded-lg border border-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="eyebrow mb-3">Top contributing factors</div>
          <ContributingFactors factors={risk.factors} showDetail={false} />
        </div>

        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Engine:</strong> Baseline Risk Engine (deterministic) ·{" "}
          <strong className="text-foreground">Source:</strong> Demo workspace snapshot
        </p>
      </DialogContent>
    </Dialog>
  );
}
