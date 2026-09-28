"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { AnimatedList } from "@/components/magicui/animated-list";
import { together, togetherExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type Dare = (typeof together.dares)[number];

const dot: Record<Dare["tone"], string> = {
  amber: "bg-amber ring-amber/25",
  lavender: "bg-lavender-deep ring-lavender-deep/35",
  peach: "bg-peach ring-peach/45",
};

function DareCard({ dare }: { dare: Dare }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-background/70 px-4 py-3">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full ring-4", dot[dare.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] leading-snug font-medium text-foreground break-words">{dare.title}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{dare.tag}</p>
      </div>
    </div>
  );
}

/**
 * "Today's dares" panel. The list only starts animating once it scrolls into view,
 * and an invisible copy of the finished list reserves the height so the page does
 * not jump as dares arrive. Under prefers-reduced-motion the timed sequence is a
 * side effect the global MotionConfig cannot neutralize, so the finished list
 * renders at once instead. Both branches wait for `inView`, which is false during
 * hydration, so server and client markup match.
 */
export function TogetherDares({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("rounded-3xl border border-border bg-card p-4 shadow-soft", className)}>
      <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3">
        <h3 className="font-display text-base font-semibold text-foreground">{togetherExtras.daresTitle}</h3>
        <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-amber ring-4 ring-amber/25" />
          {togetherExtras.daresMeta}
        </span>
      </div>

      <div className="grid">
        <div aria-hidden="true" className="invisible flex flex-col gap-3 col-start-1 row-start-1">
          {together.dares.map((dare) => (
            <DareCard key={dare.title} dare={dare} />
          ))}
        </div>
        <div className="col-start-1 row-start-1">
          {inView && reduceMotion ? (
            <div className="flex flex-col gap-3">
              {together.dares.map((dare) => (
                <DareCard key={dare.title} dare={dare} />
              ))}
            </div>
          ) : inView ? (
            <AnimatedList delay={1400} className="items-stretch gap-3">
              {together.dares.map((dare) => (
                <DareCard key={dare.title} dare={dare} />
              ))}
            </AnimatedList>
          ) : null}
        </div>
      </div>
    </div>
  );
}
