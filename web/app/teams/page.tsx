import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, GraduationCap, type LucideIcon } from "lucide-react";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { PilotForm } from "@/components/sections/pilot-form";
import { principlesExtras, teams, teamsExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Teams" };

const icons: Record<(typeof teams.audiences)[number]["icon"], LucideIcon> = {
  GraduationCap,
};

export default function TeamsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-hero-mesh pt-36 pb-16 md:pt-44 md:pb-20">
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
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
            </div>
          </Container>
        </section>

        {/* Audiences: one card for career centers, then one plain line for companies and clinicians. */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24">
          <Container>
            <SectionHeading title={teamsExtras.audiencesHeading.title} sub={teamsExtras.audiencesHeading.sub} />

            {/* One centered column under the centered heading, so a lone card doesn't stretch across 1200px. */}
            <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-6 md:mt-14">
              {teams.audiences.map((audience) => {
                const Icon = icons[audience.icon];
                return (
                  // Not clickable, so no hover lift or hover border. From sm the icon sits beside the text.
                  <article
                    key={audience.title}
                    className="flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:gap-6 md:p-8"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-snug font-semibold text-foreground break-words md:text-2xl">
                        {audience.title}
                      </h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{audience.body}</p>
                    </div>
                  </article>
                );
              })}

              <p className="text-center text-[0.9375rem] leading-relaxed text-muted-foreground">
                {teams.otherAudiences.lead}{" "}
                <a
                  href={teams.otherAudiences.href}
                  className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:decoration-foreground"
                >
                  {teams.otherAudiences.link}
                </a>
              </p>
            </div>
          </Container>
        </section>

        {/* Offer band */}
        <section className="pb-24 md:pb-32">
          <Container>
            {/* Bordered, so flat: a wide shadow on top of the hairline would double the edge. */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-band-lavender p-8 md:p-12">
              {/* Dot grid fading in from the right edge. Purely decorative, and plain CSS like the hero's. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_60%_90%_at_90%_50%,#000_10%,transparent_100%)]"
              >
                <div className="absolute inset-0 text-ink/15 [background-image:radial-gradient(currentColor_1px,transparent_1.1px)] [background-size:22px_22px]" />
              </div>
              <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
                <div className="min-w-0">
                  <h2 className="display-md max-w-[22ch] text-foreground break-words">{teams.offer.title}</h2>
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
          </Container>
        </section>

        {/* Pilot request */}
        <section id="pilot" className="scroll-mt-28 border-t border-border py-24 md:py-32">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-16">
              <div className="flex min-w-0 flex-col gap-10 lg:sticky lg:top-28">
                <SectionHeading align="left" title={teamsExtras.pilot.title} sub={teamsExtras.pilot.sub} />
                <div>
                  <p className="eyebrow text-muted-foreground">{teamsExtras.pilot.stepsTitle}</p>
                  <ol className="mt-4 flex flex-col gap-3">
                    {teamsExtras.pilot.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground tabular-nums">
                          {i + 1}
                        </span>
                        <span className="min-w-0 break-words">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="min-w-0">
                <PilotForm />
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
