import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-7 items-center justify-center rounded-lg bg-amber text-ink",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M6 10v4" />
        <path d="M10 6v12" />
        <path d="M14 8v8" />
        <path d="M18 10v4" />
      </svg>
    </span>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Unmute home"
      className={cn("inline-flex items-center gap-2.5 font-display text-[1.2rem] font-bold tracking-tight", inverted ? "text-white" : "text-foreground", className)}
    >
      <LogoMark />
      <span>Unmute</span>
    </Link>
  );
}
