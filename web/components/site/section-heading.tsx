import { cn } from "@/lib/utils";

/** No eyebrow slot: the only kicker on the site is the hero pill, so section headings never carry one. */
type Props = {
  title: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
  /** Use on dark bands. */
  inverted?: boolean;
};

export function SectionHeading({ title, sub, align = "center", className, inverted }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <h2 className={cn("display-lg max-w-[20ch]", inverted ? "text-white" : "text-foreground")}>{title}</h2>
      {/* 46ch keeps ledes to two even lines (with the utility's balance) instead of a stub last line. */}
      {sub ? <p className={cn("lede max-w-[46ch]", inverted && "text-white/70")}>{sub}</p> : null}
    </div>
  );
}
