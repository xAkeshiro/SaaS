import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Ripple } from "@/components/magicui/ripple";
import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { principles, principlesExtras } from "@/lib/content";

export function AntiCompanion() {
  return (
    <section className="dark relative overflow-hidden bg-band-ink text-foreground">
      {/* Faded ripple behind the heading. Purely decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] opacity-30">
        <Ripple mainCircleSize={220} mainCircleOpacity={0.22} numCircles={7} />
      </div>

      <Container className="relative py-24 md:py-28">
        <Reveal>
          <SectionHeading
            inverted
            eyebrow={principles.eyebrow}
            title={principles.title}
            sub={principles.intro}
          />
        </Reveal>

        <Reveal group className="mt-14 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-5">
          {principles.items.map((item, i) => (
            <RevealItem key={item.title} className="min-w-0">
              <article className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8 md:p-8">
                <span className="font-mono text-sm font-medium text-amber" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl leading-snug font-semibold text-white break-words md:text-2xl">
                  {item.title}
                </h3>
                <p className="max-w-[48ch] text-[0.9375rem] leading-relaxed text-white/70">{item.body}</p>
              </article>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button asChild variant="accent" size="lg" className="group w-full sm:w-auto">
            <Link href={principles.cta.href}>
              {principles.cta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full text-white/80 hover:text-white sm:w-auto">
            <Link href={principlesExtras.secondaryCta.href}>{principlesExtras.secondaryCta.label}</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
