import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/site/container";
import { principles } from "@/lib/content";

/** A quiet passage after the busy ones: the stance, in words only. */
export function Principles() {
  return (
    <section aria-labelledby="principles-title" className="relative py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="principles-title" className="display-2 on-tile max-w-[14ch] text-wall-ink">
            {principles.title}
          </h2>
          <p className="lede on-tile mt-6 max-w-[38ch] text-wall-muted">{principles.intro}</p>
          <Link
            href={principles.cta.href}
            className="press group mt-8 inline-flex h-11 items-center gap-2 rounded-full pr-2 text-[1.0625rem] font-semibold text-amber transition-colors duration-150 hover:text-[#ffc97a]"
          >
            {principles.cta.label}
            <ArrowRight weight="bold" className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="flex flex-col gap-11 lg:col-span-6 lg:col-start-7 lg:pt-2">
          {principles.items.map((p) => (
            <li key={p.title}>
              <h3 className="display-3 on-tile text-wall-ink">{p.title}</h3>
              <p className="on-tile mt-2.5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-wall-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
