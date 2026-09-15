import { Clapperboard, Flame, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
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
    <section className="bg-band-lavender py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={together.eyebrow} title={together.title} sub={together.sub} />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-8">
          <Reveal group className="flex min-w-0 flex-col gap-4">
            {together.features.map((feature) => {
              const Icon = icons[feature.icon];
              return (
                <RevealItem key={feature.title} className="min-w-0">
                  <article className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 sm:flex-row sm:items-start sm:gap-6 md:p-8">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-snug font-semibold text-foreground break-words">
                        {feature.title}
                      </h3>
                      <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {feature.body}
                      </p>
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </Reveal>

          <Reveal delay={0.15} className="min-w-0">
            <TogetherDares />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
