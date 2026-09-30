import type { RiskLevel } from "./types";

export const RISK_TEXT: Record<RiskLevel, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
  critical: "text-risk-critical",
};

export const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-risk-low/12 border-risk-low/30 text-risk-low",
  medium: "bg-risk-medium/12 border-risk-medium/30 text-risk-medium",
  high: "bg-risk-high/12 border-risk-high/30 text-risk-high",
  critical: "bg-risk-critical/15 border-risk-critical/35 text-risk-critical",
};

export const RISK_FILL: Record<RiskLevel, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export const RISK_VAR: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};

export const IMPACT_BG: Record<"low" | "medium" | "high", string> = {
  low: "bg-risk-low/12 border-risk-low/30 text-risk-low",
  medium: "bg-risk-medium/12 border-risk-medium/30 text-risk-medium",
  high: "bg-risk-high/12 border-risk-high/30 text-risk-high",
};
