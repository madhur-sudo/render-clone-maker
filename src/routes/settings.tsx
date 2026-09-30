import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_THRESHOLDS, riskLevel } from "@/lib/risk-engine";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SprintShield" },
      {
        name: "description",
        content:
          "Configure the workspace, risk thresholds that drive every risk label, notification triggers and appearance.",
      },
      { property: "og:title", content: "Settings — SprintShield" },
      {
        property: "og:description",
        content: "Tune the risk thresholds used across every SprintShield dashboard.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { thresholds, setThresholds, risk, selectedSprint } = useStore();
  const [workspace, setWorkspace] = useState("Demo Workspace");
  const [alerts, setAlerts] = useState({ riskChange: true, scope: true, blockers: true, digest: false });
  const [density, setDensity] = useState(true);

  const update = (key: "medium" | "high" | "critical", value: number) => {
    const next = { ...thresholds, [key]: value };
    if (next.medium < next.high && next.high < next.critical) {
      setThresholds(next);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Risk thresholds set here are applied to every score, badge and chart in the application."
      />

      <Panel title="Workspace">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ws">Workspace name</Label>
            <Input id="ws" value={workspace} onChange={(e) => setWorkspace(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="engine">Prediction engine</Label>
            <Input id="engine" value="Baseline Risk Engine (deterministic)" readOnly className="mt-1.5" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              A machine-learning model can replace this engine without changing the dashboards.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Risk Thresholds"
        description="Score boundaries used to convert a 0–100 risk score into a risk level."
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setThresholds(DEFAULT_THRESHOLDS);
              toast.success("Risk thresholds reset to defaults.");
            }}
          >
            Reset to defaults
          </Button>
        }
      >
        <div className="space-y-6">
          <ThresholdRow
            label="Medium starts at"
            value={thresholds.medium}
            min={10}
            max={thresholds.high - 1}
            onChange={(v) => update("medium", v)}
          />
          <ThresholdRow
            label="High starts at"
            value={thresholds.high}
            min={thresholds.medium + 1}
            max={thresholds.critical - 1}
            onChange={(v) => update("high", v)}
          />
          <ThresholdRow
            label="Critical starts at"
            value={thresholds.critical}
            min={thresholds.high + 1}
            max={99}
            onChange={(v) => update("critical", v)}
          />

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="eyebrow">Current bands</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <RiskBadge level="low" />
              <span className="text-xs text-muted-foreground">0–{thresholds.medium - 1}</span>
              <RiskBadge level="medium" />
              <span className="text-xs text-muted-foreground">
                {thresholds.medium}–{thresholds.high - 1}
              </span>
              <RiskBadge level="high" />
              <span className="text-xs text-muted-foreground">
                {thresholds.high}–{thresholds.critical - 1}
              </span>
              <RiskBadge level="critical" />
              <span className="text-xs text-muted-foreground">{thresholds.critical}–100</span>
            </div>
            {risk && selectedSprint && (
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedSprint.name} scores {risk.score}, which is currently labelled{" "}
                <strong className="text-foreground">{riskLevel(risk.score, thresholds)}</strong>.
              </p>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Notifications" description="Which changes raise a notification in the workspace.">
        <div className="space-y-3">
          {([
            ["riskChange", "Risk level changes for the active sprint"],
            ["scope", "Scope-change activity increases"],
            ["blockers", "Issues become blocked"],
            ["digest", "Daily sprint digest"],
          ] as Array<[string, string]>).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5 text-sm">
              {label}
              <Switch
                checked={alerts[key as keyof typeof alerts]}
                onCheckedChange={(v) => {
                  setAlerts({ ...alerts, [key]: v });
                  toast.success(`${label} ${v ? "enabled" : "disabled"}.`);
                }}
              />
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Appearance" description="SprintShield uses a single dark analytics theme.">
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5 text-sm">
          Compact metric density
          <Switch checked={density} onCheckedChange={setDensity} />
        </label>
      </Panel>
    </AppShell>
  );
}

function ThresholdRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-display text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <Slider
        className="mt-3"
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
