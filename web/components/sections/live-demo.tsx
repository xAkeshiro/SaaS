"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import {
  ArrowUp,
  Check,
  Info,
  Loader2,
  Minus,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { demoScenarios, liveDemo, moods, type MoodId } from "@/lib/content";
import { ease, stagger } from "@/lib/motion";
import type { Debrief, RehearseMode } from "@/lib/rehearse";
import { cn, curly } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

type Role = "persona" | "user";
type Msg = { id: number; role: Role; text: string };

/** Anything on the page can load a conversation into the demo: dispatch this on `window`. */
export const REHEARSE_EVENT = "unmute:rehearse";
export type RehearseEventDetail = { id: string } | { custom: string };
type Phase = "idle" | "starting" | "live" | "replying" | "debriefing" | "debrief";
type Scenario = { id: string; label: string; who: string; setup: string; opener?: string };
type Session = { scenario: Scenario; mood: MoodId };

const ENDPOINT = "/api/rehearse";
const MAX_MESSAGES = 24;
const MAX_TEXT = 800;
const L = liveDemo.labels;
/** Settled once no scroll event has fired for this long; also covers browsers without scrollend. */
const SCROLL_IDLE_MS = 150;
/** Sample mode: every script in lib/rehearse.ts has 4 replies per mood, then its closer ends the call. */
const SAMPLE_TURNS = 5;

/**
 * Bubbles grow from the corner their tail hangs off. Your own line lands fast because you
 * just pressed Enter; theirs takes a beat longer, like someone answering.
 */
const BUBBLE_IN = {
  user: { from: "translateY(4px) scale(0.98)", duration: 0.16, origin: "100% 100%" },
  persona: { from: "translateY(8px) scale(0.97)", duration: 0.24, origin: "0% 100%" },
} as const;
const AT_REST = "translateY(0px) scale(1)";

/** Counted on the client from the visitor's own lines. "like" is left out: "I'd like a refund" is not filler. */
const SORRY_RE = /\b(sorry|apologi[sz]e|apologies)\b/gi;
const FILLER_RE = /\b(um+|uh+|erm|i mean|kind of|sort of|basically|literally|just)\b/gi;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
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

async function readStream(res: Response, onChunk: (text: string) => void) {
  if (!res.body) {
    onChunk(await res.text());
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  const tail = decoder.decode();
  if (tail) onChunk(tail);
}

function toWire(messages: Msg[]) {
  return messages.slice(-MAX_MESSAGES).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT) }));
}

function countIn(lines: readonly string[], re: RegExp) {
  return lines.reduce((n, line) => n + (line.match(re)?.length ?? 0), 0);
}

/** Persona replies after the opener, counted the way the server's sampleReply counts them. */
function personaReplies(list: readonly Msg[]) {
  return list.filter((m, i) => m.role === "persona" && i > 0).length;
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
  /** The chip a scenario card just picked; `n` replays the ring on a repeat pick. */
  const [pulse, setPulse] = useState<{ id: string; n: number } | null>(null);

  const idRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const voiceRef = useRef(voiceOn);
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLTextAreaElement>(null);
  const focusRef = useRef(false);
  const pulseRef = useRef(0);
  const settleRef = useRef<(() => void) | null>(null);

  // A scenario picked elsewhere on the page (the scenario cards) lands here, ready to start.
  useEffect(() => {
    function cancelSettle() {
      settleRef.current?.();
      settleRef.current = null;
    }

    function onRehearse(e: Event) {
      const detail = (e as CustomEvent<RehearseEventDetail>).detail;
      if (!detail) return;
      const picked = "id" in detail ? demoScenarios.find((s) => s.id === detail.id)?.id : undefined;
      if ("id" in detail) {
        setScenarioId(detail.id);
        setCustom("");
      } else {
        setCustom(detail.custom);
      }
      // Land on the panel itself, so the chosen conversation and the next control are both in view.
      document.getElementById("try-panel")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      // A preset is ready to go, so Start takes focus; a custom prompt is a draft to edit first.
      if ("id" in detail) startRef.current?.focus({ preventScroll: true });
      else customRef.current?.focus({ preventScroll: true });

      // The chip changed while it was off screen. Mark it once the scroll has landed, so the eye finds it.
      cancelSettle();
      if (reduce || !picked) return;
      const settled = () => {
        cancelSettle();
        pulseRef.current += 1;
        setPulse({ id: picked, n: pulseRef.current });
      };
      // A fixed fallback fired mid-scroll on long jumps, so the ring had faded before the panel landed.
      let timer = window.setTimeout(settled, SCROLL_IDLE_MS);
      const onScroll = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(settled, SCROLL_IDLE_MS);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scrollend", settled, { once: true });
      settleRef.current = () => {
        window.clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", settled);
      };
    }

    window.addEventListener(REHEARSE_EVENT, onRehearse);
    return () => {
      window.removeEventListener(REHEARSE_EVENT, onRehearse);
      cancelSettle();
    };
  }, [reduce]);

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

  // After Start: side by side, hand focus to the composer; stacked (the panel
  // sits below the controls), bring the panel into view instead of opening a
  // keyboard over something the user cannot see.
  useEffect(() => {
    if (phase !== "live" || !focusRef.current) return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      const el = inputRef.current;
      // After a debrief the transcript is still mounting behind its exit; the Input's ref focuses it then.
      if (!el) return;
      focusRef.current = false;
      el.focus({ preventScroll: true });
    } else {
      focusRef.current = false;
      panelRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [phase, session, reduce]);

  // Keep the newest line in view.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, phase, reduce]);

  // The prefix keeps the whole setup inside the API's 800-char cap.
  const customText = custom.trim().slice(0, MAX_TEXT - L.customSetup.length - 1);
  const preset = demoScenarios.find((s) => s.id === scenarioId) ?? demoScenarios[0];
  const selected: Scenario = customText
    ? { id: "custom", label: L.customLabel, who: L.customWho, setup: `${L.customSetup} ${customText}` }
    : preset;

  const busy = phase === "starting" || phase === "replying" || phase === "debriefing";
  // Sample mode: once the closer lands the script is over, so the call has ended and only End remains.
  const scriptEnded =
    mode === "sample" &&
    personaReplies(messages) >= SAMPLE_TURNS &&
    messages[messages.length - 1]?.role === "persona";
  const canType = (phase === "live" || phase === "replying") && !scriptEnded;
  const hasExchange = messages.some((m) => m.role === "user");
  const waiting =
    (phase === "starting" || phase === "replying") && messages[messages.length - 1]?.role !== "persona";

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

  /** Streams the persona's next line into a new bubble and returns the full text. */
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

    const id = nextId();
    let full = "";
    let shown = false;
    await readStream(res, (chunk) => {
      full += chunk;
      const piece = shown ? chunk : chunk.trimStart();
      if (!piece) return;
      if (!shown) {
        shown = true;
        setMessages((prev) => [...prev, { id, role: "persona", text: piece }]);
      } else {
        setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, text: msg.text + piece } : msg)));
      }
    });

    const text = full.trim();
    if (!text) {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      throw new Error(liveDemo.errors.reply);
    }
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, text } : msg)));
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
      focusRef.current = true;
      setPhase("live");
      speak(opener);
      // Learn the mode without spending a turn.
      fetch(ENDPOINT, { cache: "no-store", signal: controller.signal })
        .then((res) => {
          const m = readMode(res);
          if (m) setMode(m);
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
    // Past the closer the script has nothing left; a request would only repeat it.
    if (mode === "sample" && personaReplies(messages) >= SAMPLE_TURNS) return;

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

  function pickScenario(id: string) {
    setScenarioId(id);
    setCustom("");
  }

  function changeMood(next: MoodId) {
    setMood(next);
    // Mid-run, the switch applies to the next reply, so the header pill and the control agree.
    if (phase === "starting" || phase === "live" || phase === "replying") {
      setSession((s) => (s ? { ...s, mood: next } : s));
    }
  }

  /** Desktop: after Start, focus the composer as soon as it mounts (after a debrief it mounts late). */
  function attachInput(el: HTMLInputElement | null) {
    inputRef.current = el;
    if (el && focusRef.current && window.matchMedia("(min-width: 1024px)").matches) {
      focusRef.current = false;
      el.focus({ preventScroll: true });
    }
  }

  const idle = messages.length === 0 && !waiting;
  // While the pane is empty the header previews the current pick; a transcript or debrief keeps its own run's names.
  const header = (phase === "idle" && idle) || !session ? { scenario: selected, mood } : session;
  const userLines = messages.filter((m) => m.role === "user").map((m) => m.text);

  return (
    // Short top gap: Scenarios above hands off straight into the demo (its own bottom is pb-12).
    <section id="try" className="scroll-mt-28 pt-12 pb-20 md:pb-24">
      <Container>
        <SectionHeading title={liveDemo.title} sub={liveDemo.sub} />

        {/* Shadow only: a border under a wide soft shadow declares the elevation twice. */}
        <div className="mt-14">
          <div id="try-panel" className="scroll-mt-24 rounded-3xl bg-card p-4 shadow-soft md:p-6">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
              {/* ---------------- Controls ---------------- */}
              <div className="flex min-w-0 flex-col gap-6">
                <fieldset className="min-w-0">
                  <legend className="mb-2 block p-0 text-sm font-medium text-foreground">{L.conversation}</legend>
                  <div className="flex flex-wrap gap-2">
                    {demoScenarios.map((s) => {
                      const active = !customText && s.id === scenarioId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => pickScenario(s.id)}
                          className={cn(
                            // Focus uses the global outline; `active:scale` sets `scale`, so that is what transitions.
                            "relative min-h-11 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] lg:min-h-0",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-lavender",
                          )}
                        >
                          {pulse?.id === s.id ? (
                            <motion.span
                              key={pulse.n}
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber"
                              initial={{ opacity: 0.9, transform: "scale(1)" }}
                              animate={{ opacity: 0, transform: "scale(1.12)" }}
                              transition={{ duration: 0.5, ease }}
                              onAnimationComplete={() => setPulse(null)}
                            />
                          ) : null}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="min-w-0">
                  <label htmlFor={customId} className="mb-2 block text-sm font-medium text-foreground">
                    {L.custom}
                  </label>
                  <Textarea
                    ref={customRef}
                    id={customId}
                    rows={2}
                    maxLength={MAX_TEXT}
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder={L.customPlaceholder}
                    className="max-h-40 min-h-[4.5rem] resize-none rounded-xl bg-card text-sm leading-relaxed"
                  />
                </div>

                <Tabs value={mood} onValueChange={(v) => changeMood(v as MoodId)} className="min-w-0 gap-0">
                  <p className="mb-2 block text-sm font-medium text-foreground">{L.mood}</p>
                  {/* `!`: the component's own orientation variant (h-9) outranks a plain utility. h-13 gives 44px segments on touch. */}
                  <TabsList
                    aria-label={L.mood}
                    className="grid h-13! w-full grid-cols-3 rounded-full bg-muted p-1 md:h-11!"
                  >
                    {moods.map((m) => (
                      <TabsTrigger
                        key={m.id}
                        value={m.id}
                        className="h-full rounded-full text-sm transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97] data-[state=active]:bg-transparent data-[state=active]:text-primary-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none"
                      >
                        {/* One pill slides between segments, so there is never a half-dark pill on each side mid-change. */}
                        {mood === m.id ? (
                          <motion.span
                            layoutId="mood-pill"
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-primary shadow-sm"
                            transition={{ duration: 0.25, ease }}
                          />
                        ) : null}
                        <span className="relative">{m.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {/* Each panel stays a Radix TabsContent so the triggers' aria-controls resolve; it remounts per switch. */}
                  {/* It is also a Tab stop, so it restores the global focus outline that the component turns off. */}
                  {moods.map((m) => (
                    <TabsContent
                      key={m.id}
                      value={m.id}
                      className="mt-2 rounded-sm text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
                    >
                      <motion.p
                        initial={{ opacity: 0, filter: "blur(2px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.2, ease }}
                      >
                        {m.hint}
                      </motion.p>
                    </TabsContent>
                  ))}
                </Tabs>

                <button
                  type="button"
                  aria-pressed={voiceOn}
                  disabled={!speechSupported}
                  onClick={toggleVoice}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left transition-[border-color,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-foreground/20 motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                      {voiceOn ? (
                        <Volume2 className="size-4" aria-hidden="true" />
                      ) : (
                        <VolumeX className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{L.voice}</span>
                      {!speechSupported ? (
                        <span className="block text-xs text-muted-foreground">{L.voiceUnavailable}</span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
                      voiceOn ? "bg-primary" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        voiceOn && "translate-x-4",
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
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Play className="size-4" aria-hidden="true" />
                    )}
                    {phase === "starting" ? L.starting : phase === "live" || phase === "replying" ? L.restart : L.start}
                  </Button>
                  {error && phase === "idle" ? (
                    <p role="alert" className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* ---------------- Transcript / debrief ---------------- */}
              {/* One card: the pane is a plain fill inside it, not a second bordered box. */}
              {/* On lg the pane fills the row the controls set, so a long transcript scrolls inside it instead of stretching the page. */}
              <div ref={panelRef} className="relative min-h-[380px] min-w-0 scroll-mt-24 lg:min-h-[600px]">
                <div className="flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-xl bg-muted/40 lg:absolute lg:inset-0 lg:min-h-0">
                  {/* Persona header */}
                  <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-deep/60 text-foreground">
                      <UserRound className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {/* Wraps instead of truncating: on phones most names would lose their end. */}
                        <p className="line-clamp-2 font-display text-[1.05rem] leading-tight font-semibold text-foreground">
                          {header.scenario.who}
                        </p>
                        <span className="rounded-full bg-lavender/70 px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                          {moods.find((m) => m.id === header.mood)?.label ?? header.mood}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{header.scenario.label}</p>
                    </div>
                    {mode ? (
                      <Badge
                        variant={mode === "live" ? "default" : "secondary"}
                        className={cn("shrink-0 gap-1.5 px-2.5 py-1", mode === "sample" && "bg-lavender/70")}
                      >
                        <span
                          aria-hidden="true"
                          className={cn("size-1.5 rounded-full", mode === "live" ? "bg-amber" : "bg-foreground/40")}
                        />
                        {mode === "live" ? liveDemo.badges.live : liveDemo.badges.sample}
                      </Badge>
                    ) : null}
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "debrief" && debrief ? (
                      // Opacity only: the blocks inside carry the movement, so the two do not stack.
                      <motion.div
                        key="debrief"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15, ease } }}
                        transition={{ duration: 0.2, ease }}
                      >
                        <DebriefView debrief={debrief} mode={mode} userLines={userLines} onAgain={start} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="transcript"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15, ease } }}
                        transition={{ duration: 0.2, ease }}
                      >
                        {mode === "sample" ? (
                          <p className="flex items-center gap-1.5 px-4 pt-3 text-xs text-muted-foreground">
                            <Info className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="min-w-0">{liveDemo.sampleNote}</span>
                          </p>
                        ) : null}

                        {/* Log. The list stays mounted, so the first real line animates in where the preview sat. */}
                        {/* The 1rem top fade equals the padding, so only lines scrolled up under the note fade. */}
                        <div
                          ref={logRef}
                          className="flex max-h-[60vh] min-h-0 flex-1 flex-col overflow-y-auto p-4 [mask-image:linear-gradient(to_bottom,transparent,#000_1rem)] lg:max-h-none"
                        >
                          {/* popLayout takes the exiting typing dots out of the flow, so a reply lands in their slot instead of below and then jumping. */}
                          <ul className="relative flex flex-col gap-2.5">
                            <AnimatePresence initial={false} mode="popLayout">
                              {messages.map((m) => (
                                <motion.li
                                  key={m.id}
                                  className={bubbleClass(m.role)}
                                  style={{ transformOrigin: BUBBLE_IN[m.role].origin }}
                                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: BUBBLE_IN[m.role].from }}
                                  animate={reduce ? { opacity: 1 } : { opacity: 1, transform: AT_REST }}
                                  exit={{ opacity: 0, transition: { duration: 0.12, ease } }}
                                  transition={{ duration: BUBBLE_IN[m.role].duration, ease }}
                                >
                                  <span className={tagClass(m.role)}>
                                    {m.role === "user" ? L.you : header.scenario.who}
                                  </span>
                                  {curly(m.text)}
                                </motion.li>
                              ))}
                              {waiting ? (
                                <motion.li
                                  key="typing"
                                  aria-hidden="true"
                                  className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-card px-3.5 py-3 shadow-xs"
                                  style={{ transformOrigin: BUBBLE_IN.persona.origin }}
                                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: BUBBLE_IN.persona.from }}
                                  animate={reduce ? { opacity: 1 } : { opacity: 1, transform: AT_REST }}
                                  exit={{ opacity: 0, transition: { duration: 0.12, ease } }}
                                  transition={{ duration: BUBBLE_IN.persona.duration, ease }}
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
                          {idle ? <IdlePreview scenario={selected} /> : null}
                        </div>

                        {/* Composer */}
                        <div className="border-t border-border/70 p-3 sm:p-4">
                          {error && phase !== "idle" ? (
                            <p role="alert" className="mb-2 text-xs text-destructive">
                              {error}
                            </p>
                          ) : null}
                          <form onSubmit={send} className="flex items-center gap-2">
                            <label htmlFor={inputId} className="sr-only">
                              {L.inputLabel}
                            </label>
                            <Input
                              ref={attachInput}
                              id={inputId}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder={L.inputPlaceholder}
                              disabled={!canType}
                              maxLength={MAX_TEXT}
                              autoComplete="off"
                              enterKeyHint="send"
                              className="h-11 min-w-0 flex-1 rounded-full bg-card px-4"
                            />
                            <Button
                              type="submit"
                              size="default"
                              className="h-11 shrink-0 px-4"
                              disabled={phase !== "live" || !input.trim() || scriptEnded}
                              aria-label={L.send}
                            >
                              <span className="hidden sm:inline">{L.send}</span>
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </Button>
                          </form>
                          <div className="mt-2 flex min-h-8 flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {/* Enter is held while they reply; with a line typed ahead, say so instead of swallowing it. */}
                              {phase === "starting"
                                ? L.waiting
                                : phase === "replying"
                                  ? input.trim()
                                    ? L.replyingHeld
                                    : L.replying
                                  : phase === "debriefing"
                                    ? L.ending
                                    : phase === "live"
                                      ? scriptEnded
                                        ? L.scriptEnd
                                        : L.inputHint
                                      : ""}
                            </p>
                            {/* Once the script has ended, End is the only way forward, so it takes the filled style. */}
                            {hasExchange ? (
                              <Button
                                type="button"
                                variant={scriptEnded ? "default" : "outline"}
                                size="sm"
                                onClick={end}
                                disabled={busy}
                                className="shrink-0"
                              >
                                {phase === "debriefing" ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Square className="size-3.5" aria-hidden="true" />
                                )}
                                {L.end}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed persona lines are announced once, not on every streamed chunk. */}
        <div role="status" aria-live="polite" className="sr-only">
          {announce}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/**
 * Before Start: the pick's opening line where the real one will land, so the pane previews the
 * conversation instead of sitting empty. A dashed outline, not fading, marks it as a preview, so
 * the text keeps full contrast. A custom setup has no fixed opener.
 */
function IdlePreview({ scenario }: { scenario: Scenario }) {
  return (
    <div className="flex flex-1 flex-col">
      {scenario.opener ? (
        <div className="relative flex flex-col">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={scenario.id}
              className={cn(bubbleClass("persona"), "border border-dashed border-foreground/25 shadow-none")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease } }}
              transition={{ duration: 0.2, ease }}
            >
              <span className={tagClass("persona")}>{scenario.who}</span>
              {scenario.opener}
            </motion.p>
          </AnimatePresence>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="font-display text-base font-semibold text-foreground">{L.idleTitle}</p>
        <p className="mx-auto mt-1 max-w-[34ch] text-sm text-muted-foreground">{L.idleBody}</p>
      </div>
    </div>
  );
}

function DebriefView({
  debrief,
  mode,
  userLines,
  onAgain,
}: {
  debrief: Debrief;
  mode: RehearseMode | null;
  /** The visitor's own lines: the counted rows come from these, not from the model. */
  userLines: readonly string[];
  onAgain: () => void;
}) {
  const d = liveDemo.debrief;
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The transcript this replaces held focus; hand it to the debrief so keyboard and screen reader users land on it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // The payoff arrives in reading order instead of as one slab. Reduced motion keeps the fade, drops the rise.
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3, ease } } }
    : {
        hidden: { opacity: 0, transform: "translateY(8px)" },
        show: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.3, ease } },
      };
  const metrics = [
    { label: d.metrics.sorry, value: countIn(userLines, SORRY_RE) },
    { label: d.metrics.filler, value: countIn(userLines, FILLER_RE) },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
       * On lg the debrief outgrows its fixed pane, and the scrollbar is an overlay: the bottom fade says
       * there is more, and pb-8 means nothing real is still faded once you reach the end.
       */}
      <motion.div
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 pb-8 [mask-image:linear-gradient(to_bottom,#000_calc(100%_-_2rem),transparent)] sm:p-5 sm:pb-8"
        variants={stagger(0.06, 0.05)}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-amber text-ink">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            <h3 ref={headingRef} tabIndex={-1} className="font-display text-base font-semibold text-foreground focus:outline-none">
              {d.title}
            </h3>
          </div>
          <motion.p
            className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-sm font-semibold text-foreground tabular-nums"
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
            transition={
              reduce ? { duration: 0.2, ease, delay: 0.1 } : { type: "spring", duration: 0.5, bounce: 0.2, delay: 0.1 }
            }
          >
            {debrief.score} <span className="font-medium text-muted-foreground">{d.scoreOf}</span>
          </motion.p>
        </motion.div>

        {/* A scripted debrief quotes lines the visitor may never have typed, so it says so up front. */}
        {mode === "sample" ? (
          <motion.p variants={item} className="-mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{d.sampleNote}</span>
          </motion.p>
        ) : null}

        {/* The product's core output leads: the two lines to say next time, in your voice. */}
        <motion.div variants={item}>
          <p className="text-sm font-medium text-amber-ink">{d.next}</p>
          <ul className="mt-2.5 flex flex-col items-end gap-2">
            {debrief.next.map((line, i) => (
              <li
                key={i}
                className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-base leading-snug break-words text-primary-foreground"
              >
                {curly(line)}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.dl variants={item} className="divide-y divide-border/70 border-t border-border/70">
          {metrics.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="min-w-0 text-sm text-muted-foreground">{row.label}</dt>
              <dd className="shrink-0 text-[0.95rem] font-semibold text-foreground tabular-nums">{row.value}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div variants={item} className="grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
          <DebriefList
            title={d.worked}
            items={debrief.worked}
            empty={null}
            icon={<Check className="size-3 text-amber-ink" strokeWidth={2.5} aria-hidden="true" />}
            iconClass="bg-amber/25"
          />
          <DebriefList
            title={d.folded}
            items={debrief.folded}
            empty={d.none}
            icon={<Minus className="size-3 text-muted-foreground" strokeWidth={2.5} aria-hidden="true" />}
            iconClass="bg-muted"
          />
        </motion.div>

        {debrief.pattern ? (
          <motion.div variants={item} className="border-t border-border/70 pt-4">
            <p className="text-sm font-medium text-foreground">{d.pattern}</p>
            <p className="mt-1.5 text-sm leading-relaxed break-words text-foreground">{curly(debrief.pattern)}</p>
          </motion.div>
        ) : null}
      </motion.div>

      {/* Pinned under the scroller like the composer, so the debrief's one action is always in view. */}
      <div className="shrink-0 border-t border-border/70 p-3 sm:p-4">
        <Button type="button" onClick={onAgain}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {L.again}
        </Button>
      </div>
    </div>
  );
}

function DebriefList({
  title,
  items,
  empty,
  icon,
  iconClass,
}: {
  title: string;
  items: readonly string[];
  empty: string | null;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2.5 flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", iconClass)}>
                {icon}
              </span>
              <span className="min-w-0 break-words">{curly(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** On the pane's muted fill, their bubbles are white so they still read as a surface. */
function bubbleClass(role: Role) {
  return cn(
    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-snug break-words whitespace-pre-wrap",
    role === "user"
      ? "self-end rounded-br-md bg-primary text-primary-foreground"
      : "self-start rounded-bl-md bg-card text-foreground shadow-xs",
  );
}

function tagClass(role: Role) {
  return cn(
    "mb-0.5 block text-xs font-medium",
    role === "user" ? "text-primary-foreground/60" : "text-muted-foreground",
  );
}
