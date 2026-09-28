"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "motion/react";
import { Container } from "@/components/site/container";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";
import { PostIt } from "@/components/world/post-it";
import { Tally } from "@/components/world/tally";
import { howItWorks, howMirror, steps } from "@/lib/content";
import { cn } from "@/lib/utils";

type StepId = (typeof steps)[number]["id"];

/*
 * Four verbs down the left; one cabinet mirror held in view on the right that shows each verb
 * happening as it crosses the middle of the screen. Below lg, each verb carries its own mirror.
 */
export function HowItWorks() {
  const [active, setActive] = useState<StepId>(steps[0].id);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.step as StepId);
        }
      },
      { rootMargin: "-46% 0px -46% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container>
        <h2 id="how-title" className="display-2 on-tile max-w-[17ch] text-wall-ink">
          {howItWorks.title}
        </h2>

        <div className="mt-14 grid gap-x-16 lg:mt-20 lg:grid-cols-12">
          <ol className="flex min-w-0 flex-col gap-20 lg:col-span-5 lg:gap-0">
            {steps.map((s, i) => (
              <li
                key={s.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-step={s.id}
                className="flex min-w-0 flex-col lg:min-h-[62vh] lg:justify-center lg:first:min-h-[46vh] lg:first:justify-start lg:last:min-h-[46vh] lg:last:justify-end"
              >
                <h3
                  className={cn(
                    "display-2 on-tile transition-colors duration-300 ease-out",
                    active === s.id ? "text-amber" : "text-wall-ink",
                  )}
                >
                  {s.name}
                </h3>
                <p className="lede on-tile mt-4 max-w-[42ch] text-wall-muted">
                  <strong className="font-semibold text-wall-ink">{s.title}</strong> {s.body}
                </p>
                <div className="mt-10 lg:hidden">
                  <StepMirror step={s.id} inline />
                </div>
              </li>
            ))}
          </ol>

          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-28">
              <StepMirror step={active} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function StepMirror({ step, inline = false }: { step: StepId; inline?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Inline (phone) mirrors wait until they are on screen; the sticky one plays, and crossfades, on every change of step.
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const play = inline ? seen : true;
  const view = VIEWS[step](play);
  return (
    // Notes are stuck onto the mirror, not framed inside it: they sit over the bezel and cross its edge.
    <div ref={ref} className="relative mb-8">
      <Mirror shape="rect" seed={0x77a1} className="aspect-[4/4.4] w-full sm:aspect-[4/3.1]">
        <div key={step} className={cn("flex h-full flex-col px-[7%] py-[7%]", !inline && "step-swap")}>
          {view.glass}
        </div>
      </Mirror>
      {view.notes ? (
        // A filter (the swap's blur) makes an element the containing block for its absolute children,
        // so the layer spans the mirror itself and the notes' offsets stay relative to the frame.
        <div key={`${step}-notes`} className={cn("pointer-events-none absolute inset-0", !inline && "step-swap")}>
          {view.notes}
        </div>
      ) : null}
    </div>
  );
}

type View = { glass: ReactNode; notes?: ReactNode };

const lineLg = "text-[clamp(1.1rem,1.6vw,1.45rem)] leading-[1.32] font-[630] text-ink [font-stretch:95%]";
const lineSm = "text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.35] font-[560] text-ink [font-stretch:96%]";
const label = "text-[0.8125rem] font-semibold text-ink-muted";
const note = "absolute px-3.5 pt-3 pb-3.5 text-[1rem] leading-snug sm:px-4 sm:pt-3.5 sm:pb-4 sm:text-[1.1rem]";

const VIEWS: Record<StepId, (play: boolean) => View> = {
  rehearse: (play) => {
    const r = howMirror.rehearse;
    return {
      glass: (
        <>
          <p className={label}>
            {r.who} · {r.scenario}
          </p>
          <SteamText text={r.line} play={play} delay={150} perWord={95} className={cn("mt-5 max-w-[26ch]", lineLg)} />
          <SteamText text={r.pushback} play={play} delay={1650} perWord={120} className={cn("mt-auto max-w-[20ch] sm:max-w-[24ch]", lineSm)} />
        </>
      ),
      notes: (
        <PostIt play={play} delay={2600} tilt={4} className={cn(note, "right-[-3%] bottom-[12%] w-[36%] min-w-[8.5rem]")}>
          <span className="font-bold">{r.moodLabel}:</span> {r.mood}
          <br />
          {r.moodNote}
        </PostIt>
      ),
    };
  },
  debrief: (play) => {
    const d = howMirror.debrief;
    return {
      glass: (
        <>
          <p className={label}>{d.who}</p>
          <SteamText text={d.held} play={play} delay={900} perWord={160} className={cn("mt-auto self-end", lineLg)} />
        </>
      ),
      notes: (
        <>
          <PostIt play={play} delay={120} tilt={-3.5} className={cn(note, "top-[17%] left-[-3%] w-[54%] sm:w-[46%]")}>
            {d.notes.map((n) => (
              <span key={n} className="block">
                {n}
              </span>
            ))}
          </PostIt>
          <PostIt play={play} delay={520} tilt={3} className={cn(note, "right-[-3%] bottom-[22%] w-[48%] sm:w-[42%]")}>
            {d.pattern}
          </PostIt>
        </>
      ),
    };
  },
  daily: (play) => {
    const d = howMirror.daily;
    return {
      glass: (
        <>
          <p className={label}>{d.title}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Tally count={d.days} play={play} delay={150} className="h-[clamp(52px,6.5vw,72px)]" />
            <SteamText text={d.streak} play={play} delay={1900} perWord={120} className={lineLg} />
          </div>
          <div className="mt-auto">
            <SteamText text={d.rep} play={play} delay={2500} perWord={110} className={lineLg} />
            <SteamText text={d.repWhy} play={play} delay={3100} perWord={100} className="mt-2 text-[1rem] font-[520] text-ink-muted" />
          </div>
        </>
      ),
    };
  },
  real: (play) => {
    const r = howMirror.real;
    return {
      glass: (
        <>
          <SteamText text={r.warmup} play={play} delay={100} perWord={90} className={lineLg} />
          <p className={cn("mt-5", label)}>{r.note}</p>
        </>
      ),
      notes: (
        <PostIt play={play} delay={450} tilt={-2} className={cn(note, "right-[-3%] bottom-[8%] w-[62%] min-w-[13.5rem] px-5 pt-4 pb-5 sm:px-5 sm:pt-4 sm:pb-5")}>
          <p className="text-[1.15rem] font-bold sm:text-[1.2rem]">{r.title}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {r.cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </PostIt>
      ),
    };
  },
};
