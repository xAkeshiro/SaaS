import {
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
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { proof, scenarioCards, stats } from "@/lib/content";

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

export function Proof() {
  return (
    <section className="py-16" aria-labelledby="proof-heading">
      <Container>
        <Reveal className="text-center">
          <p id="proof-heading" className="eyebrow text-amber-ink">
            {proof.eyebrow}
          </p>
        </Reveal>

        <Reveal className="mt-8 grid rounded-3xl border border-border bg-card md:grid-cols-3">
          {stats.map((stat, i) => {
            const prefix = "prefix" in stat ? stat.prefix : null;
            return (
              <div
                key={stat.footnote}
                className={
                  i === 0
                    ? "flex min-w-0 flex-col gap-3 p-6 lg:p-8"
                    : "flex min-w-0 flex-col gap-3 border-t border-border p-6 md:border-t-0 md:border-l lg:p-8"
                }
              >
                <div className="flex items-start font-display text-5xl font-bold leading-none tracking-tight whitespace-nowrap text-foreground lg:text-6xl">
                  {prefix ? <span>{prefix}</span> : null}
                  <NumberTicker
                    value={stat.value}
                    delay={0.1 * i}
                    className="font-display leading-none tracking-tight text-foreground"
                  />
                  <span>{stat.suffix}</span>
                  <a
                    href={`#fn-${stat.footnote}`}
                    aria-label={`Footnote ${stat.footnote}`}
                    className="mt-1 ml-1.5 font-mono text-xs font-medium leading-none text-amber-ink transition-colors duration-200 hover:text-foreground"
                  >
                    {stat.footnote}
                  </a>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </Reveal>

        <Reveal className="mt-8">
          <Marquee
            pauseOnHover
            aria-hidden="true"
            className="[--duration:48s] [--gap:0.75rem] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          >
            {scenarioCards.map((card) => {
              const Icon = icons[card.icon];
              return (
                <span
                  key={card.title}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm whitespace-nowrap text-foreground"
                >
                  <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                  {card.title}
                </span>
              );
            })}
          </Marquee>
        </Reveal>
      </Container>
    </section>
  );
}
