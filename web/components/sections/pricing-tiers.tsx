"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pricing, pricingExtras } from "@/lib/content";
import { ease, viewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";
type Tier = (typeof pricing.tiers)[number];
type HeadingLevel = "h2" | "h3";

const BILLING: readonly Billing[] = ["monthly", "yearly"];
const swap = { duration: 0.25, ease } as const;

/** 14.99 -> "14.99", 99 -> "99", 0 -> "0". */
function formatPrice(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

type PricingTiersProps = {
  className?: string;
  /** Tier names are `h3` under the home-page H2; `/pricing` puts them straight under its H1, so it passes `h2`. */
  headingLevel?: HeadingLevel;
};

/**
 * Monthly/yearly toggle plus the three tier cards. No heading, so `/pricing`
 * can put its own H1 above it and the home page its H2.
 */
export function PricingTiers({ className, headingLevel = "h3" }: PricingTiersProps) {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    // Three stacked cards are ~1600px tall on a phone; the default 20% threshold would leave a blank gap.
    <Reveal
      group
      staggerBy={0.08}
      viewport={{ ...viewport, amount: 0.1 }}
      className={cn("flex flex-col items-center gap-10 md:gap-12", className)}
    >
      <RevealItem className="flex flex-wrap items-center justify-center gap-3">
        <BillingToggle value={billing} onChange={setBilling} />
        <Badge className="bg-amber px-3 py-1 text-xs font-medium text-ink">{pricing.yearlyNote}</Badge>
      </RevealItem>

      <div className="grid w-full gap-4 lg:grid-cols-3 lg:gap-5">
        {pricing.tiers.map((tier) => (
          <RevealItem key={tier.id} className="h-full min-w-0">
            <TierCard tier={tier} billing={billing} headingLevel={headingLevel} />
          </RevealItem>
        ))}
      </div>
    </Reveal>
  );
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const id = useId();
  return (
    <div
      role="group"
      aria-label={pricingExtras.billing.label}
      className="inline-flex rounded-full border border-border bg-muted p-1"
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
              "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ease-out",
              selected ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`${id}-billing-pill`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary"
                transition={swap}
              />
            ) : null}
            <span className="relative">{pricingExtras.billing[b]}</span>
          </button>
        );
      })}
    </div>
  );
}

function TierCard({ tier, billing, headingLevel }: { tier: Tier; billing: Billing; headingLevel: HeadingLevel }) {
  const Heading = headingLevel;
  const highlight = tier.highlight;
  const badge = "badge" in tier ? tier.badge : null;
  const priceLabel = "priceLabel" in tier ? tier.priceLabel : null;
  const period = billing === "yearly" && "yearlyPeriod" in tier ? tier.yearlyPeriod : tier.period;
  const amount = tier.price ? tier.price[billing] : null;
  const metaSource = pricingExtras.meta[tier.id];
  const meta = typeof metaSource === "string" ? metaSource : metaSource[billing];

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl border border-border p-6 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 md:p-8",
        highlight ? "bg-card shadow-soft" : "bg-card/60",
      )}
    >
      {highlight ? (
        <ShineBorder shineColor={["#FFB454", "#C7CDF8"]} borderWidth={2} duration={12} />
      ) : null}

      {highlight && badge ? (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber px-3 py-1 text-xs font-medium text-ink shadow-[0_1px_2px_rgba(11,15,26,0.12)]">
          {badge}
        </Badge>
      ) : null}

      <div className="min-w-0">
        <Heading className="font-display text-xl font-semibold text-foreground">{tier.name}</Heading>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tier.blurb}</p>
      </div>

      {/* Price. The number crossfades when the billing period changes; the period slides to follow the new width. */}
      <div className="mt-7 flex flex-wrap items-end gap-x-2 gap-y-1">
        {amount !== null ? (
          <>
            <span className="relative inline-flex items-start font-display text-5xl leading-none font-bold tracking-tight text-foreground tabular-nums">
              <span className="mt-1 text-2xl font-semibold">$</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={formatPrice(amount)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={swap}
                  className="inline-block"
                >
                  {formatPrice(amount)}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span layout="position" transition={swap} className="relative inline-flex pb-1 text-sm text-muted-foreground">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={period}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={swap}
                  className="inline-block whitespace-nowrap"
                >
                  {period}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </>
        ) : (
          <>
            <span className="font-display text-5xl leading-none font-bold tracking-tight text-foreground break-words">
              {priceLabel}
            </span>
            <span className="w-full text-sm text-muted-foreground">{period}</span>
          </>
        )}
      </div>
      {/* Keyed so a changed line fades in instead of snapping. min-h keeps the card height stable. */}
      <motion.p
        key={meta}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={swap}
        className="mt-3 min-h-[1.25rem] text-xs leading-relaxed text-muted-foreground"
      >
        {meta}
      </motion.p>

      <ul className="mt-7 flex flex-col gap-3 border-t border-border pt-7">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber-ink">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="min-w-0 break-words">{feature}</span>
          </li>
        ))}
      </ul>

      {/* mt-auto pins every CTA to the card's bottom edge, so Free's shorter list does not leave its button floating. */}
      <div className="mt-auto pt-8">
        <Button asChild size="lg" variant={tier.id === "teams" ? "outline" : "default"} className="w-full">
          <Link href={tier.cta.href}>{tier.cta.label}</Link>
        </Button>
      </div>
    </article>
  );
}
