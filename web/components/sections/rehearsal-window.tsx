"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Mic, Sparkles } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { rehearsalWindow as rw } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Role = (typeof rw.transcript)[number]["role"];

/**
 * Self-playing timeline (ms from the start of each loop):
 * 1 landlord line -> 2 your line -> 3 landlord goes quiet (dots) -> 4 landlord reply -> reset.
 */
const CUES = [500, 3300, 5700, 6800] as const;
const LOOP_MS = 9600;
const LAST_STEP = CUES.length;
const BAR_HEIGHTS = [10, 18, 26, 32, 26, 18, 10];

function speakerFor(step: number): Role | "pause" | null {
  switch (step) {
    case 1:
      return "persona";
    case 2:
      return "user";
    case 3:
      return "pause";
    case 4:
      return "persona";
    default:
      return null;
  }
}

export function RehearsalWindow({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    if (reduce) {
      // No loop: show the whole exchange at rest.
      later(() => setStep(LAST_STEP), 0);
    } else {
      const cycle = () => {
        CUES.forEach((ms, i) => later(() => setStep(i + 1), ms));
        later(() => {
          setStep(0);
          cycle();
        }, LOOP_MS);
      };
      cycle();
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduce]);

  // At rest (reduced motion shows the whole exchange static) nobody is talking.
  const speaking = reduce ? null : speakerFor(step);
  const bubbles = step >= 4 ? 3 : Math.min(step, 2);
  const thinking = step === 3;
  const status =
    speaking === "persona"
      ? rw.status.persona
      : speaking === "user"
        ? rw.status.user
        : speaking === "pause"
          ? rw.status.pause
          : rw.status.idle;
  const barColor =
    speaking === "persona" ? "bg-amber" : speaking === "user" ? "bg-ink" : "bg-foreground/20";
  const barsRunning = speaking === "persona" || speaking === "user";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card text-left shadow-window",
        className,
      )}
    >
      <BorderBeam size={160} duration={11} colorFrom="#FFB454" colorTo="#C7CDF8" />

      {/* Title bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-background/70 px-4 py-3">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/12" />
          <span className="size-2.5 rounded-full bg-foreground/12" />
          <span className="size-2.5 rounded-full bg-foreground/12" />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber opacity-60" />
            <span className="relative size-2 rounded-full bg-amber" />
          </span>
          <span className="whitespace-nowrap">{rw.windowTitle}</span>
        </div>
        <div className="flex justify-end">
          <span className="inline-flex items-center rounded-full bg-amber/20 px-2.5 py-1 font-mono text-[11px] font-medium whitespace-nowrap text-amber-ink">
            {rw.mode}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-[1.1fr_0.9fr]">
        {/* Left: persona, waveform, transcript */}
        <div className="min-w-0 border-b border-border p-4 sm:p-5 md:border-r md:border-b-0 md:p-6">
          <div className="flex items-start gap-3">
            <span className="relative shrink-0">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-lavender-deep font-display text-base font-semibold text-ink"
              >
                {rw.persona.initial}
              </span>
              <span className="absolute -right-1 -bottom-1 rounded-full border border-border bg-card px-1 font-mono text-[10px] leading-4 text-muted-foreground">
                {rw.persona.tag}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-display text-[1.05rem] leading-tight font-semibold text-foreground">{rw.persona.who}</p>
                <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-foreground/80">
                  {rw.persona.mood}
                </span>
              </div>
              <p className="mt-1 text-sm break-words text-muted-foreground">{rw.persona.scenario}</p>
            </div>
          </div>

          {/* Waveform */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-3.5 py-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                speaking === "user" ? "bg-ink text-white" : "bg-muted text-muted-foreground",
              )}
            >
              <Mic aria-hidden="true" className="size-3.5" />
            </span>
            <div aria-hidden="true" className="flex h-8 items-center gap-1">
              {BAR_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className={cn("w-1 origin-center animate-wave rounded-full transition-colors duration-300", barColor)}
                  style={{
                    height: h,
                    animationDelay: `${i * 0.11}s`,
                    animationPlayState: barsRunning ? "running" : "paused",
                  }}
                />
              ))}
            </div>
            <span className="ml-auto min-w-0 truncate font-mono text-[11px] text-muted-foreground">{status}</span>
          </div>

          {/* Transcript: a hidden copy reserves the height so the card never jumps. */}
          <div className="relative mt-4">
            <ul aria-hidden="true" className="invisible flex flex-col gap-2.5">
              {rw.transcript.map((m) => (
                <li key={m.text} className={bubbleClass(m.role)}>
                  <span className={tagClass(m.role)}>{m.speaker}</span>
                  {m.text}
                </li>
              ))}
            </ul>
            <ul className="absolute inset-0 flex flex-col gap-2.5">
              <AnimatePresence>
                {rw.transcript.slice(0, bubbles).map((m, i) => (
                  <motion.li
                    key={i}
                    className={bubbleClass(m.role)}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.25, ease } }}
                    transition={{ duration: 0.45, ease }}
                  >
                    <span className={tagClass(m.role)}>{m.speaker}</span>
                    {m.text}
                  </motion.li>
                ))}
                {thinking ? (
                  <motion.li
                    key="thinking"
                    aria-hidden="true"
                    className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, ease }}
                  >
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-1.5 rounded-full bg-foreground/50"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                      />
                    ))}
                  </motion.li>
                ) : null}
              </AnimatePresence>
            </ul>
          </div>
        </div>

        {/* Right: debrief */}
        <div className="flex min-w-0 flex-col bg-muted/40 p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-amber text-ink">
                <Sparkles aria-hidden="true" className="size-3.5" />
              </span>
              <p className="font-display text-base font-semibold text-foreground">{rw.debrief.title}</p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{rw.debrief.meta}</span>
          </div>

          <dl className="mt-3 divide-y divide-border">
            {rw.debrief.rows.map((row, i) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="min-w-0 text-sm text-muted-foreground">{row.label}</dt>
                <dd className="flex shrink-0 items-center gap-2 text-right">
                  {row.check ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-amber text-ink">
                      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                      <span className="sr-only">{row.note}</span>
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-[0.95rem] font-semibold text-foreground tabular-nums">
                        {row.prefix}
                        <NumberTicker
                          value={row.value}
                          delay={0.4 + i * 0.15}
                          className="font-semibold tracking-normal text-foreground"
                        />
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{row.note}</span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl border border-border bg-card p-3.5">
            <p className="eyebrow text-amber-ink">{rw.debrief.nextLabel}</p>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {rw.debrief.next.map((line) => (
                <li key={line} className="border-l-2 border-amber pl-3 text-sm leading-relaxed break-words text-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function bubbleClass(role: Role) {
  return cn(
    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-snug break-words",
    role === "user"
      ? "self-end rounded-br-md bg-primary text-primary-foreground"
      : "self-start rounded-bl-md bg-muted text-foreground",
  );
}

function tagClass(role: Role) {
  return cn(
    "mb-0.5 block font-mono text-[10px] tracking-[0.12em] uppercase",
    role === "user" ? "text-white/60" : "text-muted-foreground",
  );
}
