import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bolt,
  CalendarClock,
  GaugeCircle,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Timer,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { NotificationPanel } from "@/components/notification-panel";
import { SearchCommand, useSearchCommand } from "@/components/search-command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: LifeBuoy },
  { to: "/sprints", label: "Sprints", icon: Timer },
  { to: "/predictions", label: "Risk Predictions", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/mitigation", label: "Mitigation", icon: Bolt },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const SECONDARY = [
  { to: "/about", label: "About the project", icon: Info },
  { to: "/team", label: "Team 5", icon: Users },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-primary/12 text-primary font-medium",
          }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}

      <div className="mt-4 border-t border-sidebar-border pt-3">
        {SECONDARY.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-primary/12 text-primary font-medium",
            }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function SidebarFooter() {
  const navigate = useNavigate();
  return (
    <div className="border-t border-sidebar-border p-3">
      {/* Demo workspace label */}
      <div className="mb-2 rounded-md border border-primary/20 bg-primary/8 px-2.5 py-1.5 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Demo Workspace
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/15 text-xs text-primary">MT</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">Madhur Thepale</div>
          <div className="truncate text-xs text-muted-foreground">Team 5 — Agile SD</div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Return to landing page"
          onClick={() => navigate({ to: "/" })}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <NavList onNavigate={onNavigate} />
      <SidebarFooter />
    </div>
  );
}

function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { projects, projectSprints, selectedProject, selectedSprint, selectProject, selectSprint, activeSnapshotDay, snapshotDay } =
    useStore();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-xl sm:px-5">
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        {/* Project selector */}
        <Select value={selectedProject?.id} onValueChange={selectProject}>
          <SelectTrigger className="h-9 w-[9.5rem] border-border bg-card text-xs sm:w-44 sm:text-sm">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sprint selector — updates dashboard when changed */}
        <Select value={selectedSprint?.id} onValueChange={selectSprint}>
          <SelectTrigger className="hidden h-9 w-36 border-border bg-card text-xs sm:flex sm:text-sm">
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            {projectSprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.status === "active" ? " · active" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Snapshot day chip — shows which day is active globally */}
        {selectedSprint && (
          <div className="hidden h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs sm:flex">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">D</span>
            <span className="font-semibold tabular-nums">{activeSnapshotDay}</span>
            <span className="text-muted-foreground">/{selectedSprint.lengthDays}</span>
            {snapshotDay !== null && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                custom
              </span>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={onOpenSearch}
          className="hidden h-9 gap-2 text-muted-foreground sm:flex"
          aria-label="Open search (Ctrl+K)"
        >
          <Search className="size-4" />
          <span className="text-xs">Search</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>
        <Button size="icon" variant="ghost" className="sm:hidden" aria-label="Search" onClick={onOpenSearch}>
          <Search className="size-4" />
        </Button>

        <NotificationPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Account menu">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-[10px] text-primary">MT</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-sm">Madhur Thepale</div>
              <div className="text-xs font-normal text-muted-foreground">Demo Workspace · Team 5</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/predictions">
                <GaugeCircle className="size-4" /> Risk predictions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">
                <LogOut className="size-4" /> Return to landing
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { open, setOpen } = useSearchCommand();

  return (
    <div className="min-h-screen bg-background">
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block"
        aria-label="Main navigation"
      >
        <SidebarBody />
      </aside>
      <div className="lg:pl-60">
        <TopBar onOpenSearch={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">{children}</main>
      </div>
      <SearchCommand open={open} onOpenChange={setOpen} />
    </div>
  );
}
