"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricing, pricingExtras } from "@/lib/content";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";
type Tier = (typeof pricing.tiers)[number];
type HeadingLevel = "h2" | "h3";

const BILLING: readonly Billing[] = ["monthly", "yearly"];
const swap = { duration: 0.25, ease } as const;
/** Exits leave faster than entrances arrive, so the new value is never waiting on the old one. */
const leave = { duration: 0.14, ease } as const;

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
    <div className={cn("flex flex-col items-center gap-10 md:gap-12", className)}>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <BillingToggle value={billing} onChange={setBilling} />
        <span className="text-[0.8125rem] font-medium text-amber-ink">{pricing.yearlyNote}</span>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-3 lg:gap-5">
        {pricing.tiers.map((tier) => (
          <div key={tier.id} className="h-full min-w-0">
            <TierCard tier={tier} billing={billing} headingLevel={headingLevel} />
          </div>
        ))}
      </div>
    </div>
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
              // Transition `scale`, not `transform`: Tailwind v4's active:scale-* sets the standalone property.
              // min-h-11 gives phones a 44px tap target.
              "relative min-h-11 rounded-full px-4 py-1.5 text-sm font-medium transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97] md:min-h-0",
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
    // Not clickable, so no hover state: only the CTA inside responds. lg:p-6 gives the three
    // columns enough room at 1024px for Teams' price and period to share a line.
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-6 md:p-8 lg:p-6 xl:p-8",
        highlight
          ? // Arbitrary shadow, not shadow-soft: the custom utility sets box-shadow outright and would erase the ring.
            "border-transparent bg-card shadow-[0_1px_2px_rgba(11,15,26,0.04),0_12px_40px_-16px_rgba(11,15,26,0.14)] ring-2 ring-amber/70"
          : "border-border bg-card/60",
      )}
    >
      {/* Fixed-height rows (blurb, price, meta) keep the dividers and feature lists level across the three columns. */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Heading className="font-display text-xl font-semibold text-foreground">{tier.name}</Heading>
          {highlight && badge ? <span className="text-xs font-medium text-amber-ink">{badge}</span> : null}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground lg:min-h-[2.875rem]">{tier.blurb}</p>
      </div>

      {/* Price. The number crossfades when the billing period changes; the period slides to follow the new width.
          No wrap: the period shrinks onto extra lines instead of dropping under the number. */}
      <div className="mt-7 flex min-h-[3.5rem] items-end gap-x-2">
        {amount !== null ? (
          <>
            <span className="relative inline-flex shrink-0 items-start font-display text-5xl leading-none font-bold tracking-tight text-foreground tabular-nums">
              <span className="mt-1 text-2xl font-semibold">$</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={formatPrice(amount)}
                  initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(6px)", transition: leave }}
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
                  exit={{ opacity: 0, transition: leave }}
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
            <span className="shrink-0 font-display text-5xl leading-none font-bold tracking-tight whitespace-nowrap text-foreground">
              {priceLabel}
            </span>
            <span className="max-w-[6.5rem] min-w-0 pb-1 text-sm leading-tight text-muted-foreground">{period}</span>
          </>
        )}
      </div>
      {/* Keyed so a changed line fades in instead of snapping. min-h keeps the card height stable,
          and two lines at lg because the narrow columns wrap the longer lines. */}
      <motion.p
        key={meta}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={swap}
        className="mt-3 min-h-[1.25rem] text-xs leading-relaxed text-muted-foreground lg:min-h-[2.5rem]"
      >
        {meta}
      </motion.p>

      <ul className="mt-7 flex flex-col gap-3 border-t border-border pt-7">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber-ink">
              <Check className="size-3" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="min-w-0 break-words">{feature}</span>
          </li>
        ))}
      </ul>

      {/* mt-auto pins every CTA to the card's bottom edge, so Free's shorter list does not leave its button floating.
          Only the highlighted tier gets a filled button, so the emphasis lands on the plan the ring points to. */}
      <div className="mt-auto pt-8">
        <Button asChild size="lg" variant={tier.highlight ? "accent" : "outline"} className="w-full">
          <Link href={tier.cta.href}>{tier.cta.label}</Link>
        </Button>
      </div>
    </article>
  );
}
