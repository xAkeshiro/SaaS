import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { pricing } from "@/lib/content";

export { PricingTiers } from "@/components/sections/pricing-tiers";

/** Home-page pricing section: heading plus the shared tiers block. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-28 py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title} sub={pricing.sub} />
        </Reveal>
        <PricingTiers className="mt-12 md:mt-14" />
      </Container>
    </section>
  );
}
