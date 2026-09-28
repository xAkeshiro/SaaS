"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { teams, teamsExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type FieldId = (typeof teams.form.fields)[number]["id"];
type Values = Record<FieldId | "notes", string>;
type State = { status: "idle" | "loading" | "done" | "error"; message?: string };

const EMPTY: Values = { name: "", email: "", org: "", seats: "", notes: "" };

const REQUIRED: ReadonlySet<FieldId> = new Set(["name", "email"]);

const AUTOCOMPLETE: Record<FieldId, string> = {
  name: "name",
  email: "email",
  org: "organization",
  seats: "off",
};

const INPUT_MODE: Partial<Record<FieldId, "email" | "numeric">> = {
  email: "email",
  seats: "numeric",
};

const fieldClass =
  "h-11 rounded-xl border-border bg-background/60 px-3.5 text-base shadow-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-foreground/25 focus-visible:bg-card md:text-[0.95rem]";

const cardClass = "rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8";

const { form } = teamsExtras;

/**
 * Campus / team pilot request. Posts to `/api/waitlist` with `source: "teams"`
 * and follows the same loading / done / error pattern as `EmailCapture`.
 */
export function PilotForm({ className }: { className?: string }) {
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [state, setState] = useState<State>({ status: "idle" });
  const doneRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation so screen readers and keyboard users land on it.
  useEffect(() => {
    if (state.status === "done") doneRef.current?.focus();
  }, [state.status]);

  function update(id: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "loading") return;
    const email = values.email.trim();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source: "teams",
          name: values.name.trim(),
          org: values.org.trim(),
          seats: values.seats.trim(),
          notes: values.notes.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setState({ status: "error", message: data.error ?? form.errors.generic });
        return;
      }
      setState({ status: "done", message: email });
    } catch {
      setState({ status: "error", message: form.errors.network });
    }
  }

  if (state.status === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className={cn(cardClass, "flex flex-col items-start gap-6 outline-none animate-in fade-in zoom-in-95 duration-300", className)}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-amber text-ink">
          <Check className="size-5" strokeWidth={3} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-snug font-semibold text-foreground">{form.success.title}</h3>
          <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-muted-foreground">{form.success.body}</p>
        </div>
        <p className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{form.success.emailLabel}</span>
          <span className="min-w-0 font-mono text-foreground break-all">{state.message}</span>
        </p>
      </div>
    );
  }

  const loading = state.status === "loading";

  return (
    <form onSubmit={onSubmit} aria-busy={loading} className={cn(cardClass, className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        {teams.form.fields.map((field) => {
          const id = `${uid}-${field.id}`;
          return (
            <div key={field.id} className="flex min-w-0 flex-col gap-2">
              <label htmlFor={id} className="text-sm font-medium text-foreground">
                {field.label}
              </label>
              <Input
                id={id}
                name={field.id}
                type={field.type}
                value={values[field.id]}
                onChange={(e) => update(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={REQUIRED.has(field.id)}
                autoComplete={AUTOCOMPLETE[field.id]}
                inputMode={INPUT_MODE[field.id]}
                maxLength={500}
                className={fieldClass}
              />
            </div>
          );
        })}

        <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${uid}-${form.notes.id}`} className="text-sm font-medium text-foreground">
            {form.notes.label}
          </label>
          <Textarea
            id={`${uid}-${form.notes.id}`}
            name={form.notes.id}
            rows={4}
            value={values.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder={form.notes.placeholder}
            maxLength={500}
            className={cn(fieldClass, "h-auto min-h-28 py-3 leading-relaxed")}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Button type="submit" size="lg" disabled={loading} className="group w-full sm:w-auto">
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          <span>{loading ? form.submitting : form.submit}</span>
          {loading ? null : (
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          )}
        </Button>
        {state.status === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{form.note}</p>
        )}
      </div>
    </form>
  );
}
