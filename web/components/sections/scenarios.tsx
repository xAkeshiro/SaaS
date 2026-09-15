import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Coffee,
  Hand,
  HeartCrack,
  Home,
  PhoneCall,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";
import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { scenarioCards, scenariosHeading } from "@/lib/content";
import { viewport } from "@/lib/motion";

const icons: Record<(typeof scenarioCards)[number]["icon"], LucideIcon> = {
  PhoneCall,
  TrendingUp,
  Home,
  Briefcase,
  Coffee,
  Receipt,
  Hand,
  HeartCrack,
};

export function Scenarios() {
  return (
    <section id="scenarios" className="scroll-mt-28 py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={scenariosHeading.eyebrow}
            title={scenariosHeading.title}
            sub={scenariosHeading.sub}
          />
        </Reveal>

        {/* Eight stacked cards are ~1600px tall on a phone; the default 20% threshold would leave a blank gap under the heading. */}
        <Reveal
          group
          staggerBy={0.06}
          viewport={{ ...viewport, amount: 0.1 }}
          className="mt-14 grid gap-4 sm:grid-cols-2 md:gap-5 lg:mt-16 lg:grid-cols-4"
        >
          {scenarioCards.map((card, i) => {
            const Icon = icons[card.icon];
            return (
              <RevealItem key={card.title} className="min-w-0">
                {/* `--background` is what MagicCard paints its face with; point it at the white card token. */}
                <MagicCard
                  className="h-full rounded-2xl [--background:var(--card)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
                  gradientFrom="#C7CDF8"
                  gradientTo="#FFD9AE"
                  gradientColor="#EEF1F8"
                  gradientSize={240}
                >
                  <div className="p-6 md:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="pt-1 font-mono text-xs text-muted-foreground" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-lg leading-snug font-semibold text-foreground break-words">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </MagicCard>
              </RevealItem>
            );
          })}
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg" className="group">
            <Link href={scenariosHeading.cta.href}>
              {scenariosHeading.cta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
