import type {
  MitigationAction,
  RiskFactor,
  RiskLevel,
  RiskResult,
  RiskThresholds,
  Sprint,
  SprintSnapshot,
} from "./types";

/**
 * Baseline Risk Engine — transparent, deterministic scoring.
 *
 * Every factor is normalised to 0..1 and multiplied by a fixed weight, so the
 * total is a 0..100 score. This module is the single seam where a real ML
 * prediction API can later replace the baseline: keep `computeRisk`'s signature
 * and swap the body.
 */

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  medium: 40,
  high: 60,
  critical: 80,
};

export const RISK_WEIGHTS = {
  progress: 18,
  scopeChurn: 26,
  blockers: 21,
  workload: 15,
  velocityStrain: 13,
  processInstability: 11,
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function riskLevel(score: number, t: RiskThresholds): RiskLevel {
  if (score >= t.critical) return "critical";
  if (score >= t.high) return "high";
  if (score >= t.medium) return "medium";
  return "low";
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function impactOf(share: number): RiskFactor["impact"] {
  if (share >= 0.6) return "high";
  if (share >= 0.3) return "medium";
  return "low";
}

export function getSnapshot(sprint: Sprint, day?: number): SprintSnapshot {
  const target = day ?? sprint.currentDay;
  const candidates = sprint.snapshots.filter((s) => s.day <= target);
  return candidates[candidates.length - 1] ?? sprint.snapshots[0];
}

export function computeRisk(
  sprint: Sprint,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS,
  day?: number,
): RiskResult {
  const snap = getSnapshot(sprint, day);
  const sprintDay = snap.day;
  const daysRemaining = Math.max(0, sprint.lengthDays - sprintDay);
  const elapsed = sprintDay / sprint.lengthDays;

  const progressRatio = snap.plannedPoints > 0 ? snap.completedPoints / snap.plannedPoints : 0;
  const expectedProgressRatio = elapsed;

  // 1. Progress vs expected pace, sharpened by historical daily velocity.
  const paceActual = snap.completedPoints / Math.max(1, sprintDay);
  const paceNeeded = (snap.plannedPoints - snap.completedPoints) / Math.max(1, daysRemaining || 1);
  const historicalPace = sprint.historicalVelocity / sprint.lengthDays;
  const paceDeficit = clamp01((paceNeeded - Math.min(paceActual, historicalPace * 1.15)) / Math.max(0.5, historicalPace));
  const progressGap = clamp01((expectedProgressRatio - progressRatio) / Math.max(0.15, expectedProgressRatio));
  const progress = clamp01(0.55 * progressGap + 0.45 * paceDeficit);

  // 2. Scope churn — work added, removed or re-pointed mid sprint.
  const churnEvents = snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges;
  const scopeChurn = clamp01(churnEvents / Math.max(6, snap.issuesTotal * 0.55));

  // 3. Blocked work.
  const blockers = clamp01(snap.blockedIssues / Math.max(2, snap.issuesTotal * 0.16));

  // 4. Workload per developer.
  const issuesPerDev = snap.issuesTotal / Math.max(1, snap.devCount);
  const workload = clamp01((issuesPerDev - 2.6) / 2.6);

  // 5. Planned load vs what the team historically delivers.
  const velocityStrain = clamp01(
    (snap.plannedPoints - sprint.historicalVelocity) / Math.max(4, sprint.historicalVelocity * 0.35),
  );

  // 6. Process instability — churn in status, assignees, sprint reassignments.
  const instabilityEvents = snap.statusChanges + snap.assigneeChanges + snap.reassignments * 2;
  const processInstability = clamp01(instabilityEvents / Math.max(10, snap.issuesTotal * 1.6));

  const raw: Array<{ key: keyof typeof RISK_WEIGHTS; value: number; label: string; detail: string }> = [
    {
      key: "progress",
      value: progress,
      label:
        progress > 0.35
          ? "Completion behind historical pace"
          : "Progress tracking close to plan",
      detail: `${Math.round(progressRatio * 100)}% complete on day ${sprintDay} of ${sprint.lengthDays} (expected ≈ ${Math.round(
        expectedProgressRatio * 100,
      )}%). Remaining pace needed: ${paceNeeded.toFixed(1)} pts/day vs historical ${historicalPace.toFixed(1)} pts/day.`,
    },
    {
      key: "scopeChurn",
      value: scopeChurn,
      label: "High scope-change activity",
      detail: `${snap.issuesAdded} issues added, ${snap.issuesRemoved} removed and ${snap.storyPointChanges} re-estimated after the sprint started.`,
    },
    {
      key: "blockers",
      value: blockers,
      label: "Blocked work accumulating",
      detail: `${snap.blockedIssues} of ${snap.issuesTotal} issues are currently blocked.`,
    },
    {
      key: "workload",
      value: workload,
      label: "High workload per developer",
      detail: `${issuesPerDev.toFixed(1)} open issues per developer across ${snap.devCount} developers.`,
    },
    {
      key: "velocityStrain",
      value: velocityStrain,
      label: "Planned load above historical velocity",
      detail: `${snap.plannedPoints} points committed against a historical velocity of ${sprint.historicalVelocity} points.`,
    },
    {
      key: "processInstability",
      value: processInstability,
      label: "Frequent status and ownership changes",
      detail: `${snap.statusChanges} status changes, ${snap.assigneeChanges} assignee changes and ${snap.reassignments} sprint reassignments recorded.`,
    },
  ];

  const urgency = 1 + 0.16 * elapsed;
  const timeRelief = daysRemaining > sprint.lengthDays * 0.6 ? 0.9 : 1;

  const factors: RiskFactor[] = raw
    .map((f) => {
      const maxContribution = RISK_WEIGHTS[f.key];
      const contribution = f.value * maxContribution * urgency * timeRelief;
      return {
        key: f.key,
        label: f.label,
        detail: f.detail,
        value: f.value,
        contribution: Math.round(contribution * 10) / 10,
        maxContribution,
        impact: impactOf(f.value),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);

  const score = Math.max(
    0,
    Math.min(100, Math.round(factors.reduce((sum, f) => sum + f.contribution, 0))),
  );
  const level = riskLevel(score, thresholds);

  const active = factors.filter((f) => f.value >= 0.25);
  const primarySignal = active[0]?.label ?? "No material risk signals detected";
  const secondarySignals = active.slice(1, 4).map((f) => f.label);

  const explanation = buildExplanation(sprint, level, active, progressRatio, expectedProgressRatio);

  return {
    score,
    level,
    // delayProbability is a reserved field for the ML stage.
    // It equals the risk score numerically until a trained classifier with
    // proper probability calibration (Platt scaling) is implemented.
    // It is NOT displayed as a percentage in the current UI.
    delayProbability: score,
    factors,
    primarySignal,
    secondarySignals,
    explanation,
    snapshot: snap,
    progressRatio,
    expectedProgressRatio,
    daysRemaining,
  };
}

function buildExplanation(
  sprint: Sprint,
  level: RiskLevel,
  active: RiskFactor[],
  progressRatio: number,
  expected: number,
): string {
  if (active.length === 0) {
    return `${sprint.name} is tracking healthily: progress is at ${Math.round(
      progressRatio * 100,
    )}% against an expected ${Math.round(expected * 100)}%, with no significant scope, blocker or workload signals.`;
  }
  const phrases = active.slice(0, 3).map((f) => EXPLANATION_PHRASE[f.key] ?? f.label.toLowerCase());
  const lead =
    level === "low"
      ? "Sprint risk is contained, though"
      : level === "medium"
        ? "Sprint risk is moderate because"
        : level === "high"
          ? "Sprint risk is elevated because"
          : "Sprint risk is critical because";
  const joined =
    phrases.length === 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(", ")} while ${phrases[phrases.length - 1]}`;
  return `${lead} ${joined}. Progress stands at ${Math.round(progressRatio * 100)}% against an expected ${Math.round(
    expected * 100,
  )}% for this point in the sprint.`;
}

const EXPLANATION_PHRASE: Record<string, string> = {
  progress: "completion is behind the team's historical pace",
  scopeChurn: "scope-change activity is high",
  blockers: "several issues remain blocked",
  workload: "workload per developer is high",
  velocityStrain: "the committed load exceeds historical velocity",
  processInstability: "status and ownership churn is high",
};

export interface FactorTemplate {
  title: string;
  reason: string;
  action: string;
}

export const MITIGATION_TEMPLATES: Record<string, FactorTemplate> = {
  progress: {
    title: "Review Sprint Scope",
    reason: "Current progress is below the pace needed to finish committed work.",
    action: "Re-negotiate the sprint scope with the product owner and move lower-value items out.",
  },
  scopeChurn: {
    title: "Review Scope Changes",
    reason: "Additional work added mid-sprint is increasing sprint instability.",
    action: "Freeze new scope for the remainder of the sprint and triage additions into the backlog.",
  },
  blockers: {
    title: "Investigate Blocked Work",
    reason: "Several issues are currently blocked and are not progressing.",
    action: "Run a focused blocker review and assign an owner with an escalation path to each blocker.",
  },
  workload: {
    title: "Redistribute Workload",
    reason: "Open work is concentrated on too few developers.",
    action: "Rebalance in-progress issues so no developer carries more than three active items.",
  },
  velocityStrain: {
    title: "Recalibrate Commitment",
    reason: "The committed story points exceed what the team historically delivers.",
    action: "Align the next commitment with the rolling three-sprint velocity average.",
  },
  processInstability: {
    title: "Stabilise Sprint Process",
    reason: "Frequent status, assignee and sprint changes are fragmenting focus.",
    action: "Limit work in progress and review the board once daily instead of reshuffling items.",
  },
};

export function deriveMitigations(sprint: Sprint, risk: RiskResult): MitigationAction[] {
  return risk.factors
    .filter((f) => f.value >= 0.3)
    .map((f) => {
      const tpl = MITIGATION_TEMPLATES[f.key];
      return {
        id: `${sprint.id}-${f.key}`,
        sprintId: sprint.id,
        factorKey: f.key,
        title: tpl.title,
        reason: tpl.reason,
        action: tpl.action,
        priority: f.impact,
        status: "not_started" as const,
      };
    });
}

export function riskSeries(sprint: Sprint, thresholds: RiskThresholds) {
  return sprint.snapshots
    .filter((s) => s.day <= sprint.currentDay)
    .map((s) => {
      const r = computeRisk(sprint, thresholds, s.day);
      return {
        day: s.day,
        score: r.score,
        level: r.level,
        progress: Math.round(r.progressRatio * 100),
        /** Expected progress at this day (0-100) for the "expected" reference line. */
        expectedProgress: Math.round(r.expectedProgressRatio * 100),
        scopeChanges: s.issuesAdded + s.issuesRemoved + s.storyPointChanges,
        blocked: s.blockedIssues,
        completedPoints: s.completedPoints,
        plannedPoints: s.plannedPoints,
        /** Top signal at this snapshot for timeline annotation. */
        primarySignal: r.primarySignal,
      };
    });
}
