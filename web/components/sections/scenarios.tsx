import type { CSSProperties } from "react";
import { MagicCard } from "@/components/magicui/magic-card";
import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ScenarioAction, ScenarioCustomAction } from "@/components/sections/scenario-action";
import { demoScenarios, scenariosHeading } from "@/lib/content";
import { viewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * Bento on desktop: card 1 takes the left half across two rows with cards 2 and 3 stacked
 * beside it, then a row of three and a row of two. 12 columns, four full rows, no holes.
 * Spans sit on the RevealItem because it is the grid's direct child. Below lg they drop
 * away and the cards fall into one column, or two from sm.
 */
const span = [
  "lg:col-span-6 lg:row-span-2",
  "lg:col-span-6",
  "lg:col-span-6",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-6",
  "lg:col-span-6",
] as const;

/*
 * Two washes from the hero palette break up the white: lavender on the lead card, peach on
 * card 7. MagicCard paints its own face, so the wash goes on the content layer above it.
 */
const wash: Partial<Record<number, CSSProperties>> = {
  0: {
    backgroundImage:
      "radial-gradient(80% 70% at 0% 0%, color-mix(in oklab, var(--lavender-deep) 60%, transparent), transparent 70%)",
  },
  6: {
    backgroundImage:
      "radial-gradient(80% 70% at 0% 0%, color-mix(in oklab, var(--peach) 55%, transparent), transparent 70%)",
  },
};

export function Scenarios() {
  return (
    // Scenarios and the demo below are one flow (pick a card, land in the demo), so the gap between them is short.
    <section id="scenarios" className="scroll-mt-28 pt-20 pb-12 md:pt-24">
      <Container>
        <Reveal className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
          <SectionHeading align="left" title={scenariosHeading.title} sub={scenariosHeading.sub} className="min-w-0" />
          <ScenarioCustomAction />
        </Reveal>

        {/* Eight stacked cards are tall on a phone; the default 20% threshold would leave a blank gap under the heading. */}
        <Reveal
          group
          staggerBy={0.05}
          viewport={{ ...viewport, amount: 0.1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-12"
        >
          {demoScenarios.map((scenario, i) => {
            const lead = i === 0;
            const tinted = i in wash;
            return (
              <RevealItem key={scenario.id} className={cn("min-w-0", span[i])}>
                {/* `--background` is what MagicCard paints its face with; point it at the white card token. */}
                <MagicCard
                  className="group/card h-full rounded-2xl [--background:var(--card)] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:hover:-translate-y-0.5 has-[button:active]:scale-[0.98]"
                  gradientFrom="#C7CDF8"
                  gradientTo="#FFD9AE"
                  gradientColor="#EEF1F8"
                  gradientSize={240}
                >
                  <div
                    className={cn("relative flex h-full flex-col rounded-[inherit] p-6 md:p-7", lead && "lg:p-9")}
                    style={wash[i]}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{scenario.who}</p>
                    {/* The other person's first line, as it lands in the demo. */}
                    <p
                      className={cn(
                        "mt-2 w-fit max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md px-4 py-3 text-[0.95rem] leading-snug text-foreground",
                        tinted ? "bg-card" : "bg-muted",
                        lead && "lg:mt-3 lg:max-w-[min(100%,30rem)] lg:px-5 lg:py-4 lg:text-[1.375rem] lg:leading-[1.3]",
                      )}
                    >
                      {scenario.opener}
                    </p>
                    {/* The tall lead card plays a few more turns, so it reads as a rehearsal rather than a quote. */}
                    {lead ? (
                      <div className="mt-3 hidden flex-col gap-3 lg:flex">
                        {scenariosHeading.leadPreview.map((line) => (
                          <p
                            key={line.text}
                            className={cn(
                              "w-fit max-w-[min(100%,26rem)] rounded-2xl px-4 py-3 text-[0.95rem] leading-snug",
                              line.from === "you"
                                ? "self-end rounded-br-md bg-ink text-white"
                                : "rounded-bl-md bg-card text-foreground",
                            )}
                          >
                            <span className="sr-only">{line.from === "you" ? "You: " : `${scenario.who}: `}</span>
                            {line.text}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {/* On the tall lead card the title, body and action sit at the bottom, under the open space. */}
                    <div className={cn("mt-6 flex flex-1 flex-col", lead && "lg:justify-end")}>
                      <h3 className="font-display text-lg leading-snug font-semibold text-foreground break-words">
                        {scenario.cardTitle}
                      </h3>
                      <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
                        {scenario.cardBody}
                      </p>
                      <div className={cn("pt-5", lead ? "mt-auto lg:mt-0" : "mt-auto")}>
                        <ScenarioAction id={scenario.id} title={scenario.cardTitle} />
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </RevealItem>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
