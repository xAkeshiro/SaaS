import Link from "next/link";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { HeroMirror } from "@/components/sections/hero-mirror";
import { hero } from "@/lib/content";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative pt-[104px] pb-24 sm:pt-[120px] lg:pb-32">
      <Container className="grid items-center gap-y-12 sm:gap-y-16 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7">
          <h1 id="hero-title" className="display-1 on-tile max-w-[13ch] text-wall-ink sm:max-w-[16ch]">
            {hero.headline}
          </h1>
          <p className="lede on-tile mt-6 max-w-[36ch] text-wall-muted">{hero.sub}</p>

          <div id="early-access" className="mt-9 scroll-mt-32">
            <EmailCapture source="hero" />
          </div>

          <Link
            href="/#try"
            className="press group mt-5 inline-flex h-11 items-center gap-2 rounded-full px-3 text-[0.9375rem] font-semibold text-wall-ink transition-colors duration-150 hover:bg-white/[0.08]"
          >
            {hero.ctaSecondary}
            <ArrowDown weight="bold" className="size-4 transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
          </Link>
        </div>

        <div className="lg:col-span-5">
          <HeroMirror />
        </div>
      </Container>
    </section>
  );
}
