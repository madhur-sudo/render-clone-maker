import {
  Area,
  AreaChart,
  CartesianGrid,
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
  scopeChanges: number;
  blocked: number;
  completedPoints: number;
  plannedPoints: number;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="surface rounded-lg px-3 py-2.5 text-xs">
      <div className="font-display text-sm font-semibold">Sprint day {p.day}</div>
      <dl className="mt-2 space-y-1">
        <Row label="Risk probability" value={`${p.score}% · ${RISK_LEVEL_LABEL[p.level]}`} />
        <Row label="Progress" value={`${p.progress}% (${p.completedPoints}/${p.plannedPoints} pts)`} />
        <Row label="Scope changes" value={String(p.scopeChanges)} />
        <Row label="Blocked issues" value={String(p.blocked)} />
      </dl>
      <div className="mt-2 text-[10px] text-muted-foreground">Click for the full snapshot</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function RiskTrendChart({
  data,
  thresholds,
  onSelectDay,
  height = 300,
}: {
  data: TrendPoint[];
  thresholds: RiskThresholds;
  onSelectDay?: (day: number) => void;
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
          onClick={(state: { activeTooltipIndex?: number }) => {
            const idx = state?.activeTooltipIndex;
            if (onSelectDay && typeof idx === "number" && data[idx]) onSelectDay(data[idx].day);
          }}
        >
          <defs>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--risk-high)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--risk-high)" stopOpacity={0.02} />
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
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--color-border)" }} />
          <ReferenceLine y={thresholds.medium} stroke="var(--risk-medium)" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={thresholds.high} stroke="var(--risk-high)" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={thresholds.critical} stroke="var(--risk-critical)" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--risk-high)"
            strokeWidth={2.5}
            fill="url(#riskFill)"
            dot={{ r: 3, fill: "var(--color-background)", stroke: "var(--risk-high)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--risk-high)", cursor: "pointer" }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
