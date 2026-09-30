import { Bell, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
  info: "bg-analytic",
};

export function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-risk-high text-[9px] font-semibold text-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="font-display text-sm font-semibold">Notifications</span>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
            <Check className="size-3" /> Mark all read
          </Button>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {notifications.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </li>
          )}
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full gap-2.5 px-3 py-3 text-left transition-colors hover:bg-accent/50",
                  n.read && "opacity-55",
                )}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", LEVEL_DOT[n.level])} />
                <span>
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{n.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
