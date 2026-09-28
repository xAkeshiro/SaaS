import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { PricingTiers } from "@/components/sections/pricing";
import { PricingComparison } from "@/components/sections/pricing-comparison";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { pricing } from "@/lib/content";

export const metadata: Metadata = { title: "Pricing", description: `${pricing.title} ${pricing.sub}` };

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section aria-labelledby="pricing-title" className="relative pt-[120px] pb-20 sm:pt-[144px] sm:pb-24">
          <Container>
            <PricingTiers
              headingLevel="h2"
              heading={
                <div className="max-w-[38rem]">
                  <h1 id="pricing-title" className="display-1 on-tile text-wall-ink">
                    {pricing.title}
                  </h1>
                  <p className="lede on-tile mt-6 text-wall-muted">{pricing.sub}</p>
                </div>
              }
            />
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
