"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowDown, CalendarDays, Check, Flame, PhoneCall, UserRound } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { demoScenarios, howItWorks, moods, steps, type MoodId } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Step = (typeof steps)[number];
type StepId = Step["id"];

/*
 * Scroll swaps the panel, so swaps can come fast: no mode="wait". The children are
 * absolute, so old and new crossfade instead of blanking the panel between steps.
 * Motion's reducedMotion setting does not cover `transform` strings, so the reduced
 * variant is chosen here and keeps only the fade.
 */
const PANEL_MOTION = {
  initial: { opacity: 0, transform: "translateY(8px)", filter: "blur(4px)" },
  animate: { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
  exit: { opacity: 0, transform: "translateY(-4px)", filter: "blur(4px)", transition: { duration: 0.15, ease } },
};
const PANEL_MOTION_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15, ease } },
};

/*
 * The step whose middle is nearest this viewport line (px) drives the panel. The panel is
 * pinned in pixels (top-28, 420px tall), so a fixed line tracks it at every viewport
 * height where a percentage band drifts away from it.
 */
const ACTIVE_LINE_Y = 380;

export function HowItWorks() {
  const [active, setActive] = useState<StepId>(steps[0].id);
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === active),
  );
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progress } = useScroll({ target: listRef, offset: ["start 55%", "end 55%"] });
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    const els = listRef.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!els) return;
    let next: StepId = steps[0].id;
    let best = Infinity;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - ACTIVE_LINE_Y);
      if (d < best) {
        best = d;
        next = el.dataset.step as StepId;
      }
    }
    // Same id is a no-op: React bails out of the re-render.
    setActive(next);
  });

  return (
    <section id="how-it-works" className="scroll-mt-28 py-20 md:py-24">
      <Container>
        <SectionHeading align="left" title={howItWorks.title} />

        {/* minmax(0, …) lets the columns share 1024px by ratio instead of the panel claiming a min width. */}
        <div className="mt-14 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div ref={listRef} className="relative min-w-0 lg:pl-10">
            <div aria-hidden="true" className="absolute top-[10vh] bottom-[10vh] left-0 hidden w-px bg-border lg:block">
              <motion.div className="absolute inset-0 origin-top bg-amber" style={{ scaleY: progress }} />
            </div>
            <ol className="flex min-w-0 flex-col gap-14 lg:gap-0">
              {steps.map((step, i) => (
                <StepBlock key={step.id} step={step} index={i} active={active === step.id} />
              ))}
            </ol>
          </div>

          {/* Sticky showcase, desktop only. Mobile renders each panel under its step. */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <PanelFrame className="h-[420px]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={active}
                    className="absolute inset-0 flex flex-col justify-center p-6 xl:p-8"
                    {...(reduceMotion ? PANEL_MOTION_REDUCED : PANEL_MOTION)}
                    transition={{ duration: 0.24, ease }}
                  >
                    <Mock id={active} />
                  </motion.div>
                </AnimatePresence>
              </PanelFrame>

              <div className="mt-5 flex items-center justify-between gap-4" aria-hidden="true">
                <div className="flex items-center gap-1.5">
                  {/* `layout` moves the pill with transforms; the inline radius lets motion keep it round mid-animation. */}
                  {steps.map((step, i) => (
                    <motion.span
                      key={step.id}
                      layout
                      style={{ borderRadius: 3 }}
                      transition={{ duration: 0.24, ease }}
                      className={cn(
                        "h-1.5 transition-colors duration-200",
                        i === activeIndex ? "w-7 bg-foreground" : "w-1.5 bg-border",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{howItWorks.caption}</p>
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

function StepBlock({ step, index, active }: { step: Step; index: number; active: boolean }) {
  return (
    <li className="lg:flex lg:min-h-[52vh] lg:flex-col lg:justify-center lg:last:min-h-[40vh]">
      {/* No reveal and no dimming: every step stays readable. Only the title marks the active one. */}
      <div data-step={step.id} className="max-w-[52ch]">
        <h3
          className={cn(
            "display-md text-foreground transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            !active && "lg:text-foreground/55",
          )}
        >
          {/* The <ol> already numbers the steps for screen readers; hiding the digit keeps the heading name clean. */}
          <span aria-hidden="true" className="mr-2.5 text-amber-ink">
            {index + 1}
          </span>
          {step.title}
        </h3>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">{step.body}</p>
      </div>

      <div className="mt-8 lg:hidden">
        <PanelFrame>
          <div className="p-4 sm:p-6">
            <Mock id={step.id} />
          </div>
        </PanelFrame>
        {/* Desktop shows this caption under the sticky panel; on phones it sits under the first one. */}
        {index === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground" aria-hidden="true">
            {howItWorks.caption}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Panel chrome                                                        */
/* ------------------------------------------------------------------ */

const MESH =
  "radial-gradient(70% 60% at 100% 0%, color-mix(in oklab, var(--peach) 55%, transparent) 0%, transparent 70%), " +
  "radial-gradient(70% 70% at 0% 100%, color-mix(in oklab, var(--lavender-deep) 45%, transparent) 0%, transparent 70%)";

/** Only a tinted mesh field, no border or shadow: the Screen inside is the one card. */
function PanelFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative isolate overflow-hidden rounded-3xl", className)}
      style={{ backgroundColor: "color-mix(in oklab, var(--lavender) 35%, var(--card))", backgroundImage: MESH }}
    >
      {children}
    </div>
  );
}

function Screen({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(11,15,26,0.04)] sm:p-5",
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

/** Small sentence-case label used across the mocks (mood, legends, captions). */
const LABEL = "text-xs font-medium text-muted-foreground";

/* ------------------------------------------------------------------ */
/* Rehearse: persona + waveform + mood segmented control               */
/* ------------------------------------------------------------------ */

const WAVE_HEIGHTS = [38, 62, 88, 54, 100, 70, 46, 92, 60, 80, 44, 66];
const SELECTED_MOOD: MoodId = "neutral";
// Looked up by id so reordering the scenario list cannot swap the story under the mocks.
const scenario =
  demoScenarios.find((s) => s.id === howItWorks.mocks.rehearse.scenarioId) ?? demoScenarios[0];

function RehearseMock() {
  const m = howItWorks.mocks.rehearse;
  const ref = useRef<HTMLDivElement>(null);
  // The wave is a loop: pause it whenever the mock is off screen.
  const inView = useInView(ref, { amount: 0.3 });
  return (
    <Screen>
      <div ref={ref}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender-deep/60 text-foreground">
            <UserRound className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{scenario.who}</p>
            <p className="truncate text-xs text-muted-foreground">{scenario.label}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground tabular-nums">
            <span className="size-1.5 rounded-full bg-amber" />
            {m.status}
          </span>
        </div>

        <div className="mt-4 flex h-14 items-center justify-center gap-1 sm:gap-1.5">
          {WAVE_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className="w-1.5 animate-wave rounded-full bg-amber"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 90}ms`,
                animationPlayState: inView ? "running" : "paused",
              }}
            />
          ))}
        </div>
        <p className={cn(LABEL, "mt-1 text-center")}>{m.speaking}</p>

        <div className="mt-3 rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-sm leading-snug text-foreground">
          {m.line}
        </div>

        <div className="mt-4">
          <p className={cn(LABEL, "mb-2")}>{m.moodLabel}</p>
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
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Debrief: score, then each metric as now vs was                      */
/* ------------------------------------------------------------------ */

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
          <span className="font-display text-3xl leading-none font-bold text-foreground tabular-nums">{m.score}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{m.scoreOf}</span>
        </div>
      </div>

      {/* Every metric here counts down, so each one carries the same "went down" arrow. */}
      <ul className="mt-3 divide-y divide-border text-sm">
        {m.rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 text-muted-foreground">{row.label}</span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <ArrowDown className="size-3 text-amber-ink" strokeWidth={2.5} />
                {row.value}
              </span>
              <span className="text-xs text-muted-foreground">{row.was}</span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 py-2.5">
          <span className="min-w-0 text-muted-foreground">{m.held.label}</span>
          <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
            <span className="grid size-4 place-items-center rounded-full bg-amber/25">
              <Check className="size-2.5 text-amber-ink" strokeWidth={3} />
            </span>
            {m.held.value}
          </span>
        </li>
      </ul>

      <div className="mt-2 rounded-xl bg-muted/70 px-3 py-2.5">
        <p className="text-xs font-medium text-amber-ink">{m.patternLabel}</p>
        <p className="mt-0.5 text-sm leading-snug text-foreground">{m.pattern}</p>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Daily rep: streak dots + calendar-aware rep                         */
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
            <p className="text-sm leading-tight font-semibold text-foreground tabular-nums">
              {m.streak} {m.streakUnit}
            </p>
            <p className="text-xs text-muted-foreground">{m.streakLabel}</p>
          </div>
        </div>
        <span className={LABEL}>{m.weekLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {m.days.map((day, i) => {
          const state = i < m.todayIndex ? "done" : i === m.todayIndex ? "today" : "next";
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={LABEL}>{day}</span>
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

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/70 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lavender-deep/50 text-foreground">
          <PhoneCall className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-medium text-foreground">{m.rep.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{m.rep.meta}</p>
        </div>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Real mode: warmup ring + cue card                                   */
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
        <p className="font-display text-lg font-semibold text-foreground">{m.title}</p>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
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
            <span className="text-lg leading-none font-semibold text-foreground tabular-nums">{time}</span>
            <span className={cn(LABEL, "mt-1")}>{m.ring.caption}</span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 rounded-xl bg-muted/70 p-3">
          <p className={LABEL}>{m.cueTitle}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-snug text-foreground marker:font-semibold marker:text-amber-ink">
            {m.cues.map((cue) => (
              <li key={cue} className="pl-1 break-words">
                {cue}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
          <PhoneCall className="size-3.5" strokeWidth={2} />
          {m.cta}
        </span>
        <p className="min-w-0 text-xs leading-snug text-muted-foreground">{m.note}</p>
      </div>
    </Screen>
  );
}
