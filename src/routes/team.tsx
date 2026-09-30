import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team 5 — SprintShield" },
      { name: "description", content: "Team 5, Agile Software Development: the people behind SprintShield." },
      { property: "og:title", content: "Team 5 — SprintShield" },
      { property: "og:description", content: "Meet Team 5, the team behind SprintShield." },
    ],
  }),
  component: TeamPage,
});

const MEMBERS = [
  "Madhur Ravindra Thepale",
  "Khushi Raj",
  "Vishwesh Melaka",
  "Piyush Choudhary",
  "Shreyas Khadabadi",
  "Archit Singhania",
];

function initials(name: string) {
  const parts = name.split(" ");
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TeamPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Team 5"
        title="Agile Software Development"
        subtitle="The team behind Early Sprint Risk Prediction and Mitigation."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MEMBERS.map((m) => (
          <div key={m} className="surface flex items-center gap-3 rounded-xl p-4">
            <Avatar className="size-11">
              <AvatarFallback className="bg-primary/15 text-sm text-primary">{initials(m)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-display text-sm font-semibold">{m}</div>
              <div className="text-xs text-muted-foreground">Team 5 member</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
