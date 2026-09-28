import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** The arrow nested in its own disc at the end of a primary button; it leans forward on hover. */
export function CtaArrow({ tone = "ink", className }: { tone?: "ink" | "amber"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 place-items-center rounded-full transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5",
        tone === "ink" ? "bg-ink text-amber" : "bg-amber text-ink",
        className,
      )}
    >
      <ArrowRight weight="bold" className="size-4" />
    </span>
  );
}
