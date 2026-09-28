import { ArrowDown, Lock } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { Button } from "@/components/ui/button";
import { hero, heroExtras } from "@/lib/content";
import { HeroHeadline, HeroItem, HeroMock, HeroStagger } from "@/components/sections/hero-motion";
import { RehearsalWindow } from "@/components/sections/rehearsal-window";

export function Hero() {
  return (
    <section className="relative bg-hero-mesh pt-36 pb-16 md:pt-44">
      {/* Dot grid, faded out radially so it only reads behind the headline. Bounded to the
          masked area so DotPattern renders a few hundred fewer nodes at hydration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-[40rem] w-full max-w-[72rem] -translate-x-1/2 mask-[radial-gradient(ellipse_60%_55%_at_50%_38%,#000_5%,transparent_100%)]"
      >
        <DotPattern width={24} height={24} cr={1.1} className="text-ink/15" />
      </div>

      <Container className="relative">
        <HeroStagger>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* Eyebrow */}
            <HeroItem>
              <div className="glass inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pr-4 pl-3.5 shadow-soft">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber ring-4 ring-amber/25" />
                <AnimatedShinyText className="mx-0 max-w-none text-xs font-medium whitespace-nowrap text-foreground/75 sm:text-[0.8125rem]">
                  {hero.eyebrow}
                  <span className="mx-1.5 text-foreground/40">·</span>
                  {heroExtras.eyebrowSuffix}
                </AnimatedShinyText>
              </div>
            </HeroItem>

            {/* Headline */}
            <div className="mt-7">
              <HeroHeadline text={hero.headline} emphasis={hero.headlineEmphasis} className="display-xl text-foreground" />
            </div>

            {/* Sub */}
            <HeroItem className="mt-6">
              <p className="lede mx-auto max-w-[60ch]">{hero.sub}</p>
            </HeroItem>

            {/* Email capture (anchor target for the nav and footer) */}
            <HeroItem id="early-access" className="mt-9 flex w-full scroll-mt-32 justify-center">
              <EmailCapture source="hero" buttonLabel={hero.ctaPrimary} />
            </HeroItem>

            {/* Trust line + secondary link, one quiet row */}
            <HeroItem className="mt-4 flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
              <p className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{hero.trust}</span>
              </p>
              <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
              <Button asChild variant="ghost" size="sm" className="group text-muted-foreground hover:text-foreground">
                <a href="#try">
                  {hero.ctaSecondary}
                  <ArrowDown aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </a>
              </Button>
            </HeroItem>
          </div>

          {/* Product mock */}
          <HeroMock className="mx-auto mt-14 w-full max-w-[1040px]">
            <RehearsalWindow />
          </HeroMock>
        </HeroStagger>
      </Container>
    </section>
  );
}
