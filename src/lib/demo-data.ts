import type { Project, Sprint, SprintEvent, SprintIssue, SprintSnapshot } from "./types";

/** Deterministic PRNG so demo data is identical on server and client. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_PROJECTS: Project[] = [
  {
    id: "atlas",
    name: "Project Atlas",
    team: "Platform Team",
    description: "Core billing and identity platform serving all internal products.",
    members: 6,
  },
  {
    id: "nimbus",
    name: "Project Nimbus",
    team: "Cloud Infrastructure",
    description: "Multi-region deployment tooling and observability pipeline.",
    members: 5,
  },
  {
    id: "harbor",
    name: "Project Harbor",
    team: "Customer Experience",
    description: "Customer portal, onboarding flows and self-service support.",
    members: 7,
  },
];

const NAMES = [
  "M. Thepale",
  "K. Raj",
  "V. Melaka",
  "P. Choudhary",
  "S. Khadabadi",
  "A. Singhania",
  "R. Iyer",
];

const ISSUE_TITLES = [
  "Refactor invoice aggregation job",
  "Add retry policy to payment webhook",
  "Migrate auth tokens to rotating keys",
  "Fix timezone drift in sprint reports",
  "Instrument checkout latency traces",
  "Split billing service read model",
  "Harden rate limiter for public API",
  "Backfill customer plan history",
  "Replace legacy cron scheduler",
  "Improve failed-payment recovery flow",
  "Reduce cold start on report worker",
  "Add audit log for role changes",
  "Upgrade queue client to v4",
  "Cache entitlement lookups",
  "Repair flaky integration suite",
  "Document incident runbook",
];

function makeIssues(rand: () => number, count: number, blocked: number, doneRatio: number): SprintIssue[] {
  const issues: SprintIssue[] = [];
  for (let i = 0; i < count; i++) {
    const isBlocked = i < blocked;
    const isDone = !isBlocked && i / count < doneRatio;
    issues.push({
      key: `ATL-${100 + i * 3 + Math.floor(rand() * 3)}`,
      title: ISSUE_TITLES[i % ISSUE_TITLES.length],
      points: [1, 2, 3, 5, 8][Math.floor(rand() * 5)],
      status: isBlocked ? "blocked" : isDone ? "done" : rand() > 0.45 ? "in_progress" : "todo",
      assignee: NAMES[Math.floor(rand() * NAMES.length)],
    });
  }
  return issues;
}

/** Sprint 42 — the flagship demo sprint: active, day 8 of 14, high risk. */
function sprint42(): Sprint {
  const snapshots: SprintSnapshot[] = [
    { day: 1, completedPoints: 1, plannedPoints: 34, issuesTotal: 19, issuesAdded: 0, issuesRemoved: 0, storyPointChanges: 0, blockedIssues: 0, statusChanges: 3, assigneeChanges: 0, reassignments: 0, devCount: 5 },
    { day: 2, completedPoints: 4, plannedPoints: 34, issuesTotal: 19, issuesAdded: 0, issuesRemoved: 0, storyPointChanges: 1, blockedIssues: 0, statusChanges: 6, assigneeChanges: 1, reassignments: 0, devCount: 5 },
    { day: 3, completedPoints: 8, plannedPoints: 35, issuesTotal: 20, issuesAdded: 1, issuesRemoved: 0, storyPointChanges: 1, blockedIssues: 1, statusChanges: 9, assigneeChanges: 1, reassignments: 0, devCount: 5 },
    { day: 4, completedPoints: 12, plannedPoints: 36, issuesTotal: 21, issuesAdded: 2, issuesRemoved: 1, storyPointChanges: 2, blockedIssues: 1, statusChanges: 12, assigneeChanges: 2, reassignments: 0, devCount: 5 },
    { day: 5, completedPoints: 16, plannedPoints: 37, issuesTotal: 22, issuesAdded: 3, issuesRemoved: 1, storyPointChanges: 2, blockedIssues: 2, statusChanges: 14, assigneeChanges: 4, reassignments: 1, devCount: 5 },
    { day: 6, completedPoints: 20, plannedPoints: 38, issuesTotal: 23, issuesAdded: 4, issuesRemoved: 1, storyPointChanges: 3, blockedIssues: 3, statusChanges: 16, assigneeChanges: 5, reassignments: 1, devCount: 5 },
    { day: 7, completedPoints: 24, plannedPoints: 39, issuesTotal: 24, issuesAdded: 5, issuesRemoved: 2, storyPointChanges: 3, blockedIssues: 3, statusChanges: 18, assigneeChanges: 7, reassignments: 2, devCount: 5 },
    { day: 8, completedPoints: 28, plannedPoints: 40, issuesTotal: 24, issuesAdded: 5, issuesRemoved: 2, storyPointChanges: 4, blockedIssues: 4, statusChanges: 20, assigneeChanges: 8, reassignments: 2, devCount: 5 },
  ];

  const events: SprintEvent[] = [
    { day: 1, type: "progress", title: "Sprint 42 started", detail: "34 story points committed across 19 issues." },
    { day: 3, type: "scope", title: "Issue added mid-sprint", detail: "ATL-118 added at stakeholder request (+3 points)." },
    { day: 3, type: "blocker", title: "First blocker raised", detail: "ATL-104 blocked waiting on payment provider sandbox." },
    { day: 5, type: "scope", title: "Scope grew again", detail: "Two issues added and one re-estimated upward." },
    { day: 5, type: "process", title: "Sprint reassignment", detail: "ATL-121 pulled in from Sprint 41 carry-over." },
    { day: 6, type: "blocker", title: "Blocked work rising", detail: "3 issues blocked on external dependencies." },
    { day: 7, type: "process", title: "Ownership churn", detail: "7 assignee changes recorded in the first week." },
    { day: 8, type: "blocker", title: "Risk crossed High", detail: "4 issues blocked while committed load reached 40 points." },
  ];

  const rand = mulberry32(42);
  return {
    id: "atlas-42",
    projectId: "atlas",
    name: "Sprint 42",
    goal: "Ship rotating auth keys and stabilise the billing read model.",
    status: "active",
    lengthDays: 14,
    currentDay: 8,
    plannedPoints: 40,
    historicalVelocity: 34,
    snapshots,
    events,
    issues: makeIssues(rand, 24, 4, 0.58),
  };
}

interface SprintSeed {
  name: string;
  status: "active" | "completed";
  length: number;
  currentDay: number;
  planned: number;
  velocity: number;
  severity: number; // 0 = healthy, 1 = severe
  goal: string;
}

function buildSprint(projectId: string, index: number, seed: SprintSeed): Sprint {
  const rand = mulberry32(index * 977 + projectId.length * 31);
  const snapshots: SprintSnapshot[] = [];
  const issuesBase = Math.round(seed.planned * 0.6);
  const devCount = 5 + Math.round(rand() * 2);

  for (let day = 1; day <= seed.currentDay; day++) {
    const t = day / seed.length;
    const deliveryRate = 1 - seed.severity * 0.45;
    const completed = Math.min(
      seed.planned,
      Math.round(seed.planned * t * deliveryRate * (0.9 + rand() * 0.2)),
    );
    const churnPace = seed.severity * 0.9;
    snapshots.push({
      day,
      completedPoints: completed,
      plannedPoints: Math.round(seed.planned * (1 + churnPace * 0.12 * t)),
      issuesTotal: issuesBase + Math.round(churnPace * 6 * t),
      issuesAdded: Math.round(churnPace * 6 * t),
      issuesRemoved: Math.round(churnPace * 2 * t),
      storyPointChanges: Math.round(churnPace * 5 * t),
      blockedIssues: Math.round(seed.severity * 5 * t + (rand() > 0.7 ? 1 : 0)),
      statusChanges: Math.round((6 + seed.severity * 18) * t * day * 0.5),
      assigneeChanges: Math.round(seed.severity * 10 * t),
      reassignments: Math.round(seed.severity * 3 * t),
      devCount,
    });
  }

  const events: SprintEvent[] = [
    { day: 1, type: "progress", title: `${seed.name} started`, detail: `${seed.planned} story points committed.` },
    ...(seed.severity > 0.4
      ? [
          {
            day: 4,
            type: "scope" as const,
            title: "Scope added mid-sprint",
            detail: "New issues pulled in after sprint planning.",
          },
          {
            day: 6,
            type: "blocker" as const,
            title: "Blockers raised",
            detail: "Issues blocked on external dependencies.",
          },
        ]
      : []),
    ...(seed.status === "completed"
      ? [
          {
            day: seed.length,
            type: "progress" as const,
            title: `${seed.name} closed`,
            detail: `Delivered ${snapshots[snapshots.length - 1]?.completedPoints ?? 0} of ${seed.planned} points.`,
          },
        ]
      : []),
  ];

  const last = snapshots[snapshots.length - 1];
  return {
    id: `${projectId}-${seed.name.toLowerCase().replace(/\s+/g, "-")}`,
    projectId,
    name: seed.name,
    goal: seed.goal,
    status: seed.status,
    lengthDays: seed.length,
    currentDay: seed.currentDay,
    plannedPoints: last?.plannedPoints ?? seed.planned,
    historicalVelocity: seed.velocity,
    snapshots,
    events,
    issues: makeIssues(rand, last?.issuesTotal ?? 12, last?.blockedIssues ?? 0, seed.status === "completed" ? 0.95 : 0.5),
  };
}

const GOALS = [
  "Reduce checkout latency below 400ms.",
  "Complete the queue client upgrade.",
  "Close out the audit logging epic.",
  "Stabilise the nightly reporting pipeline.",
  "Ship self-service plan changes.",
  "Finish multi-region failover drills.",
  "Clear the accessibility backlog.",
];

function seedsFor(projectId: string): SprintSeed[] {
  const severities: Record<string, number[]> = {
    atlas: [0.15, 0.3, 0.55, 0.2, 0.7, 0.35, 0.45],
    nimbus: [0.2, 0.45, 0.8, 0.3, 0.15, 0.6, 0.35],
    harbor: [0.3, 0.1, 0.5, 0.65, 0.25, 0.4, 0.55],
  };
  const startNumbers: Record<string, number> = { atlas: 35, nimbus: 12, harbor: 21 };
  const start = startNumbers[projectId] ?? 10;
  return severities[projectId].map((severity, i) => ({
    name: `Sprint ${start + i}`,
    status: "completed" as const,
    length: 14,
    currentDay: 14,
    planned: 30 + Math.round(severity * 14),
    velocity: 30 + ((i * 3) % 7),
    severity,
    goal: GOALS[i % GOALS.length],
  }));
}

export function createDemoSprints(): Sprint[] {
  const sprints: Sprint[] = [];

  // Project Atlas: 7 completed sprints + the active Sprint 42.
  seedsFor("atlas").forEach((s, i) => sprints.push(buildSprint("atlas", i, s)));
  sprints.push(sprint42());

  // Nimbus: 7 completed + 1 active medium-risk sprint.
  seedsFor("nimbus").forEach((s, i) => sprints.push(buildSprint("nimbus", i + 10, s)));
  sprints.push(
    buildSprint("nimbus", 99, {
      name: "Sprint 19",
      status: "active",
      length: 14,
      currentDay: 6,
      planned: 38,
      velocity: 33,
      severity: 0.5,
      goal: "Land the observability pipeline rewrite.",
    }),
  );

  // Harbor: 7 completed + 1 active low-risk sprint.
  seedsFor("harbor").forEach((s, i) => sprints.push(buildSprint("harbor", i + 20, s)));
  sprints.push(
    buildSprint("harbor", 98, {
      name: "Sprint 28",
      status: "active",
      length: 10,
      currentDay: 4,
      planned: 26,
      velocity: 30,
      severity: 0.1,
      goal: "Complete onboarding checklist redesign.",
    }),
  );

  return sprints;
}
