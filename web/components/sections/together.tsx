import { Clapperboard, Flame, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { TogetherDares } from "@/components/sections/together-dares";
import { together } from "@/lib/content";

const icons: Record<(typeof together.features)[number]["icon"], LucideIcon> = {
  Users,
  Flame,
  Clapperboard,
};

export function Together() {
  return (
    <section className="bg-band-lavender-soft py-20 md:py-24">
      <Container>
        <SectionHeading align="left" title={together.title} sub={together.sub} />

        <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-16">
          {/* Plain rows, not cards: none of these is clickable, so nothing lifts or frames them. */}
          <div className="flex min-w-0 flex-col">
            {together.features.map((feature) => {
              const Icon = icons[feature.icon];
              return (
                <div
                  key={feature.title}
                  className="flex min-w-0 gap-5 border-t border-border py-6 first:border-t-0 first:pt-0"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl leading-snug font-semibold text-foreground break-words">
                      {feature.title}
                    </h3>
                    <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-muted-foreground">{feature.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No scroll reveal here: the dares arriving one by one is this section's motion. */}
          <TogetherDares className="min-w-0" />
        </div>
      </Container>
    </section>
  );
}
