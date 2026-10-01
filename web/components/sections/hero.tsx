import { ArrowDown } from "lucide-react";
import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { hero } from "@/lib/content";
import { HeroHeadline, HeroItem, HeroMock, HeroStagger } from "@/components/sections/hero-motion";
import { RehearsalWindow } from "@/components/sections/rehearsal-window";

export function Hero() {
  return (
    <section className="relative bg-hero-mesh pt-28 pb-16 md:pt-32">
      {/* Dot grid, faded out radially so it only reads behind the headline. Pure CSS: one painted
          background instead of a thousand SVG nodes hydrating while the headline animates. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-[40rem] w-full max-w-[72rem] -translate-x-1/2 mask-[radial-gradient(ellipse_60%_55%_at_50%_38%,#000_5%,transparent_100%)]"
      >
        <div className="absolute inset-0 text-ink/15 [background-image:radial-gradient(currentColor_1.1px,transparent_1.2px)] [background-size:24px_24px]" />
      </div>

      <Container className="relative">
        <HeroStagger>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* The owner's line, as written: a quiet static pill, nothing appended. */}
            <HeroItem>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-[0.8125rem] font-medium text-foreground/80">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber" />
                {hero.eyebrow}
              </p>
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
            <HeroItem id="early-access" className="mt-8 flex w-full scroll-mt-32 justify-center">
              <EmailCapture source="hero" buttonLabel={hero.ctaPrimary} />
            </HeroItem>

            {/* Secondary path: a quiet text link, so the form stays the one obvious action. */}
            <HeroItem className="mt-4">
              <a
                href="#try"
                className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.8125rem] font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground"
              >
                {hero.ctaSecondary}
                <ArrowDown
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0.5"
                />
              </a>
            </HeroItem>
          </div>

          {/* Product mock */}
          <HeroMock className="mx-auto mt-10 w-full max-w-[1040px]">
            <RehearsalWindow />
          </HeroMock>
        </HeroStagger>
      </Container>
    </section>
  );
}
