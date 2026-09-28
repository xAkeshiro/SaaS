import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PostItProps = {
  /** Degrees. Real notes never sit square. */
  tilt?: number;
  /** Omit for a note that is simply there; `false` holds it back, `true` slaps it on. */
  play?: boolean;
  delay?: number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/** An amber sticky note: every debrief, dare and cue card in the product lands as one. */
export function PostIt({ tilt = -3, play, delay = 0, as: Tag = "div", className, children }: PostItProps) {
  const sequenced = play !== undefined;
  return (
    <Tag
      data-seq={sequenced ? "" : undefined}
      data-seq-ready={sequenced && play ? "" : undefined}
      className={cn("postit", sequenced && play && "postit-in", className)}
      style={{ "--tilt": `${tilt}deg`, "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
