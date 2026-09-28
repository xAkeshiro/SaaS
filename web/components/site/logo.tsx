import Link from "next/link";
import { site } from "@/lib/content";
import { cn } from "@/lib/utils";

/** The mark is literally a tile: glazed amber, four ink bars of a voice. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid size-8 place-items-center overflow-hidden rounded-[7px] bg-amber text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_0_rgba(120,60,0,0.18),0_4px_8px_-4px_rgba(2,24,18,0.7)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="relative size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round">
        <path d="M6 10v4" />
        <path d="M10 6v12" />
        <path d="M14 8v8" />
        <path d="M18 10v4" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className={cn(
        "press inline-flex items-center gap-2.5 rounded-lg text-[1.3rem] font-extrabold tracking-[-0.02em] text-wall-ink [font-stretch:92%]",
        className,
      )}
    >
      <LogoMark />
      <span>{site.name}</span>
    </Link>
  );
}
