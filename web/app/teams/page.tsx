import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { CtaArrow } from "@/components/site/cta-arrow";
import { Button } from "@/components/ui/button";
import { PostIt } from "@/components/world/post-it";
import { PilotForm } from "@/components/sections/pilot-form";
import { principlesExtras, teams, teamsExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Teams", description: teams.sub };

export default function TeamsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section aria-labelledby="teams-title" className="relative pt-[120px] pb-20 sm:pt-[144px] lg:pb-28">
          <Container className="grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-7">
              <h1 id="teams-title" className="display-1 on-tile max-w-[14ch] text-wall-ink">
                {teams.title}
              </h1>
              <p className="lede on-tile mt-6 max-w-[44ch] text-wall-muted">{teams.sub}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="pr-2.5 pl-6">
                  <a href="#pilot">
                    {teams.offer.cta}
                    <CtaArrow />
                  </a>
                </Button>
                <Link
                  href={principlesExtras.secondaryCta.href}
                  className="press group inline-flex h-11 items-center gap-2 rounded-full px-3 text-[0.9375rem] font-semibold text-wall-ink transition-colors duration-150 hover:bg-white/[0.08]"
                >
                  {principlesExtras.secondaryCta.label}
                  <ArrowRight weight="bold" className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* The season offer, stuck to the wall where a counselor would leave it. */}
            <div className="flex justify-center lg:col-span-5 lg:justify-end">
              <PostIt tilt={-2.5} className="w-full max-w-[25rem] px-7 pt-6 pb-8">
                <h2 className="text-[1.8rem] leading-[1.12] font-bold">{teams.offer.title}</h2>
                <p className="mt-3 text-[1.2rem] leading-snug">{teams.offer.body}</p>
              </PostIt>
            </div>
          </Container>
        </section>

        <section aria-labelledby="audiences-title" className="relative py-20 sm:py-28">
          <Container>
            <div className="max-w-[40rem]">
              <h2 id="audiences-title" className="display-2 on-tile text-wall-ink">
                {teamsExtras.audiencesHeading.title}
              </h2>
              <p className="lede on-tile mt-5 text-wall-muted">{teamsExtras.audiencesHeading.sub}</p>
            </div>
            <ul className="mt-16 flex flex-col gap-14">
              {teams.audiences.map((audience) => (
                <li key={audience.title} className="grid gap-4 lg:grid-cols-12 lg:gap-12">
                  <h3 className="display-3 on-tile text-wall-ink lg:col-span-4">{audience.title}</h3>
                  <div className="lg:col-span-8">
                    <p className="on-tile max-w-[62ch] text-[1.0625rem] leading-relaxed text-wall-muted">{audience.body}</p>
                    <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5">
                      {audience.bullets.map((bullet) => (
                        <li key={bullet} className="on-tile flex items-center gap-2 text-[0.9688rem] font-semibold text-wall-ink">
                          <Check weight="bold" aria-hidden="true" className="size-4 shrink-0 text-amber" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section id="pilot" aria-labelledby="pilot-title" className="relative scroll-mt-20 py-20 sm:py-28">
          <Container className="grid gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <h2 id="pilot-title" className="display-2 on-tile text-wall-ink">
                {teamsExtras.pilot.title}
              </h2>
              <p className="lede on-tile mt-5 max-w-[40ch] text-wall-muted">{teamsExtras.pilot.sub}</p>
              <h3 className="on-tile mt-10 text-[1.0625rem] font-bold text-wall-ink">{teamsExtras.pilot.stepsTitle}</h3>
              <ol className="mt-4 flex flex-col gap-3">
                {teamsExtras.pilot.steps.map((step, i) => (
                  <li key={step} className="on-tile flex gap-3 text-[1.0625rem] leading-relaxed text-wall-muted">
                    <span className="tnum font-bold text-amber">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:col-span-7">
              <PilotForm />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
