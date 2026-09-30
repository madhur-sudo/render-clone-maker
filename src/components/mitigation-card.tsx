import { CircleCheck, CircleSlash, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IMPACT_BG } from "@/lib/risk-ui";
import { cn } from "@/lib/utils";
import type { MitigationAction, MitigationStatus } from "@/lib/types";

const STATUS_LABEL: Record<MitigationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  dismissed: "Dismissed",
};

const STATUS_STYLE: Record<MitigationStatus, string> = {
  not_started: "border-border bg-muted text-muted-foreground",
  in_progress: "border-primary/35 bg-primary/12 text-primary",
  completed: "border-risk-low/30 bg-risk-low/12 text-risk-low",
  dismissed: "border-border bg-muted text-muted-foreground line-through",
};

export function MitigationCard({
  action,
  sprintName,
  onStatusChange,
}: {
  action: MitigationAction;
  sprintName?: string;
  onStatusChange: (id: string, status: MitigationStatus) => void;
}) {
  const update = (status: MitigationStatus) => {
    onStatusChange(action.id, status);
    toast.success(`${action.title} — ${STATUS_LABEL[status]}`, {
      description: sprintName ? `Updated for ${sprintName}.` : undefined,
    });
  };

  return (
    <article className="surface rounded-xl p-4 transition-colors hover:border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-semibold">{action.title}</h3>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              IMPACT_BG[action.priority],
            )}
          >
            {action.priority} priority
          </span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            STATUS_STYLE[action.status],
          )}
        >
          {STATUS_LABEL[action.status]}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{action.reason}</p>
      <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
        <div className="eyebrow">Recommended action</div>
        <p className="mt-1 text-sm">{action.action}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={action.status === "in_progress"}
          onClick={() => update("in_progress")}
        >
          <Play className="size-3.5" /> Start
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={action.status === "completed"}
          onClick={() => update("completed")}
        >
          <CircleCheck className="size-3.5" /> Complete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={action.status === "dismissed"}
          onClick={() => update("dismissed")}
        >
          <CircleSlash className="size-3.5" /> Dismiss
        </Button>
      </div>
    </article>
  );
}
