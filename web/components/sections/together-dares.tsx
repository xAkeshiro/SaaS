"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { AnimatedList } from "@/components/magicui/animated-list";
import { together, togetherExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type Dare = (typeof together.dares)[number];

/** The animated list puts each arrival on top, so this is the order it ends in. */
const finalOrder = [...together.dares].reverse();

const listClass = "flex flex-col divide-y divide-border";

function DareRow({ dare }: { dare: Dare }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <p className="min-w-0 text-[0.9375rem] leading-snug font-medium text-foreground break-words">{dare.title}</p>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{dare.tag}</span>
    </div>
  );
}

/**
 * "Today's dares" panel: one card, dares as divided rows. The list only starts once it
 * scrolls into view, and an invisible copy of the finished list reserves the height so
 * the page does not jump as dares arrive. Under prefers-reduced-motion the timed sequence
 * is a side effect the global MotionConfig cannot neutralize, so the finished list renders
 * at once instead. Both branches wait for `inView`, which is false during hydration, so
 * server and client markup match.
 */
export function TogetherDares({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("rounded-3xl border border-border bg-card px-5 pt-5 pb-2 md:px-6", className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h3 className="font-display text-base font-semibold text-foreground">{togetherExtras.daresTitle}</h3>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{togetherExtras.daresMeta}</span>
      </div>

      <div className="grid">
        <div aria-hidden="true" className={cn("invisible col-start-1 row-start-1", listClass)}>
          {finalOrder.map((dare) => (
            <DareRow key={dare.title} dare={dare} />
          ))}
        </div>
        <div className="col-start-1 row-start-1">
          {inView && reduceMotion ? (
            <div className={listClass}>
              {finalOrder.map((dare) => (
                <DareRow key={dare.title} dare={dare} />
              ))}
            </div>
          ) : inView ? (
            <AnimatedList delay={350} className={cn("items-stretch gap-0", listClass)}>
              {together.dares.map((dare) => (
                <DareRow key={dare.title} dare={dare} />
              ))}
            </AnimatedList>
          ) : null}
        </div>
      </div>
    </div>
  );
}
