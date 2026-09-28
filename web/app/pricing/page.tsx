import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { PricingTiers } from "@/components/sections/pricing";
import { PricingComparison } from "@/components/sections/pricing-comparison";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { pricing } from "@/lib/content";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="bg-hero-mesh pt-36 pb-20 md:pt-44 md:pb-24">
          <Container>
            <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="eyebrow text-amber-ink">{pricing.eyebrow}</span>
              <h1 className="display-lg max-w-[20ch] text-foreground">{pricing.title}</h1>
              <p className="lede max-w-[58ch]">{pricing.sub}</p>
            </Reveal>
            <PricingTiers headingLevel="h2" className="mt-14 md:mt-16" />
          </Container>
        </section>

        <PricingComparison />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
