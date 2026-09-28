"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CtaArrow } from "@/components/site/cta-arrow";
import { PostIt } from "@/components/world/post-it";
import { waitlist } from "@/lib/content";
import { cn } from "@/lib/utils";

type Props = {
  /** Where the signup came from, sent to the API for segmentation. */
  source: string;
  buttonLabel?: string;
  note?: string;
  className?: string;
};

type State = { status: "idle" | "loading" | "done" | "error"; message?: string };

/** The waitlist: a strip of clear glass for your address and the one amber switch. */
export function EmailCapture({ source, buttonLabel = waitlist.button, note, className }: Props) {
  const id = useId();
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
        setState({ status: "error", message: data.error ?? waitlist.errors.generic });
        return;
      }
      setState({ status: "done" });
    } catch {
      setState({ status: "error", message: waitlist.errors.network });
    }
  }

  if (state.status === "done") {
    return (
      <div role="status" className={cn("pt-2", className)}>
        <PostIt play delay={0} tilt={-2.5} className="inline-block max-w-[19rem] px-5 pt-4 pb-5">
          <p className="text-[1.35rem] leading-tight font-bold">{waitlist.done.title}</p>
          <p className="mt-1 text-[1.05rem] leading-snug">{waitlist.done.body}</p>
        </PostIt>
      </div>
    );
  }

  const describedBy = state.status === "error" ? `${id}-error` : note ? `${id}-note` : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className={cn("w-full max-w-[30rem]", className)}>
      {/* One glass strip holding the field and the switch; on narrow phones they stack. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1.5 sm:rounded-full sm:bg-glass sm:p-1.5 sm:pl-5 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_30px_-16px_rgba(2,24,18,0.85)] sm:focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_0_0_3px_rgba(255,180,84,0.9),0_14px_30px_-16px_rgba(2,24,18,0.85)]">
        <label htmlFor={`${id}-email`} className="sr-only">
          {waitlist.label}
        </label>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={waitlist.placeholder}
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={describedBy}
          className="h-13 w-full min-w-0 rounded-full bg-glass px-5 text-base text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_26px_-16px_rgba(2,24,18,0.85)] outline-none [--focus:var(--wall)] placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber sm:h-11 sm:flex-1 sm:rounded-none sm:bg-transparent sm:px-0 sm:shadow-none sm:focus-visible:outline-none"
        />
        <Button type="submit" size="md" className="h-13 justify-between pr-1.5 pl-5 sm:h-11 sm:justify-center" disabled={state.status === "loading"}>
          <span>{buttonLabel}</span>
          {state.status === "loading" ? (
            <span aria-hidden="true" className="grid size-8 place-items-center">
              <CircleNotch weight="bold" className="size-4 animate-spin" />
            </span>
          ) : (
            <CtaArrow />
          )}
        </Button>
      </div>
      {state.status === "error" ? (
        <p id={`${id}-error`} role="alert" className="mt-2.5 px-5 text-sm font-medium text-danger-on-wall">
          {state.message}
        </p>
      ) : note ? (
        <p id={`${id}-note`} className="mt-2.5 px-5 text-sm text-wall-muted">
          {note}
        </p>
      ) : null}
    </form>
  );
}
