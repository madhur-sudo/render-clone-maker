export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SprintStatus = "active" | "completed" | "planned";

export interface SprintSnapshot {
  day: number;
  completedPoints: number;
  plannedPoints: number;
  issuesTotal: number;
  issuesAdded: number;
  issuesRemoved: number;
  blockedIssues: number;
  statusChanges: number;
  assigneeChanges: number;
  storyPointChanges: number;
  reassignments: number;
  devCount: number;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: SprintStatus;
  lengthDays: number;
  currentDay: number;
  plannedPoints: number;
  historicalVelocity: number;
  snapshots: SprintSnapshot[];
  events: SprintEvent[];
  issues: SprintIssue[];
}

export interface SprintEvent {
  day: number;
  type: "scope" | "blocker" | "progress" | "process";
  title: string;
  detail: string;
}

export interface SprintIssue {
  key: string;
  title: string;
  points: number;
  status: "todo" | "in_progress" | "blocked" | "done";
  assignee: string;
}

export interface Project {
  id: string;
  name: string;
  team: string;
  description: string;
  members: number;
}

export interface RiskThresholds {
  medium: number;
  high: number;
  critical: number;
}

export interface RiskFactor {
  key: string;
  label: string;
  detail: string;
  /** normalised 0..1 severity of this signal */
  value: number;
  /** points this factor adds to the risk score */
  contribution: number;
  maxContribution: number;
  impact: "low" | "medium" | "high";
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  delayProbability: number;
  factors: RiskFactor[];
  primarySignal: string;
  secondarySignals: string[];
  explanation: string;
  snapshot: SprintSnapshot;
  progressRatio: number;
  expectedProgressRatio: number;
  daysRemaining: number;
}

export type MitigationStatus = "not_started" | "in_progress" | "completed" | "dismissed";

export interface MitigationAction {
  id: string;
  sprintId: string;
  factorKey: string;
  title: string;
  reason: string;
  action: string;
  priority: "low" | "medium" | "high";
  status: MitigationStatus;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  level: RiskLevel | "info";
  read: boolean;
  sprintId?: string;
}
