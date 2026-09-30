import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PageHeader } from "@/components/panel";
import { SprintTable } from "@/components/sprint-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/sprints/")({
  head: () => ({
    meta: [
      { title: "Sprints — SprintShield" },
      {
        name: "description",
        content:
          "Search and filter every sprint by status and risk level, then open a sprint for its full risk breakdown.",
      },
      { property: "og:title", content: "Sprints — SprintShield" },
      {
        property: "og:description",
        content: "Every sprint with its current risk, progress, velocity and scope-change activity.",
      },
    ],
  }),
  component: SprintsPage,
});

function SprintsPage() {
  const { sprints, selectedProject, riskFor } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const [scope, setScope] = useState("project");

  const filtered = useMemo(() => {
    return sprints.filter((s) => {
      if (scope === "project" && selectedProject && s.projectId !== selectedProject.id) return false;
      if (query && !`${s.name} ${s.goal}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (status !== "all" && s.status !== status) return false;
      if (level !== "all" && riskFor(s).level !== level) return false;
      return true;
    });
  }, [sprints, scope, selectedProject, query, status, level, riskFor]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sprint management"
        title="Sprints"
        subtitle="Every sprint scored by the Baseline Risk Engine. Open a sprint for its metrics, timeline and mitigation plan."
      />

      <Panel bodyClassName="p-0 sm:p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sprints…"
              className="pl-9"
            />
          </div>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Current project</SelectItem>
              <SelectItem value="all">All projects</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk</SelectItem>
              <SelectItem value="low">Low risk</SelectItem>
              <SelectItem value="medium">Medium risk</SelectItem>
              <SelectItem value="high">High risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SprintTable sprints={filtered} />
      </Panel>
    </AppShell>
  );
}
