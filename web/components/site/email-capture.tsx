"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            {/* Holds the note's line so the block keeps its height after the swap. */}
            {note ? (
              <p aria-hidden="true" className={cn(line("note"), "invisible")}>
                {note}
              </p>
            ) : null}
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
            <div
              className={cn(
                shell,
                "transition-[box-shadow,border-color] duration-200 focus-within:ring-[3px] focus-within:ring-ring/40",
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
