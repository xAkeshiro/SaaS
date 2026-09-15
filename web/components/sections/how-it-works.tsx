"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Briefcase, CalendarDays, Check, Flame, PhoneCall, UserRound } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { demoScenarios, howItWorks, moods, steps, type MoodId } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Step = (typeof steps)[number];
type StepId = Step["id"];

const STEP_COUNT = String(steps.length).padStart(2, "0");

export function HowItWorks() {
  const [active, setActive] = useState<StepId>(steps[0].id);
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === active),
  );
  const activeStep = steps[activeIndex];

  return (
    <section id="how-it-works" className="scroll-mt-28 py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading align="left" eyebrow={howItWorks.eyebrow} title={howItWorks.title} />
        </Reveal>

        <div className="mt-14 grid gap-14 lg:mt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <ol className="flex flex-col gap-14 lg:gap-0">
            {steps.map((step) => (
              <StepBlock key={step.id} step={step} active={active === step.id} onActivate={setActive} />
            ))}
          </ol>

          {/* Sticky showcase, desktop only. Mobile renders each panel under its step. */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <PanelFrame className="aspect-[4/3] min-h-[420px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    className="absolute inset-0 flex flex-col justify-center p-6 xl:p-8"
                    initial={{ opacity: 0, y: 16, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.2, ease } }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <Mock id={active} />
                  </motion.div>
                </AnimatePresence>
              </PanelFrame>

              <div className="mt-5 flex items-center justify-between gap-4" aria-hidden="true">
                <div className="flex items-center gap-1.5">
                  {steps.map((step, i) => (
                    <span
                      key={step.id}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 ease-out",
                        i === activeIndex ? "w-7 bg-foreground" : "w-1.5 bg-border",
                      )}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {activeStep.index} / {STEP_COUNT} · {activeStep.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function StepBlock({
  step,
  active,
  onActivate,
}: {
  step: Step;
  active: boolean;
  onActivate: (id: StepId) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Shrink the observed area to the middle 60% of the viewport so the panel swaps
  // while the step text sits beside the sticky panel, not when it first peeks in.
  const inView = useInView(ref, { amount: 0.6, margin: "-20% 0px -20% 0px" });

  useEffect(() => {
    if (inView) onActivate(step.id);
  }, [inView, onActivate, step.id]);

  return (
    <li className="lg:flex lg:min-h-[60vh] lg:flex-col lg:justify-center">
      <Reveal>
        <div
          ref={ref}
          className={cn(
            "max-w-[52ch] transition-opacity duration-300 ease-out",
            active ? "opacity-100" : "lg:opacity-50",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-medium text-amber-ink">{step.index}</span>
            <span className="h-px w-6 bg-amber-ink/40" aria-hidden="true" />
            <span className="eyebrow text-muted-foreground">{step.name}</span>
          </div>
          <h3 className="display-md mt-4 text-foreground">{step.title}</h3>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">{step.body}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber/25">
                  <Check className="size-3 text-amber-ink" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="min-w-0 break-words">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mt-8 lg:hidden">
        <PanelFrame>
          <div className="p-4 sm:p-6">
            <Mock id={step.id} />
          </div>
        </PanelFrame>
      </Reveal>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Panel chrome                                                        */
/* ------------------------------------------------------------------ */

const MESH =
  "radial-gradient(70% 60% at 100% 0%, color-mix(in oklab, var(--peach) 55%, transparent) 0%, transparent 70%), " +
  "radial-gradient(70% 70% at 0% 100%, color-mix(in oklab, var(--lavender-deep) 45%, transparent) 0%, transparent 70%)";

function PanelFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-soft",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: MESH }} />
      {children}
    </div>
  );
}

function Screen({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(11,15,26,0.04),0_24px_48px_-24px_rgba(29,38,84,0.35)] sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Mock({ id }: { id: StepId }) {
  switch (id) {
    case "rehearse":
      return <RehearseMock />;
    case "debrief":
      return <DebriefMock />;
    case "daily":
      return <DailyMock />;
    case "real":
      return <RealMock />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* 01 Rehearse: persona + waveform + mood segmented control            */
/* ------------------------------------------------------------------ */

const WAVE_HEIGHTS = [38, 62, 88, 54, 100, 70, 46, 92, 60, 80, 44, 66];
const SELECTED_MOOD: MoodId = "neutral";
const scenario = demoScenarios[1];

function RehearseMock() {
  const m = howItWorks.mocks.rehearse;
  return (
    <Screen>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender-deep/60 text-foreground">
          <UserRound className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{scenario.who}</p>
          <p className="truncate text-xs text-muted-foreground">{scenario.label}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground">
          <span className="size-1.5 rounded-full bg-amber" />
          {m.status}
        </span>
      </div>

      <div className="mt-4 flex h-14 items-center justify-center gap-1 sm:gap-1.5">
        {WAVE_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="w-1.5 animate-wave rounded-full bg-amber"
            style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <p className="mt-1 text-center font-mono text-[11px] text-muted-foreground">{m.speaking}</p>

      <div className="mt-3 rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-sm leading-snug text-foreground">
        {scenario.opener}
      </div>

      <div className="mt-4">
        <p className="eyebrow mb-2 text-muted-foreground">{m.moodLabel}</p>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1 text-xs font-medium">
          {moods.map((mood) => (
            <span
              key={mood.id}
              className={cn(
                "rounded-full px-2 py-1.5 text-center",
                mood.id === SELECTED_MOOD
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {mood.label}
            </span>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 02 Debrief: card with before/after bars                             */
/* ------------------------------------------------------------------ */

function Bar({ value, className, delay }: { value: number; className: string; delay: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className={cn("h-full rounded-full", className)}
        initial={{ width: "0%" }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease, delay }}
      />
    </div>
  );
}

function DebriefMock() {
  const m = howItWorks.mocks.debrief;
  return (
    <Screen>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-foreground">{m.title}</p>
          <p className="truncate text-xs text-muted-foreground">{m.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="font-display text-3xl font-bold leading-none text-foreground">{m.score}</span>
          <span className="font-mono text-xs text-muted-foreground">{m.scoreOf}</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {m.rows.map((row, i) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-muted-foreground">{row.label}</span>
              <span className="shrink-0 font-mono text-foreground">
                {row.value} <span className="text-muted-foreground">{row.was}</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              <Bar value={row.before} className="bg-lavender-deep" delay={0.08 * i} />
              <Bar value={row.now} className="bg-amber" delay={0.08 * i + 0.12} />
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">{m.held.label}</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
            <span className="grid size-4 place-items-center rounded-full bg-amber/25">
              <Check className="size-2.5 text-amber-ink" strokeWidth={3} />
            </span>
            {m.held.value}
          </span>
        </li>
      </ul>

      <div className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-xs leading-snug">
        <span className="mr-2 font-mono text-amber-ink">{m.patternLabel}</span>
        <span className="text-foreground">{m.pattern}</span>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 03 Daily rep: streak dots + calendar-aware rep + trend              */
/* ------------------------------------------------------------------ */

function DailyMock() {
  const m = howItWorks.mocks.daily;
  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber/25">
            <Flame className="size-4 text-amber-ink" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm leading-tight font-semibold text-foreground">
              {m.streak} {m.streakUnit}
            </p>
            <p className="text-xs text-muted-foreground">{m.streakLabel}</p>
          </div>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">{m.weekLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {m.days.map((day, i) => {
          const state = i < m.todayIndex ? "done" : i === m.todayIndex ? "today" : "next";
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">{day}</span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full sm:size-8",
                  state === "done" && "bg-foreground text-background",
                  state === "today" && "bg-amber text-foreground ring-4 ring-amber/25",
                  state === "next" && "border border-dashed border-border",
                )}
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                {state === "today" ? <span className="size-2 rounded-full bg-foreground" /> : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lavender-deep/50 text-foreground">
          <Briefcase className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{m.rep.title}</p>
          <p className="truncate text-xs text-muted-foreground">{m.rep.meta}</p>
        </div>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{m.trend.label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{m.trend.value}</p>
        </div>
        <svg viewBox="0 0 96 28" className="h-7 w-24 shrink-0 overflow-visible">
          <polyline
            points="2,22 17,18 32,20 47,12 62,14 78,8 94,4"
            fill="none"
            className="stroke-foreground"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="94" cy="4" r="3.5" className="fill-amber" />
        </svg>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 04 Real mode: cue card + static 60 s ring                           */
/* ------------------------------------------------------------------ */

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function RealMock() {
  const m = howItWorks.mocks.real;
  const progress = m.ring.seconds / m.ring.total;
  const time = `0:${String(m.ring.seconds).padStart(2, "0")}`;
  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-amber-ink">{m.title}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground">
          <span className="size-1.5 rounded-full bg-amber" />
          {m.phase}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 96 96" className="size-full -rotate-90">
            <circle cx="48" cy="48" r={RING_RADIUS} fill="none" className="stroke-muted" strokeWidth={6} />
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              fill="none"
              className="stroke-amber"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg leading-none font-semibold text-foreground tabular-nums">{time}</span>
            <span className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {m.ring.caption}
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 rounded-xl border border-border bg-background p-3">
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{m.cueTitle}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {m.cues.map((cue) => (
              <li key={cue} className="flex items-start gap-2 text-sm leading-snug text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" />
                <span className="min-w-0 break-words">{cue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
          <PhoneCall className="size-3.5" strokeWidth={2} />
          {m.cta}
        </span>
        <p className="min-w-0 text-[11px] leading-snug text-muted-foreground">{m.note}</p>
      </div>
    </Screen>
  );
}
