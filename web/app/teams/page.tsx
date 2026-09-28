import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { PilotForm } from "@/components/sections/pilot-form";
import { principlesExtras, teams, teamsExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Teams" };

const icons: Record<(typeof teams.audiences)[number]["icon"], LucideIcon> = {
  GraduationCap,
  Building2,
  Stethoscope,
};

export default function TeamsPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-mesh pt-36 pb-16 md:pt-44 md:pb-20">
          <Container>
            <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="eyebrow text-amber-ink">{teams.eyebrow}</span>
              <h1 className="display-lg max-w-[20ch] text-foreground">{teams.title}</h1>
              <p className="lede max-w-[58ch]">{teams.sub}</p>
              <div className="mt-4 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <a href="#pilot">
                    {teams.offer.cta}
                    <ArrowDown
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
                    />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="w-full text-muted-foreground hover:text-foreground sm:w-auto"
                >
                  <Link href={principlesExtras.secondaryCta.href}>{principlesExtras.secondaryCta.label}</Link>
                </Button>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Audiences */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow={teamsExtras.audiencesHeading.eyebrow}
                title={teamsExtras.audiencesHeading.title}
                sub={teamsExtras.audiencesHeading.sub}
              />
            </Reveal>

            <Reveal group staggerBy={0.08} className="mt-12 grid gap-4 md:mt-14 lg:grid-cols-3 lg:gap-5">
              {teams.audiences.map((audience) => {
                const Icon = icons[audience.icon];
                return (
                  <RevealItem key={audience.title} className="h-full min-w-0">
                    <article className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 md:p-8">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-snug font-semibold text-foreground break-words md:text-2xl">
                          {audience.title}
                        </h3>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{audience.body}</p>
                      </div>
                      <ul className="mt-auto flex flex-col gap-2.5 border-t border-border pt-5">
                        {audience.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2.5 text-sm text-foreground">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber-ink">
                              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 break-words">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </RevealItem>
                );
              })}
            </Reveal>
          </Container>
        </section>

        {/* Offer band */}
        <section className="pb-24 md:pb-32">
          <Container>
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border bg-band-lavender p-8 shadow-soft md:p-12">
                {/* Dot grid fading in from the right edge. Purely decorative. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_60%_90%_at_90%_50%,#000_10%,transparent_100%)]"
                >
                  <DotPattern width={22} height={22} cr={1} className="text-ink/15" />
                </div>
                <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
                  <div className="min-w-0">
                    <span className="eyebrow text-amber-ink">{teamsExtras.offer.eyebrow}</span>
                    <h2 className="display-md mt-4 max-w-[22ch] text-foreground break-words">{teams.offer.title}</h2>
                    <p className="mt-3 max-w-[52ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
                      {teams.offer.body}
                    </p>
                  </div>
                  <Button asChild size="xl" className="group w-full md:w-auto">
                    <a href="#pilot">
                      {teams.offer.cta}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </a>
                  </Button>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Pilot request */}
        <section id="pilot" className="scroll-mt-28 border-t border-border py-24 md:py-32">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-16">
              <Reveal className="flex min-w-0 flex-col gap-10 lg:sticky lg:top-28">
                <SectionHeading
                  align="left"
                  eyebrow={teamsExtras.pilot.eyebrow}
                  title={teamsExtras.pilot.title}
                  sub={teamsExtras.pilot.sub}
                />
                <div>
                  <p className="eyebrow text-muted-foreground">{teamsExtras.pilot.stepsTitle}</p>
                  <ol className="mt-4 flex flex-col gap-3">
                    {teamsExtras.pilot.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-foreground">
                          {i + 1}
                        </span>
                        <span className="min-w-0 break-words">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>

              <Reveal delay={0.1} className="min-w-0">
                <PilotForm />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
