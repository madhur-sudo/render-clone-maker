import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createDemoSprints, DEMO_PROJECTS } from "./demo-data";
import { computeRisk, DEFAULT_THRESHOLDS, deriveMitigations, RISK_LEVEL_LABEL } from "./risk-engine";
import type {
  AppNotification,
  MitigationAction,
  MitigationStatus,
  Project,
  RiskResult,
  RiskThresholds,
  Sprint,
  SprintSnapshot,
} from "./types";

const STORAGE_KEY = "sprintshield.workspace.v2";

interface PersistedState {
  projects?: Project[];
  selectedProjectId?: string;
  selectedSprintId?: string;
  snapshotDay?: number | null;
  thresholds?: RiskThresholds;
  mitigationStatus?: Record<string, MitigationStatus>;
  readNotifications?: string[];
  demoLaunched?: boolean;
}

/** Delta between the current snapshot and the one immediately before it. */
export interface SnapshotDelta {
  scopeChanges: number;
  blockedIssues: number;
  completedPoints: number;
  statusChanges: number;
  assigneeChanges: number;
  riskScore: number;
  riskScorePrev: number;
  explanation: string;
  hasPrev: boolean;
}

interface StoreValue {
  projects: Project[];
  sprints: Sprint[];
  selectedProject: Project | undefined;
  selectedSprint: Sprint | undefined;
  projectSprints: Sprint[];
  risk: RiskResult | undefined;
  thresholds: RiskThresholds;
  mitigations: MitigationAction[];
  notifications: AppNotification[];
  unreadCount: number;
  demoLaunched: boolean;
  hydrated: boolean;
  /** The globally selected snapshot day (null = use sprint's currentDay). */
  snapshotDay: number | null;
  /** The effective day number actually used for risk calculation. */
  activeSnapshotDay: number;
  /** Delta analysis: what changed between adjacent snapshots. */
  snapshotDelta: SnapshotDelta | undefined;
  selectProject: (id: string) => void;
  selectSprint: (id: string) => void;
  setSnapshotDay: (day: number | null) => void;
  setThresholds: (t: RiskThresholds) => void;
  setMitigationStatus: (id: string, status: MitigationStatus) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  launchDemo: () => void;
  createProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, p: Omit<Project, "id">) => void;
  deleteProject: (id: string) => void;
  riskFor: (sprint: Sprint, day?: number) => RiskResult;
  mitigationsFor: (sprint: Sprint) => MitigationAction[];
}

const StoreContext = createContext<StoreValue | null>(null);

/** Compute what changed between snapshots at day-1 and day. */
function computeDelta(
  sprint: Sprint,
  currentDay: number,
  currentRisk: RiskResult,
  thresholds: RiskThresholds,
): SnapshotDelta {
  const snaps = sprint.snapshots.filter((s) => s.day <= currentDay);
  const curr: SprintSnapshot = snaps[snaps.length - 1] ?? sprint.snapshots[0];
  const prevSnap: SprintSnapshot | undefined = snaps[snaps.length - 2];

  if (!prevSnap) {
    return {
      scopeChanges: 0,
      blockedIssues: 0,
      completedPoints: 0,
      statusChanges: 0,
      assigneeChanges: 0,
      riskScore: currentRisk.score,
      riskScorePrev: currentRisk.score,
      explanation: "No previous snapshot available for comparison.",
      hasPrev: false,
    };
  }

  const prevRisk = computeRisk(sprint, thresholds, prevSnap.day);

  const dScope =
    (curr.issuesAdded + curr.issuesRemoved + curr.storyPointChanges) -
    (prevSnap.issuesAdded + prevSnap.issuesRemoved + prevSnap.storyPointChanges);
  const dBlocked = curr.blockedIssues - prevSnap.blockedIssues;
  const dCompleted = curr.completedPoints - prevSnap.completedPoints;
  const dStatus = curr.statusChanges - prevSnap.statusChanges;
  const dAssignee = curr.assigneeChanges - prevSnap.assigneeChanges;
  const dRisk = currentRisk.score - prevRisk.score;

  // Build a concise narrative.
  const parts: string[] = [];
  if (dRisk > 5) parts.push(`risk score increased by ${Math.abs(dRisk)} points`);
  else if (dRisk < -5) parts.push(`risk score decreased by ${Math.abs(dRisk)} points`);
  if (dBlocked > 0) parts.push(`${dBlocked} more issue${dBlocked !== 1 ? "s" : ""} became blocked`);
  if (dScope > 0) parts.push(`scope-change activity grew by ${dScope}`);
  if (dCompleted > 0) parts.push(`${dCompleted} story point${dCompleted !== 1 ? "s" : ""} completed`);

  const explanation =
    parts.length === 0
      ? `No significant changes since Day ${prevSnap.day}.`
      : `Since Day ${prevSnap.day}: ${parts.slice(0, 3).join(", ")}.`;

  return {
    scopeChanges: dScope,
    blockedIssues: dBlocked,
    completedPoints: dCompleted,
    statusChanges: dStatus,
    assigneeChanges: dAssignee,
    riskScore: currentRisk.score,
    riskScorePrev: prevRisk.score,
    explanation,
    hasPrev: true,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [sprints] = useState<Sprint[]>(() => createDemoSprints());
  const [projects, setProjects] = useState<Project[]>(() => DEMO_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState("atlas");
  const [selectedSprintId, setSelectedSprintId] = useState("atlas-42");
  const [snapshotDay, setSnapshotDayState] = useState<number | null>(null);
  const [thresholds, setThresholdsState] = useState<RiskThresholds>(DEFAULT_THRESHOLDS);
  const [mitigationStatus, setMitigationStatusState] = useState<Record<string, MitigationStatus>>({});
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [demoLaunched, setDemoLaunched] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state after hydration to keep SSR output stable.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.projects?.length) setProjects(parsed.projects);
        if (parsed.selectedProjectId) setSelectedProjectId(parsed.selectedProjectId);
        if (parsed.selectedSprintId) setSelectedSprintId(parsed.selectedSprintId);
        if (parsed.thresholds) setThresholdsState(parsed.thresholds);
        if (parsed.mitigationStatus) setMitigationStatusState(parsed.mitigationStatus);
        if (parsed.readNotifications) setReadNotifications(parsed.readNotifications);
        if (parsed.demoLaunched) setDemoLaunched(true);
        // snapshotDay intentionally NOT persisted — always start at current day.
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = {
      projects,
      selectedProjectId,
      selectedSprintId,
      thresholds,
      mitigationStatus,
      readNotifications,
      demoLaunched,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [
    hydrated,
    projects,
    selectedProjectId,
    selectedSprintId,
    thresholds,
    mitigationStatus,
    readNotifications,
    demoLaunched,
  ]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === selectedProjectId),
    [sprints, selectedProjectId],
  );
  const selectedSprint =
    sprints.find((s) => s.id === selectedSprintId && s.projectId === selectedProjectId) ??
    projectSprints.find((s) => s.status === "active") ??
    projectSprints[projectSprints.length - 1];

  // When sprint changes, reset snapshotDay.
  const setSnapshotDay = useCallback((day: number | null) => {
    setSnapshotDayState(day);
  }, []);

  // Effective day: clamp to sprint's currentDay.
  const activeSnapshotDay = useMemo(() => {
    if (!selectedSprint) return 1;
    const max = selectedSprint.currentDay;
    if (snapshotDay === null) return max;
    return Math.min(Math.max(1, snapshotDay), max);
  }, [snapshotDay, selectedSprint]);

  const riskFor = useCallback(
    (sprint: Sprint, day?: number) => computeRisk(sprint, thresholds, day),
    [thresholds],
  );

  const risk = useMemo(
    () => (selectedSprint ? computeRisk(selectedSprint, thresholds, activeSnapshotDay) : undefined),
    [selectedSprint, thresholds, activeSnapshotDay],
  );

  const snapshotDelta = useMemo<SnapshotDelta | undefined>(() => {
    if (!selectedSprint || !risk) return undefined;
    return computeDelta(selectedSprint, activeSnapshotDay, risk, thresholds);
  }, [selectedSprint, activeSnapshotDay, risk, thresholds]);

  const mitigations = useMemo(() => {
    if (!selectedSprint || !risk) return [];
    return deriveMitigations(selectedSprint, risk).map((m) => ({
      ...m,
      status: mitigationStatus[m.id] ?? m.status,
    }));
  }, [selectedSprint, risk, mitigationStatus]);

  const notifications = useMemo<AppNotification[]>(() => {
    if (!selectedSprint || !risk) return [];
    const items: AppNotification[] = [];
    const snap = risk.snapshot;
    const series = selectedSprint.snapshots.filter((s) => s.day <= selectedSprint.currentDay);
    const prevDay = series.length > 1 ? series[series.length - 2].day : undefined;
    const prev = prevDay ? computeRisk(selectedSprint, thresholds, prevDay) : undefined;

    if (prev && prev.level !== risk.level) {
      items.push({
        id: `${selectedSprint.id}-level`,
        title: `Risk moved from ${RISK_LEVEL_LABEL[prev.level]} to ${RISK_LEVEL_LABEL[risk.level]}`,
        detail: `${selectedSprint.name} is now scored at ${risk.score} / 100.`,
        level: risk.level,
        read: false,
        sprintId: selectedSprint.id,
      });
    }
    const churn = snap.issuesAdded + snap.issuesRemoved + snap.storyPointChanges;
    if (churn >= 5) {
      items.push({
        id: `${selectedSprint.id}-scope`,
        title: "Scope-change activity has increased",
        detail: `${churn} scope changes recorded since sprint start.`,
        level: "medium",
        read: false,
        sprintId: selectedSprint.id,
      });
    }
    if (snap.blockedIssues > 0) {
      items.push({
        id: `${selectedSprint.id}-blocked`,
        title: `${snap.blockedIssues} issue${snap.blockedIssues === 1 ? " is" : "s are"} currently blocked`,
        detail: `Blocked work is contributing to ${selectedSprint.name}'s risk score.`,
        level: snap.blockedIssues >= 3 ? "high" : "medium",
        read: false,
        sprintId: selectedSprint.id,
      });
    }
    if (risk.progressRatio < risk.expectedProgressRatio) {
      items.push({
        id: `${selectedSprint.id}-pace`,
        title: "Sprint progress is below expected pace",
        detail: `${Math.round(risk.progressRatio * 100)}% complete against an expected ${Math.round(
          risk.expectedProgressRatio * 100,
        )}%.`,
        level: "high",
        read: false,
        sprintId: selectedSprint.id,
      });
    }
    items.push({
      id: `${selectedSprint.id}-engine`,
      title: "Baseline Risk Engine recalculated",
      detail: `Snapshot for Day ${snap.day} of ${selectedSprint.lengthDays} scored ${risk.score} / 100.`,
      level: "info",
      read: false,
      sprintId: selectedSprint.id,
    });
    return items.map((n) => ({ ...n, read: readNotifications.includes(n.id) }));
  }, [selectedSprint, risk, thresholds, readNotifications]);

  const value: StoreValue = {
    projects,
    sprints,
    selectedProject,
    selectedSprint,
    projectSprints,
    risk,
    thresholds,
    mitigations,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    demoLaunched,
    hydrated,
    snapshotDay,
    activeSnapshotDay,
    snapshotDelta,
    selectProject: (id) => {
      setSelectedProjectId(id);
      setSnapshotDayState(null);
      const next = sprints.filter((s) => s.projectId === id);
      const active = next.find((s) => s.status === "active") ?? next[next.length - 1];
      if (active) setSelectedSprintId(active.id);
    },
    selectSprint: (id) => {
      const sprint = sprints.find((s) => s.id === id);
      if (!sprint) return;
      setSelectedProjectId(sprint.projectId);
      setSelectedSprintId(id);
      setSnapshotDayState(null);
    },
    setSnapshotDay,
    setThresholds: setThresholdsState,
    setMitigationStatus: (id, status) =>
      setMitigationStatusState((prev) => ({ ...prev, [id]: status })),
    markRead: (id) => setReadNotifications((prev) => (prev.includes(id) ? prev : [...prev, id])),
    markAllRead: () => setReadNotifications(notifications.map((n) => n.id)),
    launchDemo: () => setDemoLaunched(true),
    createProject: (p) =>
      setProjects((prev) => [...prev, { ...p, id: `custom-${Date.now().toString(36)}` }]),
    updateProject: (id, p) =>
      setProjects((prev) => prev.map((item) => (item.id === id ? { ...item, ...p } : item))),
    deleteProject: (id) =>
      setProjects((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (id === selectedProjectId && next[0]) setSelectedProjectId(next[0].id);
        return next;
      }),
    riskFor,
    mitigationsFor: (sprint) =>
      deriveMitigations(sprint, computeRisk(sprint, thresholds)).map((m) => ({
        ...m,
        status: mitigationStatus[m.id] ?? m.status,
      })),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}
