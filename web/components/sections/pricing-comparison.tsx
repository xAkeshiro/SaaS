import Link from "next/link";
import { Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { pricing, pricingExtras } from "@/lib/content";
import { cn } from "@/lib/utils";

type CellValue = (typeof pricing.comparison.rows)[number]["values"][number];

const { columns, rows } = pricing.comparison;
const { comparison: copy } = pricingExtras;
const plusIndex = columns.indexOf("Plus");
const LIT = "bg-amber/[0.16]";

/** Feature-by-plan table for `/pricing`, on one sheet of glass. Scrolls sideways on narrow screens. */
export function PricingComparison() {
  return (
    <section aria-labelledby="compare-title" className="relative py-24 sm:py-28">
      <Container>
        <div className="max-w-[36rem]">
          <h2 id="compare-title" className="display-2 on-tile text-wall-ink">
            {copy.title}
          </h2>
          <p className="lede on-tile mt-5 text-wall-muted">{copy.sub}</p>
        </div>

        {/* Phones: one feature at a time, the three plans side by side under it. */}
        <ul className="glass-panel mt-12 flex flex-col px-5 py-2 md:hidden">
          {rows.map((row) => (
            <li key={row.feature} className="border-b border-ink/10 py-4 last:border-b-0">
              <p className="text-[0.9688rem] font-semibold text-ink">{row.feature}</p>
              <dl className="mt-2 grid grid-cols-3 gap-3">
                {row.values.map((value, i) => (
                  <div key={columns[i]} className="min-w-0">
                    <dt className="text-[0.8125rem] font-semibold text-ink-muted">{columns[i]}</dt>
                    <dd className="mt-0.5 text-[0.9375rem]">
                      <Cell value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>

        <div className="glass-panel mt-12 hidden overflow-hidden md:block">
          <div role="region" aria-labelledby="compare-title" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[0.9688rem]">
              <caption className="sr-only">{copy.title}</caption>
              <colgroup>
                <col className="w-[40%]" />
                {columns.map((col) => (
                  <col key={col} className="w-[20%]" />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-ink/10">
                  <th scope="col" className="px-6 py-5 text-left text-[0.9375rem] font-semibold text-ink-muted md:px-8">
                    {copy.featureColumn}
                  </th>
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn("px-4 py-5 text-center text-[1.0625rem] font-bold text-ink", i === plusIndex && LIT)}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature} className="border-b border-ink/10">
                    <th scope="row" className="px-6 py-4 text-left font-medium text-ink md:px-8">
                      {row.feature}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={columns[i]} className={cn("px-4 py-4 text-center", i === plusIndex && LIT)}>
                        <Cell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-6 py-6 md:px-8" />
                  {columns.map((col, i) => {
                    const tier = pricing.tiers.find((t) => t.name === col);
                    if (!tier) return <td key={col} />;
                    return (
                      <td key={col} className={cn("px-3 py-6 text-center", i === plusIndex && LIT)}>
                        <Button asChild size="sm" variant={tier.highlight ? "amber" : "outlineInk"}>
                          <Link href={tier.cta.href}>{tier.cta.label}</Link>
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Cell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-wall">
        <Check weight="bold" className="size-5" aria-hidden="true" />
        <span className="sr-only">{copy.included}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-ink-muted">
        <Minus weight="bold" className="size-4" aria-hidden="true" />
        <span className="sr-only">{copy.notIncluded}</span>
      </span>
    );
  }
  return <span className="tnum font-semibold text-ink">{value}</span>;
}
