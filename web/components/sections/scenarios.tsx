"use client";

import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { Container } from "@/components/site/container";
import { PostIt } from "@/components/world/post-it";
import { REHEARSE_EVENT, type RehearseEventDetail } from "@/components/sections/live-demo";
import { scenarioCards, scenarioIndex } from "@/lib/content";
import { cn } from "@/lib/utils";

function rehearse(i: number) {
  const id = scenarioIndex.demoIds[i];
  const detail: RehearseEventDetail = id ? { id } : { custom: scenarioIndex.customPrefill };
  window.dispatchEvent(new CustomEvent(REHEARSE_EVENT, { detail }));
}

/*
 * The conversations as a big-type index. On a desktop, pointing at a line shows what it covers on a note;
 * on a phone every line carries its own description. Choosing one loads it into the demo.
 */
export function Scenarios() {
  const [focus, setFocus] = useState(0);
  const current = scenarioCards[focus];

  return (
    <section id="scenarios" aria-labelledby="scenarios-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container>
        <div className="max-w-[38rem]">
          <h2 id="scenarios-title" className="display-2 on-tile text-wall-ink">
            {scenarioIndex.title}
          </h2>
          <p className="lede on-tile mt-5 max-w-[42ch] text-wall-muted">{scenarioIndex.sub}</p>
        </div>

        <div className="mt-14 grid gap-x-12 lg:grid-cols-12">
          <ol className="flex flex-col gap-2 lg:col-span-7">
            {scenarioCards.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => rehearse(i)}
                  onPointerEnter={() => setFocus(i)}
                  onFocus={() => setFocus(i)}
                  aria-describedby={`scn-${i}`}
                  className="group press flex w-full items-center justify-between gap-6 rounded-2xl py-2 text-left"
                >
                  <span
                    className={cn(
                      "on-tile text-[clamp(1.65rem,3.4vw,2.75rem)] leading-[1.08] font-[760] tracking-[-0.022em] text-wall-ink transition-colors duration-150 [font-stretch:88%] group-hover:text-amber",
                      focus === i && "lg:text-amber",
                    )}
                  >
                    {s.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden size-11 shrink-0 place-items-center rounded-full bg-amber text-ink opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 sm:grid"
                  >
                    <ArrowRight weight="bold" className="size-5" />
                  </span>
                </button>
                <p id={`scn-${i}`} className="on-tile mt-1 mb-4 max-w-[48ch] text-[0.9375rem] leading-relaxed text-wall-muted lg:sr-only">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-32 pt-4">
              <PostIt tilt={2} className="px-7 pt-6 pb-7">
                <div key={focus} className="step-swap">
                  <p className="text-[1.6rem] leading-tight font-bold">{current.title}</p>
                  <p className="mt-3 text-[1.25rem] leading-snug">{current.body}</p>
                  <button
                    type="button"
                    onClick={() => rehearse(focus)}
                    className="press mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-sans text-[0.9375rem] font-semibold text-glass transition-colors duration-150 hover:bg-[#1b3b32]"
                  >
                    {scenarioIndex.action}
                    <ArrowRight weight="bold" className="size-4" />
                  </button>
                </div>
              </PostIt>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
