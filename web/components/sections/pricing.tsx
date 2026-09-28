import { Container } from "@/components/site/container";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { pricing } from "@/lib/content";

export { PricingTiers } from "@/components/sections/pricing-tiers";

/** Home-page pricing: the heading shares a row with the billing switch, the plans hang below. */
export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container>
        <PricingTiers
          heading={
            <div className="max-w-[36rem]">
              <h2 id="pricing-title" className="display-2 on-tile text-wall-ink">
                {pricing.title}
              </h2>
              <p className="lede on-tile mt-5 text-wall-muted">{pricing.sub}</p>
            </div>
          }
        />
      </Container>
    </section>
  );
}
