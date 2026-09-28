"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CtaArrow } from "@/components/site/cta-arrow";
import { PostIt } from "@/components/world/post-it";
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

/** Fields are clear panes set into the glass: a lighter fill and a thin inset edge, never a box on a box. */
const fieldClass =
  "w-full min-w-0 rounded-xl bg-white/75 px-4 text-base text-ink shadow-[inset_0_0_0_1.5px_rgba(15,42,35,0.16)] outline-none transition-[box-shadow,background-color] duration-150 placeholder:text-ink-muted hover:shadow-[inset_0_0_0_1.5px_rgba(15,42,35,0.3)] focus-visible:bg-white focus-visible:shadow-[inset_0_0_0_2px_var(--wall)]";

const { form } = teamsExtras;

/**
 * Campus or team pilot request. Posts to `/api/waitlist` with `source: "teams"`
 * and follows the same loading, done and error pattern as `EmailCapture`.
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
      <div ref={doneRef} tabIndex={-1} role="status" className={cn("pt-4 outline-none", className)}>
        <PostIt play tilt={-2} className="max-w-[26rem] px-7 pt-6 pb-7">
          <h3 className="text-[1.75rem] leading-tight font-bold">{form.success.title}</h3>
          <p className="mt-2 text-[1.2rem] leading-snug">{form.success.body}</p>
          <p className="mt-4 text-[1.05rem] leading-snug break-all">
            {form.success.emailLabel} {state.message}
          </p>
        </PostIt>
      </div>
    );
  }

  const loading = state.status === "loading";
  const errorId = `${uid}-error`;

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      aria-describedby={state.status === "error" ? errorId : undefined}
      className={cn("glass-panel p-6 sm:p-8", className)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {teams.form.fields.map((field) => {
          const id = `${uid}-${field.id}`;
          return (
            <div key={field.id} className="flex min-w-0 flex-col gap-2">
              <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
                {field.label}
              </label>
              <input
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
                className={cn(fieldClass, "h-12")}
              />
            </div>
          );
        })}

        <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${uid}-${form.notes.id}`} className="text-[0.9375rem] font-semibold text-ink">
            {form.notes.label}
          </label>
          <textarea
            id={`${uid}-${form.notes.id}`}
            name={form.notes.id}
            rows={4}
            value={values.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder={form.notes.placeholder}
            maxLength={500}
            className={cn(fieldClass, "min-h-28 resize-y py-3 leading-relaxed")}
          />
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Button type="submit" size="lg" disabled={loading} className="w-full justify-between pr-2.5 pl-6 sm:w-auto">
          <span>{loading ? form.submitting : form.submit}</span>
          {loading ? (
            <span aria-hidden="true" className="grid size-8 place-items-center">
              <CircleNotch weight="bold" className="size-4 animate-spin" />
            </span>
          ) : (
            <CtaArrow />
          )}
        </Button>
        {state.status === "error" ? (
          <p id={errorId} role="alert" className="text-[0.9375rem] font-medium text-danger">
            {state.message}
          </p>
        ) : (
          <p className="text-[0.9375rem] text-ink-muted">{form.note}</p>
        )}
      </div>
    </form>
  );
}
