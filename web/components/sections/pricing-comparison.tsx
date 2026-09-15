import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { pricing, pricingExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type CellValue = (typeof pricing.comparison.rows)[number]["values"][number];

const { columns, rows } = pricing.comparison;
const { comparison: copy } = pricingExtras;
const plusIndex = columns.indexOf("Plus");
const plusTier = pricing.tiers.find((t) => t.id === "plus");

/** Feature-by-plan table for `/pricing`. Scrolls horizontally on narrow screens. */
export function PricingComparison() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={copy.eyebrow} title={copy.title} sub={copy.sub} />
        </Reveal>

        <Reveal className="mt-12 md:mt-14">
          <div className="overflow-x-auto rounded-3xl border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              {/* caption must be the table's first child */}
              <caption className="sr-only">{copy.title}</caption>
              <colgroup>
                <col className="w-[40%]" />
                {columns.map((col) => (
                  <col key={col} className="w-[20%]" />
                ))}
              </colgroup>

              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-6 py-5 text-left eyebrow text-muted-foreground md:px-8">
                    {copy.featureColumn}
                  </th>
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        "px-4 py-5 text-center align-top font-display text-base font-semibold text-foreground",
                        i === plusIndex && "bg-lavender/30",
                      )}
                    >
                      <span className="inline-flex flex-col items-center gap-1.5">
                        {col}
                        {i === plusIndex && plusTier && "badge" in plusTier ? (
                          <span className="rounded-full bg-amber px-2.5 py-0.5 font-sans text-[0.6875rem] font-medium text-ink">
                            {plusTier.badge}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature} className="border-b border-border">
                    <th scope="row" className="px-6 py-4 text-left font-medium text-foreground md:px-8">
                      {row.feature}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={columns[i]}
                        className={cn("px-4 py-4 text-center", i === plusIndex && "bg-lavender/30")}
                      >
                        <Cell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td className="px-6 py-5 md:px-8" />
                  {columns.map((col, i) => {
                    const tier = pricing.tiers.find((t) => t.name === col);
                    if (!tier) return <td key={col} />;
                    return (
                      <td
                        key={col}
                        className={cn("px-4 py-5 text-center", i === plusIndex && "bg-lavender/30")}
                      >
                        <Button asChild size="sm" variant={tier.highlight ? "default" : "outline"}>
                          <Link href={tier.cta.href}>{tier.cta.label}</Link>
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Cell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber/20 text-amber-ink">
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">{copy.included}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex size-6 items-center justify-center text-muted-foreground/70">
        <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
        <span className="sr-only">{copy.notIncluded}</span>
      </span>
    );
  }
  return <span className="font-mono text-[0.8125rem] font-medium text-foreground">{value}</span>;
}
