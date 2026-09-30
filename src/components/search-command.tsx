import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";

export function useSearchCommand() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { projects, sprints, mitigations, selectProject, selectSprint } = useStore();

  const go = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search projects, sprints, predictions, mitigations…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem
              key={p.id}
              value={`project ${p.name} ${p.team}`}
              onSelect={() =>
                go(() => {
                  selectProject(p.id);
                  navigate({ to: "/dashboard" });
                })
              }
            >
              {p.name}
              <span className="ml-auto text-xs text-muted-foreground">{p.team}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Sprints">
          {sprints.map((s) => (
            <CommandItem
              key={s.id}
              value={`sprint ${s.name} ${s.projectId} ${s.goal}`}
              onSelect={() =>
                go(() => {
                  selectSprint(s.id);
                  navigate({ to: "/sprints/$sprintId", params: { sprintId: s.id } });
                })
              }
            >
              {s.name}
              <span className="ml-auto text-xs capitalize text-muted-foreground">{s.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Risk predictions">
          <CommandItem
            value="risk prediction early sprint"
            onSelect={() => go(() => navigate({ to: "/predictions" }))}
          >
            Early Sprint Risk Prediction
          </CommandItem>
          <CommandItem value="analytics charts" onSelect={() => go(() => navigate({ to: "/analytics" }))}>
            Analytics
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Mitigation actions">
          {mitigations.map((m) => (
            <CommandItem
              key={m.id}
              value={`mitigation ${m.title} ${m.reason}`}
              onSelect={() => go(() => navigate({ to: "/mitigation" }))}
            >
              {m.title}
              <span className="ml-auto text-xs capitalize text-muted-foreground">{m.priority}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
