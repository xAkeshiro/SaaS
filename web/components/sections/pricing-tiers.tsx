"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CtaArrow } from "@/components/site/cta-arrow";
import { PostIt } from "@/components/world/post-it";
import { pricing, pricingExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";
type Tier = (typeof pricing.tiers)[number];
type HeadingLevel = "h2" | "h3";

const BILLING: readonly Billing[] = ["monthly", "yearly"];
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** 14.99 -> "14.99", 99 -> "99", 0 -> "0". */
function formatPrice(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/** The billing switch sits on the tile; the three plans hang below it as glass. */
export function BillingSwitch({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        role="group"
        aria-label={pricingExtras.billing.label}
        className="inline-flex rounded-full bg-wall-night/80 p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
      >
        {BILLING.map((b) => {
          const selected = value === b;
          return (
            <button
              key={b}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(b)}
              className={cn(
                "press relative h-10 rounded-full px-5 text-[0.9375rem] font-semibold transition-colors duration-150",
                selected ? "text-ink" : "text-wall-muted hover:text-wall-ink",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={`${id}-billing`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-glass shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  transition={{ duration: 0.24, ease: EASE_OUT }}
                />
              ) : null}
              <span className="relative">{pricingExtras.billing[b]}</span>
            </button>
          );
        })}
      </div>
      <PostIt tilt={3} className="px-3 pt-1 pb-1.5 text-[1.05rem] font-bold">
        {pricing.yearlyNote}
      </PostIt>
    </div>
  );
}

type PricingTiersProps = {
  className?: string;
  /** Tier names are `h3` under the home-page H2; `/pricing` puts them straight under its H1, so it passes `h2`. */
  headingLevel?: HeadingLevel;
  /** Rendered above the plans, in the same row as the switch on wide screens. */
  heading?: React.ReactNode;
};

export function PricingTiers({ className, headingLevel = "h3", heading }: PricingTiersProps) {
  const [billing, setBilling] = useState<Billing>("monthly");
  return (
    <div className={className}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        {heading}
        <BillingSwitch value={billing} onChange={setBilling} />
      </div>
      <ul className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-5">
        {pricing.tiers.map((tier) => (
          <li key={tier.id} className="min-w-0">
            <TierPanel tier={tier} billing={billing} headingLevel={headingLevel} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierPanel({ tier, billing, headingLevel }: { tier: Tier; billing: Billing; headingLevel: HeadingLevel }) {
  const Heading = headingLevel;
  const lit = tier.highlight;
  const badge = "badge" in tier ? tier.badge : null;
  const priceLabel = "priceLabel" in tier ? tier.priceLabel : null;
  const period = billing === "yearly" && "yearlyPeriod" in tier ? tier.yearlyPeriod : tier.period;
  const amount = tier.price ? tier.price[billing] : null;
  const metaSource = pricingExtras.meta[tier.id];
  const meta = typeof metaSource === "string" ? metaSource : metaSource[billing];

  return (
    <article
      className="glass-panel relative isolate flex h-full flex-col overflow-visible p-7 sm:p-8"
    >
      {/* The recommended plan is the one with the light on: a strip lamp on its top edge, its light falling down the glass. */}
      {lit ? (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,186,96,0.34)_0%,rgba(255,186,96,0.1)_30%,rgba(255,186,96,0)_52%)]"
          />
          <span aria-hidden="true" className="absolute inset-x-8 top-0 h-[5px] rounded-b-full bg-amber shadow-[0_2px_0_rgba(170,100,20,0.25)]" />
        </>
      ) : null}
      {lit && badge ? (
        <PostIt tilt={4} className="absolute -top-4 right-5 px-3 pt-1 pb-1.5 text-[1.05rem] font-bold">
          {badge}
        </PostIt>
      ) : null}

      <Heading className="display-3 text-ink">{tier.name}</Heading>
      <p className="mt-1.5 text-[0.9688rem] leading-relaxed text-ink-muted">{tier.blurb}</p>

      {/* The number crossfades through a blur when the period changes; it never slides. */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {amount !== null ? (
          <span className="inline-flex items-baseline text-[3.25rem] leading-none font-[780] tracking-[-0.03em] text-ink [font-stretch:88%]">
            <span className="mr-0.5 text-[1.75rem] font-[700]">$</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={formatPrice(amount)}
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.14 } }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="inline-block"
              >
                {formatPrice(amount)}
              </motion.span>
            </AnimatePresence>
          </span>
        ) : (
          <span className="text-[2.6rem] leading-none font-[780] tracking-[-0.03em] text-ink [font-stretch:88%]">
            {priceLabel}
          </span>
        )}
        <span className="text-[0.9688rem] font-medium text-ink-muted">{period}</span>
      </div>
      <p className="mt-2 min-h-[1.5em] text-[0.9375rem] text-ink-muted">{meta}</p>

      <ul className="mt-7 flex flex-col gap-3">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-3 text-[0.9688rem] leading-snug text-ink">
            <Check weight="bold" aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-wall" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-9">
        <Button asChild size="lg" variant={lit ? "amber" : "outlineInk"} className="w-full justify-between pr-2.5 pl-6">
          <Link href={tier.cta.href}>
            {tier.cta.label}
            <CtaArrow />
          </Link>
        </Button>
      </div>
    </article>
  );
}
