"use client";

import { ArrowRight } from "lucide-react";
import { REHEARSE_EVENT, type RehearseEventDetail } from "@/components/sections/live-demo";
import { scenarioIndex } from "@/lib/content";

/**
 * The card's action. Its hit area stretches over the whole card (the card is `relative`),
 * so the title and text stay real headings and paragraphs while the card reads as one target.
 */
export function ScenarioAction({ index, title }: { index: number; title: string }) {
  function rehearse() {
    const id = scenarioIndex.demoIds[index];
    const detail: RehearseEventDetail = id ? { id } : { custom: scenarioIndex.customPrefill };
    window.dispatchEvent(new CustomEvent(REHEARSE_EVENT, { detail }));
  }
  return (
    <button
      type="button"
      onClick={rehearse}
      aria-label={`${scenarioIndex.action}: ${title}`}
      className="mt-5 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 group-hover/card:text-foreground after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:text-foreground focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
    >
      <span>{scenarioIndex.action}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:translate-x-0.5"
      />
    </button>
  );
}
