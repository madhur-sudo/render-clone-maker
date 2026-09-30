import { useEffect, useState } from "react";

import { RISK_VAR } from "@/lib/risk-ui";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

export function RiskGauge({
  score,
  level,
  size = 200,
  label = "Delay probability",
}: {
  score: number;
  level: RiskLevel;
  size?: number;
  label?: string;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const stroke = size * 0.075;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated / 100);
  const color = RISK_VAR[level];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.4s ease",
            filter: `drop-shadow(0 0 ${size * 0.05}px color-mix(in oklab, ${color} 55%, transparent))`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-display font-semibold tabular-nums")}
          style={{ fontSize: size * 0.26, color }}
        >
          {Math.round(animated)}%
        </span>
        <span className="mt-1 max-w-[70%] text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
