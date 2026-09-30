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
} from "./types";

const STORAGE_KEY = "sprintshield.workspace.v1";

interface PersistedState {
  projects?: Project[];
  selectedProjectId?: string;
  selectedSprintId?: string;
  thresholds?: RiskThresholds;
  mitigationStatus?: Record<string, MitigationStatus>;
  readNotifications?: string[];
  demoLaunched?: boolean;
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
  selectProject: (id: string) => void;
  selectSprint: (id: string) => void;
  setThresholds: (t: RiskThresholds) => void;
  setMitigationStatus: (id: string, status: MitigationStatus) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  launchDemo: () => void;
  createProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, p: Omit<Project, "id">) => void;
  deleteProject: (id: string) => void;
  riskFor: (sprint: Sprint, day?: number) => RiskResult;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [sprints] = useState<Sprint[]>(() => createDemoSprints());
  const [projects, setProjects] = useState<Project[]>(() => DEMO_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState("atlas");
  const [selectedSprintId, setSelectedSprintId] = useState("atlas-42");
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

  const riskFor = useCallback(
    (sprint: Sprint, day?: number) => computeRisk(sprint, thresholds, day),
    [thresholds],
  );

  const risk = useMemo(
    () => (selectedSprint ? computeRisk(selectedSprint, thresholds) : undefined),
    [selectedSprint, thresholds],
  );

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
        detail: `${selectedSprint.name} is now scored at ${risk.score}% delay probability.`,
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
      detail: `Snapshot for day ${snap.day} of ${selectedSprint.lengthDays} scored ${risk.score}%.`,
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
    selectProject: (id) => {
      setSelectedProjectId(id);
      const next = sprints.filter((s) => s.projectId === id);
      const active = next.find((s) => s.status === "active") ?? next[next.length - 1];
      if (active) setSelectedSprintId(active.id);
    },
    selectSprint: (id) => {
      const sprint = sprints.find((s) => s.id === id);
      if (!sprint) return;
      setSelectedProjectId(sprint.projectId);
      setSelectedSprintId(id);
    },
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}
