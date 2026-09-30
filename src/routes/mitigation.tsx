import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { MitigationCard } from "@/components/mitigation-card";
import { PageHeader, Panel } from "@/components/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { MitigationStatus } from "@/lib/types";

export const Route = createFileRoute("/mitigation")({
  head: () => ({
    meta: [
      { title: "Mitigation Center — SprintShield" },
      {
        name: "description",
        content:
          "Turn detected sprint risk factors into prioritised corrective actions and track them from not started to completed.",
      },
      { property: "og:title", content: "Mitigation Center — SprintShield" },
      {
        property: "og:description",
        content: "Prioritised, trackable mitigation actions generated from live sprint risk factors.",
      },
    ],
  }),
  component: MitigationPage,
});

const STATUSES: Array<{ value: MitigationStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "dismissed", label: "Dismissed" },
];

function MitigationPage() {
  const { selectedSprint, selectedProject, mitigations, setMitigationStatus, risk } = useStore();
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () => mitigations.filter((m) => status === "all" || m.status === status),
    [mitigations, status],
  );

  const counts = useMemo(() => {
    return {
      open: mitigations.filter((m) => m.status === "not_started").length,
      active: mitigations.filter((m) => m.status === "in_progress").length,
      done: mitigations.filter((m) => m.status === "completed").length,
    };
  }, [mitigations]);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${selectedProject?.name ?? ""} · ${selectedSprint?.name ?? ""}`}
        title="Mitigation Center"
        subtitle="Recommended actions generated from the risk factors currently detected in this sprint."
        action={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Not started" value={counts.open} />
        <Summary label="In progress" value={counts.active} />
        <Summary label="Completed" value={counts.done} />
      </div>

      <Panel
        title="Recommended actions"
        description={
          risk
            ? `Current sprint risk: ${risk.score}% (${risk.level}). Actions are triggered by factors above the action threshold.`
            : undefined
        }
      >
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {mitigations.length === 0
              ? "No mitigation actions yet — this sprint has no risk factor above the action threshold."
              : "No actions match this status filter."}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((m) => (
              <MitigationCard
                key={m.id}
                action={m}
                sprintName={selectedSprint?.name}
                onStatusChange={setMitigationStatus}
              />
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface rounded-xl p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
