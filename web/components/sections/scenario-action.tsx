"use client";

import { ArrowRight } from "lucide-react";
import { REHEARSE_EVENT, type RehearseEventDetail } from "@/components/sections/live-demo";
import { scenariosHeading, type DemoScenario } from "@/lib/content";

function rehearse(detail: RehearseEventDetail) {
  window.dispatchEvent(new CustomEvent(REHEARSE_EVENT, { detail }));
}

/**
 * The card's action. Its hit area stretches over the whole card (the nearest `relative`
 * ancestor), so the title and text stay real headings and paragraphs while the card reads
 * as one target. The focus ring is drawn inside the stretched area because the card clips
 * anything outside it, solid and full strength so it clears 3:1 like the global outline.
 */
export function ScenarioAction({ id, title }: { id: DemoScenario["id"]; title: string }) {
  return (
    <button
      type="button"
      onClick={() => rehearse({ id })}
      aria-label={`${scenariosHeading.action}: ${title}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:text-foreground after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:text-foreground focus-visible:after:inset-ring-2 focus-visible:after:inset-ring-ring"
    >
      <span>{scenariosHeading.action}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover/card:translate-x-0.5"
      />
    </button>
  );
}

/**
 * "Or describe your own": opens the demo's custom box with a worked example already filled in.
 * Focus uses the global outline. `active:scale` sets the standalone `scale` property, so that is
 * what the transition lists. 44px tall on touch screens.
 */
export function ScenarioCustomAction() {
  return (
    <button
      type="button"
      onClick={() => rehearse({ custom: scenariosHeading.customPrefill })}
      className="group/custom inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md py-1 text-[0.9375rem] font-medium text-foreground underline decoration-foreground/25 underline-offset-[6px] transition-[text-decoration-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:decoration-foreground active:scale-[0.97] md:min-h-0"
    >
      {scenariosHeading.customLabel}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover/custom:translate-x-0.5"
      />
    </button>
  );
}
