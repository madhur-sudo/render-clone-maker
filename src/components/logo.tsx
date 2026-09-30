import { cn } from "@/lib/utils";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 2.5 28 6.5v9.8c0 7.2-4.9 11.9-12 13.2C8.9 28.2 4 23.5 4 16.3V6.5L16 2.5Z"
          fill="color-mix(in oklab, var(--primary) 18%, transparent)"
          stroke="var(--primary)"
          strokeWidth="1.6"
        />
        <path
          d="M9.5 19.5 13.5 15l3.5 3 5.5-7"
          stroke="var(--risk-low)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-base font-semibold tracking-tight">SprintShield</span>
    </span>
  );
}
