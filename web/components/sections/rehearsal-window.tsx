"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { animate, AnimatePresence, motion, useInView } from "motion/react";
import { ArrowDown, Check, Mic, Sparkles } from "lucide-react";
import { REHEARSE_EVENT, type RehearseEventDetail } from "@/components/sections/live-demo";
import { demoScenarios, rehearsalWindow as rw } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Role = (typeof rw.transcript)[number]["role"];

/**
 * Self-playing timeline (ms from the start of each loop):
 * 1 front desk picks up -> 2 you ask -> 3 front desk checks (dots) -> 4 front desk offers a slot
 * -> 5 the call ends, the clock stops and the debrief writes itself -> hold -> next call from the top.
 */
const CUES = [500, 3300, 5700, 6800, 8100] as const;
/** Long enough that the finished debrief holds for about two seconds before the reset. */
const LOOP_MS = 11000;
const LAST_STEP = CUES.length;
const BAR_HEIGHTS = [10, 18, 26, 32, 26, 18, 10];
/** Speaking pace per word: the front desk is rushed but slower to read; you are rehearsed. */
const PACE = { persona: 95, user: 70 } as const;
/** Pending skeleton widths per debrief row, so the blanks look like the values they stand in for. */
const SKELETON_WIDTHS = ["w-16", "w-11", "w-12"] as const;
const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

const tryScenario = demoScenarios.find((s) => s.id === rw.tryScenarioId);

/* Reduced motion and page visibility come from useSyncExternalStore, so hydration renders the
   server's answer (motion on, visible) and only then switches. The window's markup depends on
   both, so reading them on the first client render would mismatch the server HTML. */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduce(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const reduceOnClient = () => window.matchMedia(REDUCE_QUERY).matches;
const reduceOnServer = () => false;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
const visibleOnClient = () => document.visibilityState === "visible";
const visibleOnServer = () => true;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** A prefix ending in ":" means the number is the seconds of a time, so it always shows two digits ("0:07", never "0:7"). */
function formatValue(prefix: string, n: number) {
  return prefix.endsWith(":") ? `${prefix}${String(n).padStart(2, "0")}` : `${prefix}${n}`;
}

/** A line that arrives the way it is said: word by word. The sentence is announced whole. */
function Words({ text, pace, still }: { text: string; pace: number; still: boolean }) {
  if (still) return <>{text}</>;
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="word-in inline-block" style={{ "--d": `${i * pace}ms` } as CSSProperties}>
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}

/**
 * The call clock ticks in its own component, so the once-a-second update re-renders one span
 * instead of the whole window. The parent keys it by loop, which restarts it with each call.
 */
function CallClock({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState<number>(rw.clockStart);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return <span className="tabular-nums">{clock(seconds)}</span>;
}

/**
 * A debrief number counting up from zero as the call ends. It only mounts at that moment, and it
 * writes the text node directly so the count does not re-render the window every frame.
 */
function CountUp({ value, prefix, delay }: { value: number; prefix: string; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: 0.9,
      delay,
      ease,
      onUpdate: (v) => {
        node.textContent = formatValue(prefix, Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, prefix, delay]);
  return <span ref={ref}>{formatValue(prefix, 0)}</span>;
}

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

function tryThisOne() {
  const detail: RehearseEventDetail = { id: rw.tryScenarioId };
  window.dispatchEvent(new CustomEvent(REHEARSE_EVENT, { detail }));
}

export function RehearsalWindow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useSyncExternalStore(subscribeReduce, reduceOnClient, reduceOnServer);
  const visible = useSyncExternalStore(subscribeVisibility, visibleOnClient, visibleOnServer);
  const inView = useInView(ref, { margin: "200px 0px" });
  // The loop and the clock only run while someone can see them.
  const playing = inView && visible && !reduce;
  const [step, setStep] = useState(0);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    // Every start, including a resume after scrolling away or switching tabs, is a fresh call
    // from the top, never a jump back into the middle of one.
    const cycle = () => {
      setLoop((n) => n + 1);
      setStep(0);
      CUES.forEach((ms, i) => later(() => setStep(i + 1), ms));
      later(cycle, LOOP_MS);
    };
    later(cycle, 0);
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [playing]);

  // Reduced motion rests on the whole exchange with the finished debrief; nothing plays.
  const shown = reduce ? LAST_STEP : step;
  const speaking = playing ? speakerFor(step) : null;
  const bubbles = shown >= 4 ? 3 : Math.min(shown, 2);
  const thinking = playing && step === 3;
  // The debrief is blank while the call plays and finished at rest (first paint, screenshots,
  // reduced motion) and once the call ends, so it never reports on a call that has not happened.
  const pending = !reduce && step >= 1 && step < LAST_STEP;
  // Numbers count up and the check lands each time a call ends, not on first paint.
  const counting = playing && step === LAST_STEP;
  const status =
    step === LAST_STEP && playing
      ? rw.status.ended
      : speaking === "persona"
      ? rw.status.persona
      : speaking === "user"
        ? rw.status.user
        : speaking === "pause"
          ? rw.status.pause
          : rw.status.idle;
  const barColor = speaking === "persona" ? "bg-amber" : speaking === "user" ? "bg-ink" : "bg-foreground/20";
  const barsRunning = speaking === "persona" || speaking === "user";

  return (
    <div
      ref={ref}
      className={cn(
        // The hairline is an inset ring on ::after: on the frame itself it would share box-shadow
        // with shadow-window, and whichever utility sorts later would erase the other.
        "relative overflow-hidden rounded-3xl bg-card text-left shadow-window after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-ink/[0.06] after:ring-inset",
        className,
      )}
    >
      {/* Title bar. On phones the mode chip steps aside so the title and the action fit one row. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/70 px-4 py-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="hidden sm:flex">
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium whitespace-nowrap text-foreground/75">
            {rw.mode}
          </span>
        </div>
        <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">
          {rw.windowTitle} · <CallClock key={loop} running={playing && step < LAST_STEP} />
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={tryThisOne}
            aria-label={tryScenario ? `${rw.tryLabel}: ${tryScenario.label}` : undefined}
            className={cn(
              "group -my-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-foreground/80 transition-[color,background-color,scale] duration-150 hover:bg-muted hover:text-foreground motion-safe:active:scale-[0.97]",
              EASE_OUT,
            )}
          >
            {rw.tryLabel}
            <ArrowDown
              aria-hidden="true"
              className={cn("size-3.5 transition-transform duration-200 group-hover:translate-y-0.5", EASE_OUT)}
            />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-[1.1fr_0.9fr]">
        {/* Left: persona, waveform, transcript */}
        <div className="min-w-0 border-b border-border p-4 sm:p-5 md:border-r md:border-b-0 md:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lavender-deep font-display text-base font-semibold text-ink"
            >
              {rw.persona.initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-display text-[1.05rem] leading-tight font-semibold text-foreground">{rw.persona.who}</p>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/75">
                  {rw.persona.tag} · {rw.persona.mood}
                </span>
              </div>
              <p className="mt-1 text-sm break-words text-muted-foreground">{rw.persona.scenario}</p>
            </div>
          </div>

          {/* Waveform: who is talking right now. */}
          <div className="mt-4 flex items-center gap-3 rounded-full bg-muted/60 py-1.5 pr-4 pl-1.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                speaking === "user" ? "bg-ink text-white" : "bg-card text-muted-foreground",
              )}
            >
              <Mic aria-hidden="true" className="size-3.5" />
            </span>
            <div aria-hidden="true" className="flex h-8 items-center gap-1">
              {BAR_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className={cn("w-1 origin-center animate-wave rounded-full transition-colors duration-200", barColor)}
                  style={{
                    height: h,
                    animationDelay: `${i * 0.11}s`,
                    animationPlayState: barsRunning ? "running" : "paused",
                  }}
                />
              ))}
            </div>
            <span className="ml-auto min-w-0 truncate text-xs font-medium text-muted-foreground">{status}</span>
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
                    initial={reduce ? false : { opacity: 0, transform: "translateY(8px) scale(0.98)" }}
                    animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                    exit={{ opacity: 0, transition: { duration: 0.15, ease } }}
                    transition={{ duration: 0.25, ease }}
                  >
                    <span className={tagClass(m.role)}>{m.speaker}</span>
                    <Words text={m.text} pace={m.role === "user" ? PACE.user : PACE.persona} still={reduce} />
                  </motion.li>
                ))}
                {thinking ? (
                  <motion.li
                    key="thinking"
                    aria-hidden="true"
                    className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-3"
                    initial={{ opacity: 0, transform: "translateY(6px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    exit={{ opacity: 0, transition: { duration: 0.12, ease } }}
                    transition={{ duration: 0.2, ease }}
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

        {/* Right: debrief. The layout never changes between pending and finished, only what fills it. */}
        <div className="flex min-w-0 flex-col bg-muted/40 p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-amber text-ink">
                <Sparkles aria-hidden="true" className="size-3.5" />
              </span>
              <p className="font-display text-base font-semibold text-foreground">{rw.debrief.title}</p>
            </div>
            {/* Both labels share one grid cell, so the swap is a crossfade with no width change. */}
            <span className="grid justify-items-end text-xs font-medium text-muted-foreground">
              <span
                aria-hidden={pending}
                className={cn("col-start-1 row-start-1 transition-opacity duration-200", pending && "opacity-0")}
              >
                {rw.debrief.meta}
              </span>
              <span
                aria-hidden={!pending}
                className={cn("col-start-1 row-start-1 transition-opacity duration-200", !pending && "opacity-0")}
              >
                {rw.debrief.pendingMeta}
              </span>
            </span>
          </div>

          <dl
            className={cn(
              "mt-3 divide-y divide-border transition-opacity",
              EASE_OUT,
              pending ? "opacity-45 duration-150" : "duration-250",
            )}
          >
            {rw.debrief.rows.map((row, i) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="min-w-0 text-sm text-muted-foreground">{row.label}</dt>
                {/* Fixed height, and the finished value keeps its width while hidden, so nothing reflows. */}
                <dd className="relative flex h-6 shrink-0 items-center justify-end">
                  <span className={cn("flex items-center gap-2", pending && "invisible")}>
                    {row.check ? (
                      <CheckMark key={counting ? `pop-${loop}` : "rest"} pop={counting} delay={0.35 + i * 0.08} note={row.note} />
                    ) : (
                      <>
                        <span className="text-[0.95rem] font-semibold text-foreground tabular-nums">
                          {counting ? (
                            <CountUp key={loop} value={row.value} prefix={row.prefix} delay={0.35 + i * 0.08} />
                          ) : (
                            formatValue(row.prefix, row.value)
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{row.note}</span>
                      </>
                    )}
                  </span>
                  {pending ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-1/2 right-0 -translate-y-1/2 bg-foreground/15",
                        row.check ? "size-5 rounded-full" : cn("h-2 rounded-full", SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]),
                      )}
                    />
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <p
              className={cn(
                "text-xs font-medium text-amber-ink transition-opacity",
                EASE_OUT,
                pending ? "opacity-45 duration-150" : "duration-250",
              )}
            >
              {rw.debrief.nextLabel}
            </p>
            {/* Dashed: lines you have not said yet, in the shape of your own bubbles. */}
            <ul className="mt-2.5 flex flex-col gap-2">
              {rw.debrief.next.map((line, i) => (
                <li
                  key={line}
                  className={cn(
                    "max-w-[92%] self-end rounded-2xl rounded-br-md border border-dashed border-foreground/25 bg-card px-3.5 py-2.5 text-sm leading-relaxed break-words text-foreground transition-[opacity,filter]",
                    EASE_OUT,
                    pending ? "opacity-45 blur-[2px] duration-150" : "duration-250",
                  )}
                  // Written out after the numbers land, 60 ms apart; blanking on a new call is immediate.
                  style={{ transitionDelay: pending ? "0ms" : `${600 + i * 60}ms` }}
                >
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

/** The held-the-ask check: lands with a small spring when a call ends, static otherwise. */
function CheckMark({ pop, delay, note }: { pop: boolean; delay: number; note: string }) {
  return (
    <motion.span
      initial={pop ? { opacity: 0, transform: "scale(0.9)" } : false}
      animate={{ opacity: 1, transform: "scale(1)" }}
      transition={{ type: "spring", duration: 0.4, bounce: 0.2, delay }}
      className="flex size-5 items-center justify-center rounded-full bg-amber text-ink"
    >
      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
      <span className="sr-only">{note}</span>
    </motion.span>
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
  return cn("mb-0.5 block text-xs font-medium", role === "user" ? "text-white/60" : "text-muted-foreground");
}
