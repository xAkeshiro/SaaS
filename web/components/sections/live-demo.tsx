"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUp,
  Check,
  Info,
  Loader2,
  Minus,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { demoScenarios, liveDemo, moods, type MoodId } from "@/lib/content";
import { ease } from "@/lib/motion";
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

const ENDPOINT = "/api/rehearse";
const MAX_MESSAGES = 24;
const MAX_TEXT = 800;
const L = liveDemo.labels;
const BAR_HEIGHTS = [10, 18, 26, 32, 26, 18, 10];

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
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // After Start: side by side, hand focus to the composer; stacked (the panel
  // sits below the controls), bring the panel into view instead of opening a
  // keyboard over something the user cannot see.
  useEffect(() => {
    if (phase !== "live" || !focusRef.current) return;
    focusRef.current = false;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    } else {
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
  const canType = phase === "live" || phase === "replying";
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

  const header = session ?? { scenario: selected, mood };

  return (
    <section id="try" className="scroll-mt-28 py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={liveDemo.eyebrow} title={liveDemo.title} sub={liveDemo.sub} />
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
              {/* ---------------- Controls ---------------- */}
              <div className="flex min-w-0 flex-col gap-6">
                <fieldset className="min-w-0">
                  <legend className="eyebrow mb-3 p-0 text-muted-foreground">{L.conversation}</legend>
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
                            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out active:translate-y-px",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-lavender",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="min-w-0">
                  <label htmlFor={customId} className="eyebrow mb-3 block text-muted-foreground">
                    {L.custom}
                  </label>
                  <Textarea
                    id={customId}
                    rows={2}
                    maxLength={MAX_TEXT}
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder={L.customPlaceholder}
                    className="max-h-40 min-h-[4.5rem] resize-none rounded-xl bg-background/60 text-sm leading-relaxed"
                  />
                </div>

                <Tabs value={mood} onValueChange={(v) => setMood(v as MoodId)} className="min-w-0 gap-2">
                  <p className="eyebrow mb-1 text-muted-foreground">{L.mood}</p>
                  {/* `h-11!`: the component's own orientation variant (h-9) outranks a plain utility. */}
                  <TabsList aria-label={L.mood} className="grid h-11! w-full grid-cols-3 rounded-full bg-muted p-1">
                    {moods.map((m) => (
                      <TabsTrigger
                        key={m.id}
                        value={m.id}
                        className="h-full rounded-full text-sm transition-[background-color,color,box-shadow] duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                      >
                        {m.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {moods.map((m) => (
                    <TabsContent key={m.id} value={m.id} className="text-xs text-muted-foreground">
                      {m.hint}
                    </TabsContent>
                  ))}
                </Tabs>

                <button
                  type="button"
                  aria-pressed={voiceOn}
                  disabled={!speechSupported}
                  onClick={toggleVoice}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 px-3.5 py-2.5 text-left transition-[border-color,background-color] duration-200 hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow-sm transition-transform duration-200 ease-out",
                        voiceOn && "translate-x-4",
                      )}
                    />
                  </span>
                </button>

                <div className="flex flex-col gap-2">
                  <Button
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
              {/* On lg the panel fills the row the controls set, so a long transcript scrolls inside it instead of stretching the page. */}
              <div ref={panelRef} className="relative min-h-[380px] min-w-0 scroll-mt-24 lg:min-h-[600px]">
                <div className="flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background/60 lg:absolute lg:inset-0 lg:min-h-0">
                  {/* Persona header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-deep/60 text-foreground">
                      <UserRound className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-display text-[1.05rem] leading-tight font-semibold text-foreground">
                          {header.scenario.who}
                        </p>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-foreground/80">
                          {moods.find((m) => m.id === header.mood)?.label.toLowerCase() ?? header.mood}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{header.scenario.label}</p>
                    </div>
                    {mode ? (
                      <Badge
                        variant={mode === "live" ? "default" : "secondary"}
                        className="shrink-0 gap-1.5 px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase"
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
                      <motion.div
                        key="debrief"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease } }}
                        transition={{ duration: 0.4, ease }}
                      >
                        <DebriefView debrief={debrief} mode={mode} onAgain={start} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="transcript"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2, ease } }}
                        transition={{ duration: 0.3, ease }}
                      >
                        {mode === "sample" ? (
                          <p className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                            <Info className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="min-w-0">{liveDemo.sampleNote}</span>
                          </p>
                        ) : null}

                        {/* Log */}
                        <div
                          ref={logRef}
                          className="flex max-h-[60vh] min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:max-h-none"
                        >
                          {messages.length === 0 && !waiting ? (
                            <IdleState />
                          ) : (
                            <ul className="flex flex-col gap-2.5">
                              <AnimatePresence initial={false}>
                                {messages.map((m) => (
                                  <motion.li
                                    key={m.id}
                                    className={bubbleClass(m.role)}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                    transition={{ duration: 0.35, ease }}
                                  >
                                    <span className={tagClass(m.role)}>
                                      {m.role === "user" ? L.you : header.scenario.who}
                                    </span>
                                    {m.text}
                                  </motion.li>
                                ))}
                                {waiting ? (
                                  <motion.li
                                    key="typing"
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
                          )}
                        </div>

                        {/* Composer */}
                        <div className="border-t border-border p-3 sm:p-4">
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
                              ref={inputRef}
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
                              disabled={phase !== "live" || !input.trim()}
                              aria-label={L.send}
                            >
                              <span className="hidden sm:inline">{L.send}</span>
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </Button>
                          </form>
                          <div className="mt-2 flex min-h-8 flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {phase === "starting"
                                ? L.waiting
                                : phase === "replying"
                                  ? L.replying
                                  : phase === "debriefing"
                                    ? L.ending
                                    : phase === "live"
                                      ? L.inputHint
                                      : ""}
                            </p>
                            {hasExchange ? (
                              <Button
                                type="button"
                                variant="outline"
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
        </Reveal>

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

function IdleState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5">
        <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground">
          <Mic className="size-3.5" aria-hidden="true" />
        </span>
        <span aria-hidden="true" className="flex h-8 items-center gap-1">
          {BAR_HEIGHTS.map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-foreground/15" style={{ height: h }} />
          ))}
        </span>
      </div>
      <div>
        <p className="font-display text-base font-semibold text-foreground">{L.idleTitle}</p>
        <p className="mx-auto mt-1 max-w-[34ch] text-sm text-muted-foreground">{L.idleBody}</p>
      </div>
    </div>
  );
}

function DebriefView({
  debrief,
  mode,
  onAgain,
}: {
  debrief: Debrief;
  mode: RehearseMode | null;
  onAgain: () => void;
}) {
  const d = liveDemo.debrief;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-amber text-ink">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <h3 className="font-display text-base font-semibold text-foreground">{d.title}</h3>
          {mode === "sample" ? (
            <span className="font-mono text-[11px] text-muted-foreground">({liveDemo.badges.sample.toLowerCase()})</span>
          ) : null}
        </div>
        <p className="flex items-baseline gap-1.5 font-mono">
          <motion.span
            className="text-6xl leading-none font-semibold text-foreground tabular-nums"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
          >
            {debrief.score}
          </motion.span>
          <span className="text-sm text-muted-foreground">{d.scoreOf}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5">
        <p className="eyebrow text-amber-ink">{d.next}</p>
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {debrief.next.map((line, i) => (
            <li key={i} className="border-l-2 border-amber pl-3 text-sm leading-relaxed break-words text-foreground">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {debrief.pattern ? (
        <div className="rounded-xl bg-muted p-3.5">
          <p className="eyebrow text-muted-foreground">{d.pattern}</p>
          <p className="mt-1.5 text-sm leading-relaxed break-words text-foreground">{debrief.pattern}</p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
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
    <div className="min-w-0 rounded-xl border border-border bg-card p-3.5">
      <p className="eyebrow text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2.5 flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", iconClass)}>
                {icon}
              </span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function bubbleClass(role: Role) {
  return cn(
    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-snug break-words whitespace-pre-wrap",
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
