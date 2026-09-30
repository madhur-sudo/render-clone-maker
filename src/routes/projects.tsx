import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/panel";
import { ProjectCard } from "@/components/project-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SprintShield" },
      {
        name: "description",
        content:
          "All monitored Agile projects with their active sprint, current risk level, progress and average velocity.",
      },
      { property: "og:title", content: "Projects — SprintShield" },
      {
        property: "og:description",
        content: "Create, edit and monitor the Agile projects tracked by SprintShield.",
      },
    ],
  }),
  component: ProjectsPage,
});

const EMPTY = { name: "", team: "", description: "", members: 5 };

function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, team: p.team, description: p.description, members: p.members });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("A project name is required.");
      return;
    }
    if (editing) {
      updateProject(editing.id, form);
      toast.success(`${form.name} updated.`);
    } else {
      createProject(form);
      toast.success(`${form.name} created.`);
    }
    setDialogOpen(false);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        subtitle="Each project carries its own sprint history, velocity baseline and active risk profile."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Create project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <div className="surface rounded-xl px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a project to start monitoring sprint risk.
          </p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="size-4" /> Create project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "Create project"}</DialogTitle>
            <DialogDescription>
              Projects created here are stored in this browser for the demo workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Project Atlas"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                placeholder="Platform Team"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="members">Members</Label>
              <Input
                id="members"
                type="number"
                min={1}
                value={form.members}
                onChange={(e) => setForm({ ...form, members: Number(e.target.value) })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this team is responsible for"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The project is removed from this workspace. Its demo sprint history stays available for other
              projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  deleteProject(pendingDelete.id);
                  toast.success(`${pendingDelete.name} deleted.`);
                }
                setPendingDelete(null);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
