import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  if (day === null) return null;
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
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
          <div className="eyebrow mb-2">Top contributing factors</div>
          <ul className="space-y-2">
            {risk.factors.slice(0, 3).map((f) => (
              <li key={f.key} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-muted-foreground">+{f.contribution} pts</span>
                </div>
                {/* Bar width = normalised signal strength (0..1), not contribution/max which is misleading */}
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(f.value * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
