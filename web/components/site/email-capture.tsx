"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function EmailCapture({
  source,
  buttonLabel = "Get early access",
  placeholder = "you@school.edu",
  note,
  inverted = false,
  className,
  size = "lg",
}: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.status === "loading") return;
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
      setState({ status: "done", message: "You’re on the list. One email when it launches." });
    } catch {
      setState({ status: "error", message: "Network hiccup. Try again." });
    }
  }

  if (state.status === "done") {
    return (
      <div
        role="status"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium",
          inverted ? "border-white/15 bg-white/10 text-white" : "border-border bg-card text-foreground",
          className,
        )}
      >
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber text-ink">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        {state.message}
      </div>
    );
  }

  const h = size === "lg" ? "h-12" : "h-10";

  return (
    <form onSubmit={onSubmit} className={cn("flex w-full max-w-md flex-col gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border p-1 pl-4 transition-[box-shadow,border-color] duration-200 focus-within:ring-[3px] focus-within:ring-ring/40",
          inverted ? "border-white/15 bg-white/10" : "border-border bg-card shadow-soft",
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
          className={cn(size === "lg" && "h-10 px-4")}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>{buttonLabel}</span>
          {state.status !== "loading" ? <ArrowRight className="size-4" /> : null}
        </Button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className={cn("px-4 text-xs", inverted ? "text-amber" : "text-destructive")}>
          {state.message}
        </p>
      ) : note ? (
        <p className={cn("px-4 text-xs", inverted ? "text-white/60" : "text-muted-foreground")}>{note}</p>
      ) : null}
    </form>
  );
}
