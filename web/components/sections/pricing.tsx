import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { pricing } from "@/lib/content";

export { PricingTiers } from "@/components/sections/pricing-tiers";

/** Home-page pricing section: heading plus the shared tiers block. No kicker: the H2 already says it. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-28 py-20 md:py-24">
      <Container>
        <SectionHeading title={pricing.title} sub={pricing.sub} />
        <PricingTiers className="mt-12 md:mt-14" />
      </Container>
    </section>
  );
}
