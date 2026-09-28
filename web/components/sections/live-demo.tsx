"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, ArrowUp, CircleNotch, Play, SpeakerHigh, SpeakerSlash, Stop } from "@phosphor-icons/react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";
import { PostIt } from "@/components/world/post-it";
import { WipeClean } from "@/components/world/wipe-clean";
import { demoScenarios, liveDemo, moods, type MoodId } from "@/lib/content";
import type { Debrief, RehearseMode } from "@/lib/rehearse";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

type Role = "persona" | "user";
type Msg = { id: number; role: Role; text: string };
type Phase = "idle" | "starting" | "live" | "replying" | "debriefing" | "debrief";
type Scenario = { id: string; label: string; who: string; setup: string; opener?: string };
type Session = { scenario: Scenario; mood: MoodId };

/** Event other sections dispatch to load a scenario here (the scenario index does). */
export const REHEARSE_EVENT = "unmute:rehearse";
export type RehearseEventDetail = { id?: string | null; custom?: string };

const ENDPOINT = "/api/rehearse";
const MAX_MESSAGES = 24;
const MAX_TEXT = 800;
/** Lines kept on the glass; older ones fog back over. The full log stays available to screen readers. */
const ON_GLASS = 4;
const L = liveDemo.labels;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const subscribeNoop = () => () => {};
const speechOnClient = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
const speechOnServer = () => false;

function cancelSpeech() {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

function readMode(res: Response): RehearseMode | null {
  const m = res.headers.get("x-unmute-mode");
  return m === "sample" || m === "live" ? m : null;
}

async function responseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error) return data.error;
  } catch {
    /* not JSON */
  }
  return fallback;
}

function messageFor(err: unknown, fallback: string): string {
  if (err instanceof TypeError) return liveDemo.errors.network;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function isDebrief(x: unknown): x is Debrief {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  const strings = (v: unknown) => Array.isArray(v) && v.every((s) => typeof s === "string");
  return (
    typeof d.score === "number" &&
    strings(d.worked) &&
    strings(d.folded) &&
    strings(d.next) &&
    (d.next as string[]).length >= 2 &&
    typeof d.pattern === "string"
  );
}

async function readAll(res: Response): Promise<string> {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

function toWire(messages: Msg[]) {
  return messages.slice(-MAX_MESSAGES).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT) }));
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function LiveDemo() {
  const reduce = useReducedMotion();
  const speechSupported = useSyncExternalStore(subscribeNoop, speechOnClient, speechOnServer);
  const customId = useId();
  const inputId = useId();

  // Controls
  const [scenarioId, setScenarioId] = useState<string>(demoScenarios[0].id);
  const [custom, setCustom] = useState("");
  const [mood, setMood] = useState<MoodId>("neutral");
  const [voiceOn, setVoiceOn] = useState(false);

  // Rehearsal
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<RehearseMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [input, setInput] = useState("");
  const [announce, setAnnounce] = useState("");

  const idRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const voiceRef = useRef(voiceOn);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const focusRef = useRef(false);

  useEffect(() => {
    voiceRef.current = voiceOn;
  }, [voiceOn]);

  // Abort anything in flight and stop speaking when the section unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      cancelSpeech();
    };
  }, []);

  // The scenario index elsewhere on the page loads a conversation here.
  useEffect(() => {
    function onPick(e: Event) {
      const d = (e as CustomEvent<RehearseEventDetail>).detail;
      if (d?.id) {
        setScenarioId(d.id);
        setCustom("");
      } else if (d?.custom) {
        setCustom(d.custom);
      }
      document.getElementById("try")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => startRef.current?.focus({ preventScroll: true }), reduce ? 0 : 650);
    }
    window.addEventListener(REHEARSE_EVENT, onPick);
    return () => window.removeEventListener(REHEARSE_EVENT, onPick);
  }, [reduce]);

  // After Start: side by side, hand focus to the composer; stacked, bring the mirror into view first.
  useEffect(() => {
    if (phase !== "live" || !focusRef.current) return;
    focusRef.current = false;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    } else {
      stageRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [phase, session, reduce]);

  // The prefix keeps the whole setup inside the API's 800-char cap.
  const customText = custom.trim().slice(0, MAX_TEXT - L.customSetup.length - 1);
  const preset = demoScenarios.find((s) => s.id === scenarioId) ?? demoScenarios[0];
  const selected: Scenario = customText
    ? { id: "custom", label: L.customLabel, who: L.customWho, setup: `${L.customSetup} ${customText}` }
    : preset;

  const busy = phase === "starting" || phase === "replying" || phase === "debriefing";
  const canType = phase === "live" || phase === "replying";
  const hasExchange = messages.some((m) => m.role === "user");
  const thinking = phase === "starting" || phase === "replying";

  function nextId() {
    idRef.current += 1;
    return idRef.current;
  }

  function speak(text: string) {
    if (!voiceRef.current || !speechOnClient()) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    cancelSpeech();
  }

  /** Waits for the other person's whole line, then puts it on the glass to be read at speaking pace. */
  async function requestReply(history: Msg[], ctx: Session, signal: AbortSignal): Promise<string> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        scenario: { id: ctx.scenario.id, who: ctx.scenario.who, setup: ctx.scenario.setup },
        mood: ctx.mood,
        messages: toWire(history),
      }),
      signal,
    });
    const m = readMode(res);
    if (m) setMode(m);
    if (!res.ok) throw new Error(await responseError(res, liveDemo.errors.reply));
    const text = (await readAll(res)).trim();
    if (!text) throw new Error(liveDemo.errors.reply);
    setMessages((prev) => [...prev, { id: nextId(), role: "persona", text }]);
    setAnnounce(`${ctx.scenario.who}: ${text}`);
    return text;
  }

  async function start() {
    stop();
    const ctx: Session = { scenario: selected, mood };
    const controller = new AbortController();
    abortRef.current = controller;

    setSession(ctx);
    setMessages([]);
    setDebrief(null);
    setError(null);
    setInput("");
    setAnnounce("");

    if (ctx.scenario.opener) {
      const opener = ctx.scenario.opener;
      setMessages([{ id: nextId(), role: "persona", text: opener }]);
      setAnnounce(`${ctx.scenario.who}: ${opener}`);
      focusRef.current = true;
      setPhase("live");
      speak(opener);
      // Learn the mode without spending a turn.
      fetch(ENDPOINT, { cache: "no-store", signal: controller.signal })
        .then((res) => {
          const mm = readMode(res);
          if (mm) setMode(mm);
        })
        .catch(() => {});
      return;
    }

    setPhase("starting");
    try {
      const text = await requestReply([], ctx, controller.signal);
      speak(text);
      focusRef.current = true;
      setPhase("live");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(messageFor(err, liveDemo.errors.start));
      setPhase("idle");
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, MAX_TEXT);
    if (!text || phase !== "live" || !session) return;

    cancelSpeech();
    setInput("");
    setError(null);
    const userMsg: Msg = { id: nextId(), role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setPhase("replying");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const reply = await requestReply(history, session, controller.signal);
      speak(reply);
      setPhase("live");
    } catch (err) {
      if (controller.signal.aborted) return;
      // Give the line back so one tap retries it, unless they have typed something new meanwhile.
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput((current) => (current.trim() ? current : text));
      setError(messageFor(err, liveDemo.errors.reply));
      setPhase("live");
    }
  }

  async function end() {
    if (!session || phase !== "live" || !hasExchange) return;
    stop();
    setError(null);
    setPhase("debriefing");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "debrief",
          scenario: { id: session.scenario.id, who: session.scenario.who, setup: session.scenario.setup },
          mood: session.mood,
          messages: toWire(messages),
        }),
        signal: controller.signal,
      });
      const m = readMode(res);
      if (m) setMode(m);
      if (!res.ok) throw new Error(await responseError(res, liveDemo.errors.debrief));
      const data: unknown = await res.json();
      if (!isDebrief(data)) throw new Error(liveDemo.errors.debrief);
      setDebrief(data);
      setPhase("debrief");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(messageFor(err, liveDemo.errors.debrief));
      setPhase("live");
    }
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) cancelSpeech();
  }

  const header = session ?? { scenario: selected, mood };
  const onGlass = messages.slice(-ON_GLASS);
  const moodLabel = moods.find((m) => m.id === header.mood)?.label.toLowerCase() ?? header.mood;

  return (
    <section id="try" aria-labelledby="try-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container>
        <div className="max-w-[40rem]">
          <h2 id="try-title" className="display-2 on-tile text-wall-ink">
            {liveDemo.title}
          </h2>
          <p className="lede on-tile mt-5 max-w-[40ch] text-wall-muted">{liveDemo.sub}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-10">
          {/* ---------------- Controls on a glass panel ---------------- */}
          <div className="glass-panel flex min-w-0 flex-col gap-7 p-5 sm:p-7">
            <fieldset className="min-w-0">
              <legend className="mb-3 p-0 text-[0.9375rem] font-semibold text-ink">{L.conversation}</legend>
              <div className="flex flex-wrap gap-2">
                {demoScenarios.map((s) => {
                  const active = !customText && s.id === scenarioId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setScenarioId(s.id);
                        setCustom("");
                      }}
                      className={cn(
                        "press rounded-full px-3.5 py-2 text-[0.9375rem] leading-tight font-medium",
                        active ? "bg-ink text-glass" : "bg-ink/[0.07] text-ink hover:bg-ink/[0.12]",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="min-w-0">
              <label htmlFor={customId} className="mb-2 block text-[0.9375rem] font-semibold text-ink">
                {L.custom}
              </label>
              <textarea
                id={customId}
                rows={3}
                maxLength={MAX_TEXT}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={L.customPlaceholder}
                className="block w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-[0.9375rem] leading-relaxed text-ink shadow-[inset_0_0_0_1.5px_rgba(15,42,35,0.16)] transition-shadow duration-150 outline-none placeholder:text-ink-muted focus-visible:shadow-[inset_0_0_0_2px_var(--wall)]"
              />
            </div>

            <MoodPicker value={mood} onChange={setMood} />

            <button
              type="button"
              role="switch"
              aria-checked={voiceOn}
              disabled={!speechSupported}
              onClick={toggleVoice}
              className="press flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1 text-left disabled:opacity-60"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {voiceOn ? (
                  <SpeakerHigh weight="bold" className="size-5 shrink-0 text-wall" aria-hidden="true" />
                ) : (
                  <SpeakerSlash weight="bold" className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                )}
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-semibold text-ink">{L.voice}</span>
                  {!speechSupported ? <span className="block text-sm text-ink-muted">{L.voiceUnavailable}</span> : null}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-out",
                  voiceOn ? "bg-wall" : "bg-ink/45",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-out",
                    voiceOn && "translate-x-5",
                  )}
                />
              </span>
            </button>

            <div className="flex flex-col gap-2">
              <Button
                ref={startRef}
                type="button"
                size="lg"
                className="w-full"
                onClick={start}
                disabled={phase === "starting" || phase === "debriefing"}
              >
                {phase === "starting" ? (
                  <CircleNotch weight="bold" className="animate-spin" aria-hidden="true" />
                ) : (
                  <Play weight="fill" aria-hidden="true" />
                )}
                {phase === "starting" ? L.starting : phase === "live" || phase === "replying" ? L.restart : L.start}
              </Button>
              {error && phase === "idle" ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              ) : null}
              <p className="text-sm text-ink-muted">{liveDemo.voiceNote}</p>
            </div>
          </div>

          {/* ---------------- The mirror and the shelf under it ---------------- */}
          <div ref={stageRef} className="flex min-w-0 scroll-mt-24 flex-col">
            <Mirror shape="rect" seed={0x3c7e} className="aspect-[4/4.2] w-full sm:aspect-[4/3.3]">
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3 px-[6%] pt-[5%]">
                  <p className="min-w-0 text-[0.875rem] font-semibold text-ink-muted">
                    {header.scenario.who} · {moodLabel}
                  </p>
                  {mode ? (
                    <span className="shrink-0 rounded-full bg-ink/[0.08] px-2.5 py-1 text-[0.8125rem] font-semibold text-ink">
                      {mode === "live" ? liveDemo.badges.live : liveDemo.badges.sample}
                    </span>
                  ) : null}
                </div>

                {phase === "debrief" && debrief ? (
                  <>
                    <WipeClean />
                    <DebriefView debrief={debrief} onAgain={start} />
                  </>
                ) : (
                  <div className="relative flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-hidden px-[6%] pt-4 pb-[6%]">
                    {messages.length === 0 && !thinking ? (
                      <div className="m-auto max-w-[26ch] text-center">
                        <SteamText
                          text={L.idleTitle}
                          className="text-[clamp(1.2rem,2vw,1.6rem)] leading-tight font-[680] text-ink [font-stretch:94%]"
                        />
                        <p className="mt-3 text-[0.9375rem] font-medium text-ink-muted">{L.idleBody}</p>
                      </div>
                    ) : null}

                    <AnimatePresence initial={false}>
                      {onGlass.map((m) => (
                        <motion.div
                          key={m.id}
                          exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.3 } }}
                          className={cn("flex flex-col gap-1", m.role === "user" ? "items-end text-right" : "items-start")}
                        >
                          <span className="text-[0.8125rem] font-semibold text-ink-muted">
                            {m.role === "user" ? L.you : header.scenario.who}
                          </span>
                          <SteamText
                            text={m.text}
                            play
                            perWord={m.role === "user" ? 26 : 105}
                            layoutKey={messages.length}
                            className="max-w-[92%] text-[clamp(1rem,1.3vw,1.125rem)] leading-[1.42] font-[560] break-words text-ink [font-stretch:96%]"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {thinking || phase === "debriefing" ? (
                      <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-muted">
                        <span className="steam-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        {phase === "starting" ? L.waiting : phase === "replying" ? L.replying : L.ending}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </Mirror>

            {/* The vanity shelf: where you say your line. */}
            {phase !== "debrief" ? (
              <div className="glass-panel mt-5 rounded-[26px] p-2 sm:p-2.5">
                <form onSubmit={send} className="flex items-center gap-2">
                  <label htmlFor={inputId} className="sr-only">
                    {L.inputLabel}
                  </label>
                  <input
                    ref={inputRef}
                    id={inputId}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={L.inputPlaceholder}
                    disabled={!canType}
                    maxLength={MAX_TEXT}
                    autoComplete="off"
                    enterKeyHint="send"
                    className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-base text-ink outline-none placeholder:text-ink-muted disabled:cursor-not-allowed"
                  />
                  <Button
                    type="submit"
                    variant="ink"
                    className="shrink-0 px-4"
                    disabled={phase !== "live" || !input.trim()}
                    aria-label={L.send}
                  >
                    <span className="hidden sm:inline">{L.send}</span>
                    <ArrowUp weight="bold" aria-hidden="true" />
                  </Button>
                </form>
                {error && phase !== "idle" ? (
                  <p role="alert" className="px-4 pt-2 pb-1 text-sm font-medium text-danger">
                    {error}
                  </p>
                ) : null}
                {hasExchange || phase === "live" ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-0.5">
                    <p className="px-2 text-sm text-ink-muted">{phase === "live" ? L.inputHint : " "}</p>
                    {hasExchange ? (
                      <Button type="button" variant="outlineInk" size="sm" onClick={end} disabled={busy}>
                        {phase === "debriefing" ? (
                          <CircleNotch weight="bold" className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Stop weight="fill" aria-hidden="true" />
                        )}
                        {L.end}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === "sample" ? <p className="on-tile mt-4 text-sm text-wall-muted">{liveDemo.sampleNote}</p> : null}
          </div>
        </div>

        {/* The whole conversation for screen readers; the glass only keeps the latest lines. */}
        <div className="sr-only">
          <div role="log" aria-label="Rehearsal transcript">
            {messages.map((m) => (
              <p key={m.id}>
                {m.role === "user" ? L.you : header.scenario.who}: {m.text}
              </p>
            ))}
          </div>
          <div role="status" aria-live="polite">
            {announce}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function MoodPicker({ value, onChange }: { value: MoodId; onChange: (m: MoodId) => void }) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = moods.findIndex((m) => m.id === value);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + moods.length) % moods.length;
    onChange(moods[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="min-w-0">
      <p id={labelId} className="mb-2 text-[0.9375rem] font-semibold text-ink">
        {L.mood}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="grid grid-cols-3 gap-1 rounded-full bg-ink/[0.07] p-1"
      >
        {moods.map((m, i) => {
          const checked = m.id === value;
          return (
            <button
              key={m.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(m.id)}
              className={cn(
                "relative h-10 rounded-full text-[0.9375rem] font-semibold transition-colors duration-150",
                checked ? "text-glass" : "text-ink hover:bg-ink/[0.06]",
              )}
            >
              {checked ? (
                <motion.span
                  layoutId="mood-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
                />
              ) : null}
              <span className="relative">{m.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-ink-muted">{moods[index]?.hint}</p>
    </div>
  );
}

function DebriefView({ debrief, onAgain }: { debrief: Debrief; onAgain: () => void }) {
  const d = liveDemo.debrief;
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The transcript this replaces held focus; hand it to the debrief so keyboard and screen reader users land on it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain px-[6%] pt-[13%] pb-[6%] sm:pt-[9%]">
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-[auto_1fr]">
        <PostIt play delay={380} tilt={-4} className="h-fit w-fit px-5 pt-3 pb-4 text-center">
          <h3 ref={headingRef} tabIndex={-1} className="text-[0.95rem] font-bold focus:outline-none">
            {d.title}
          </h3>
          <p className="tnum text-[3.4rem] leading-none font-bold">
            {debrief.score}
            <span className="text-[1.3rem]"> {d.scoreOf}</span>
          </p>
        </PostIt>

        <div className="grid min-w-0 gap-6 sm:grid-cols-2">
          <DebriefList title={d.worked} items={debrief.worked} empty={null} />
          <DebriefList title={d.folded} items={debrief.folded} empty={d.none} />
        </div>
      </div>

      <PostIt play delay={620} tilt={1.5} className="mt-7 px-5 pt-4 pb-5">
        <p className="text-[1.15rem] font-bold">{d.next}</p>
        <ul className="mt-1.5 flex flex-col gap-1.5 text-[1.1rem] leading-snug">
          {debrief.next.map((line, i) => (
            <li key={i}>&ldquo;{line}&rdquo;</li>
          ))}
        </ul>
      </PostIt>

      {debrief.pattern ? (
        <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-snug font-[600] text-ink">
          <span className="text-ink-muted">{d.pattern}: </span>
          {debrief.pattern}
        </p>
      ) : null}

      <Button type="button" variant="ink" className="mt-6" onClick={onAgain}>
        <ArrowCounterClockwise weight="bold" aria-hidden="true" />
        {L.again}
      </Button>
    </div>
  );
}

function DebriefList({ title, items, empty }: { title: string; items: readonly string[]; empty: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.9375rem] font-bold text-ink">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-[0.9375rem] text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[0.9375rem] leading-snug text-ink marker:text-ink-muted">
          {items.map((item, i) => (
            <li key={i} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
