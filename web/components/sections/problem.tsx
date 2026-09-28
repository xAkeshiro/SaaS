import { Container } from "@/components/site/container";
import { problem } from "@/lib/content";

function Ref({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 align-super text-[0.5em] font-bold">
      <a
        href={`#fn-${n}`}
        aria-label={`Source ${n}`}
        className="-m-2 inline-grid min-h-6 min-w-6 place-items-center rounded-full p-2 text-amber no-underline transition-colors duration-150 hover:text-wall-ink"
      >
        {n}
      </a>
    </sup>
  );
}

/** The problem as plain statements on the wall, with their sources. No stat strip. */
export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="relative py-24 sm:py-32">
      <Container>
        <h2 id="problem-title" className="display-2 on-tile max-w-[19ch] text-wall-ink">
          <span className="text-amber">{problem.lead.value}</span> {problem.lead.text}
          <Ref n={problem.lead.footnote} />
        </h2>

        <div className="mt-14 grid max-w-[68rem] gap-10 md:grid-cols-2 md:gap-16">
          <p className="on-tile text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.3] font-[620] text-wall-ink [font-stretch:95%]">
            <span className="text-amber">{problem.second.value}</span> {problem.second.text}
            <Ref n={problem.second.footnote} />
          </p>
          <p className="on-tile text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.3] font-[620] text-wall-ink [font-stretch:95%]">
            {problem.third.text}
            <Ref n={problem.third.footnote} /> <span className="text-wall-muted">{problem.third.close}</span>
          </p>
        </div>
      </Container>
    </section>
  );
}
