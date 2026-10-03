import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RISK_LEVEL_LABEL } from "@/lib/risk-engine";
import type { RiskLevel, RiskThresholds } from "@/lib/types";

export interface TrendPoint {
  day: number;
  score: number;
  level: RiskLevel;
  progress: number;
  expectedProgress: number;
  scopeChanges: number;
  blocked: number;
  completedPoints: number;
  plannedPoints: number;
  primarySignal: string;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="surface rounded-lg px-3 py-2.5 text-xs shadow-lg">
      <div className="font-display text-sm font-semibold">Day {p.day}</div>
      <dl className="mt-2 space-y-1">
        <Row label="Risk score" value={`${p.score} / 100 · ${RISK_LEVEL_LABEL[p.level]}`} />
        <Row label="Progress" value={`${p.progress}% (expected ${p.expectedProgress}%)`} />
        <Row label="Scope changes" value={String(p.scopeChanges)} />
        <Row label="Blocked issues" value={String(p.blocked)} />
        <Row label="Top signal" value={p.primarySignal.length > 36 ? p.primarySignal.slice(0, 36) + "…" : p.primarySignal} />
      </dl>
      <div className="mt-2 text-[10px] text-muted-foreground">Click for the full snapshot</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function RiskTrendChart({
  data,
  thresholds,
  onSelectDay,
  selectedDay,
  height = 300,
}: {
  data: TrendPoint[];
  thresholds: RiskThresholds;
  onSelectDay?: (day: number) => void;
  /** Highlight a specific day on the chart (matches snapshotDay). */
  selectedDay?: number | null;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No sprint data available.
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          onClick={(state: { activeTooltipIndex?: number | string | null; activeLabel?: number | string }) => {
            if (!onSelectDay) return;
            const idx = Number(state?.activeTooltipIndex);
            if (Number.isFinite(idx) && data[idx]) return onSelectDay(data[idx].day);
            const label = Number(state?.activeLabel);
            if (Number.isFinite(label)) onSelectDay(label);
          }}
        >
          <defs>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--risk-high)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--risk-high)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            tickFormatter={(d: number) => `D${d}`}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--color-border)" }} />

          {/* Threshold reference lines */}
          <ReferenceLine y={thresholds.medium} stroke="var(--risk-medium)" strokeDasharray="4 4" strokeOpacity={0.45} label={{ value: "Med", fill: "var(--risk-medium)", fontSize: 9, position: "right" }} />
          <ReferenceLine y={thresholds.high} stroke="var(--risk-high)" strokeDasharray="4 4" strokeOpacity={0.45} label={{ value: "High", fill: "var(--risk-high)", fontSize: 9, position: "right" }} />
          <ReferenceLine y={thresholds.critical} stroke="var(--risk-critical)" strokeDasharray="4 4" strokeOpacity={0.45} label={{ value: "Crit", fill: "var(--risk-critical)", fontSize: 9, position: "right" }} />

          {/* Highlight selected snapshot day */}
          {selectedDay != null && (
            <ReferenceLine
              x={selectedDay}
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeDasharray="6 3"
              strokeOpacity={0.8}
            />
          )}

          {/* Expected progress reference (dashed, secondary) */}
          <Area
            type="monotone"
            dataKey="expectedProgress"
            stroke="var(--chart-2)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            strokeOpacity={0.5}
            fill="url(#progressFill)"
            dot={false}
            activeDot={false}
            animationDuration={700}
            name="Expected progress"
          />

          {/* Risk score — primary line */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--risk-high)"
            strokeWidth={2.5}
            fill="url(#riskFill)"
            dot={{ r: 3, fill: "var(--color-background)", stroke: "var(--risk-high)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--risk-high)", cursor: "pointer" }}
            animationDuration={900}
            name="Risk score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
