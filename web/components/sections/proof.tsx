import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { proof, stats } from "@/lib/content";

/**
 * A heading over the two sourced stats. The numbers are static text, no ticker,
 * so they read the moment the block arrives. Sources live in the footer (#fn-N).
 */
export function Proof() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="proof-heading">
      <Container>
        <Reveal>
          <h2 id="proof-heading" className="display-md max-w-[22ch] text-foreground">
            {proof.title}
          </h2>

          <div className="mt-8 grid gap-10 border-t border-border pt-10 md:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.footnote} className="min-w-0">
                <p className="flex items-start font-display text-5xl leading-none font-bold tracking-tight text-foreground tabular-nums lg:text-6xl">
                  <span>
                    {stat.value}
                    {stat.suffix}
                  </span>
                  {/* size-6 keeps a 24px hit area around a superscript-sized digit. */}
                  <a
                    href={`#fn-${stat.footnote}`}
                    aria-label={`Source ${stat.footnote}`}
                    className="-mt-1 ml-0.5 grid size-6 shrink-0 place-items-center rounded-sm font-sans text-xs font-semibold tracking-normal text-amber-ink tabular-nums transition-colors duration-200 hover:text-foreground"
                  >
                    {stat.footnote}
                  </a>
                </p>
                <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
