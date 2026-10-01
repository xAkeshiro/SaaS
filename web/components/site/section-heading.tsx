import { cn } from "@/lib/utils";

type Props = {
  /** Optional sentence-case label. On the home page only "Not a companion" keeps one. */
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
  /** Use on dark bands. */
  inverted?: boolean;
};

export function SectionHeading({ eyebrow, title, sub, align = "center", className, inverted }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className={cn("eyebrow", inverted ? "text-amber" : "text-amber-ink")}>{eyebrow}</span>
      ) : null}
      <h2 className={cn("display-lg max-w-[20ch]", inverted ? "text-white" : "text-foreground")}>{title}</h2>
      {/* 46ch keeps ledes to two even lines (with the utility's balance) instead of a stub last line. */}
      {sub ? <p className={cn("lede max-w-[46ch]", inverted && "text-white/70")}>{sub}</p> : null}
    </div>
  );
}
