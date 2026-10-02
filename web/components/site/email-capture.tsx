"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { betaOptIn } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  /** Where the signup came from, sent to the API for segmentation. */
  source: string;
  buttonLabel?: string;
  placeholder?: string;
  note?: string;
  /** Use on dark bands. */
  inverted?: boolean;
  className?: string;
  size?: "default" | "lg";
};

type State = { status: "idle" | "loading" | "done" | "error"; message?: string };

const DONE_MESSAGE = "You’re on the list. One email when it launches.";

/** The slot's two icons crossfade through a light blur instead of swapping, so nothing jumps. */
const iconSwap = "absolute inset-0 size-4 transition-[opacity,filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";

export function EmailCapture({
  source,
  buttonLabel = "Get early access",
  placeholder = "you@school.edu",
  note,
  inverted = false,
  className,
  size = "lg",
}: Props) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const loading = state.status === "loading";
  const done = state.status === "done";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // This guard, not `disabled`, blocks double submits: a disabled button would flash to half opacity.
    if (loading) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong. Try again." });
        return;
      }
      setState({ status: "done", message: DONE_MESSAGE });
    } catch {
      setState({ status: "error", message: "Network hiccup. Try again." });
    }
  }

  const h = size === "lg" ? "h-12" : "h-10";
  // The form row and the success pill share one shell, so the swap keeps the row's size.
  const shell = cn(
    "flex items-center gap-1 rounded-full border p-1 pl-4",
    inverted ? "border-white/15 bg-white/10" : "border-border bg-card",
  );
  const line = (tone: "note" | "error") =>
    cn(
      "px-4 text-xs",
      tone === "error" ? (inverted ? "text-amber" : "text-destructive") : inverted ? "text-white/60" : "text-muted-foreground",
    );

  return (
    // `relative`: popLayout lifts the leaving form out of flow and positions it against this wrapper.
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Always mounted, so screen readers reliably announce the result when it changes. */}
      <p role="status" className="sr-only">
        {done ? state.message : ""}
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        {done ? (
          <motion.div
            key="done"
            className="flex flex-col gap-2"
            initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)", filter: "blur(2px)" }}
            animate={{ opacity: 1, transform: reduce ? "none" : "scale(1)", filter: "blur(0px)" }}
            // Scale springs; opacity and blur tween so a bounce can never overshoot them.
            transition={{
              type: "spring",
              duration: 0.4,
              bounce: 0.2,
              opacity: { duration: 0.2, ease },
              filter: { duration: 0.2, ease },
            }}
          >
            <div className={cn(shell, "pr-4")}>
              <div
                className={cn(
                  "flex min-w-0 items-center gap-2.5 text-left text-sm leading-snug font-medium",
                  h,
                  inverted ? "text-white" : "text-foreground",
                )}
              >
                <motion.span
                  aria-hidden="true"
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-amber text-ink"
                  initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.6)" }}
                  animate={{ opacity: 1, transform: reduce ? "none" : "scale(1)" }}
                  transition={{ type: "spring", duration: 0.35, bounce: 0.3, delay: 0.1 }}
                >
                  <Check className="size-3.5" />
                </motion.span>
                <span className="min-w-0">{state.message}</span>
              </div>
            </div>
            {/* A separate yes for the private beta: joining the list alone still means one email at launch. */}
            <BetaStep email={email} source={source} inverted={inverted} />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            className="flex flex-col gap-2"
            exit={{
              opacity: 0,
              filter: "blur(2px)",
              transform: reduce ? "none" : "scale(0.98)",
              transition: { duration: 0.15, ease },
            }}
          >
            {/* The input has no outline of its own, so the shell's solid 2px ring is its focus mark (3:1 or better). */}
            <div
              className={cn(
                shell,
                "transition-[box-shadow,border-color] duration-200 focus-within:ring-2 focus-within:ring-ring",
              )}
            >
              <label htmlFor={`email-${source}`} className="sr-only">
                Email address
              </label>
              <input
                id={`email-${source}`}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                readOnly={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  "min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none",
                  h,
                  inverted ? "text-white placeholder:text-white/50" : "text-foreground placeholder:text-muted-foreground",
                )}
              />
              <Button
                type="submit"
                size={size === "lg" ? "default" : "sm"}
                variant={inverted ? "accent" : "default"}
                aria-busy={loading || undefined}
                className={cn("px-4", size === "lg" && "h-10", loading && "cursor-wait")}
              >
                <span>{buttonLabel}</span>
                {/* One fixed slot: the arrow becomes a spinner without moving the label. */}
                <span aria-hidden="true" className="relative size-4">
                  <ArrowRight className={cn(iconSwap, loading && "opacity-0 blur-[2px]")} />
                  <Loader2 className={cn(iconSwap, loading ? "animate-spin" : "opacity-0 blur-[2px]")} />
                </span>
              </Button>
            </div>
            {state.status === "error" ? (
              <p role="alert" className={line("error")}>
                {state.message}
              </p>
            ) : note ? (
              <p className={line("note")}>{note}</p>
            ) : null}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * After someone joins: an optional, separate opt-in to the private beta, with their campus, since the
 * beta opens one campus at a time. It updates the same waitlist row by email.
 */
function BetaStep({ email, source, inverted }: { email: string; source: string; inverted: boolean }) {
  const reduce = useReducedMotion();
  const [campus, setCampus] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const loading = state.status === "loading";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source, campus, beta: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setState(
        res.ok && data.ok
          ? { status: "done", message: betaOptIn.done }
          : { status: "error", message: data.error ?? betaOptIn.error },
      );
    } catch {
      setState({ status: "error", message: betaOptIn.error });
    }
  }

  const muted = inverted ? "text-white/70" : "text-muted-foreground";

  if (state.status === "done") {
    return (
      <motion.p
        role="status"
        className={cn("flex items-start gap-2 px-4 text-left text-xs leading-relaxed", muted)}
        initial={{ opacity: 0, transform: reduce ? "none" : "translateY(4px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.2, ease }}
      >
        <Check className="mt-0.5 size-3.5 shrink-0 text-amber" aria-hidden="true" />
        <span>{state.message}</span>
      </motion.p>
    );
  }

  const fieldId = `beta-campus-${source}`;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 text-left">
      <p className={cn("px-4 text-xs leading-relaxed", muted)}>{betaOptIn.prompt}</p>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border p-1 pl-4 transition-[box-shadow,border-color] duration-200 focus-within:ring-2 focus-within:ring-ring",
          inverted ? "border-white/15 bg-white/10" : "border-border bg-card",
        )}
      >
        <label htmlFor={fieldId} className="sr-only">
          {betaOptIn.campusLabel}
        </label>
        <input
          id={fieldId}
          required
          maxLength={120}
          autoComplete="organization"
          value={campus}
          readOnly={loading}
          onChange={(e) => setCampus(e.target.value)}
          placeholder={betaOptIn.campusPlaceholder}
          className={cn(
            "h-9 min-w-0 flex-1 bg-transparent text-sm outline-none",
            inverted ? "text-white placeholder:text-white/50" : "text-foreground placeholder:text-muted-foreground",
          )}
        />
        <Button
          type="submit"
          size="sm"
          variant={inverted ? "accent" : "outline"}
          aria-busy={loading || undefined}
          className={cn("shrink-0 px-3.5", loading && "cursor-wait")}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {loading ? betaOptIn.sending : betaOptIn.cta}
        </Button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className={cn("px-4 text-xs", inverted ? "text-amber" : "text-destructive")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
