import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { principles } from "@/lib/content";

/**
 * Home-only principles band. It has no background of its own: the page wraps it and the
 * final CTA in one dark block so the theme switches once.
 */
export function AntiCompanion() {
  return (
    <section className="relative">
      <Container className="py-24 md:py-28">
        <SectionHeading inverted title={principles.title} sub={principles.intro} />

        {/* Unordered commitments, so typographic rows rather than numbered tiles. */}
        <dl className="mt-14 grid gap-x-12 gap-y-10 md:mt-16 md:grid-cols-2">
          {principles.items.map((item) => (
            <div key={item.title} className="min-w-0 border-t border-white/15 pt-6">
              <dt className="font-display text-2xl leading-snug font-semibold text-white break-words">
                {item.title}
              </dt>
              <dd className="mt-3 max-w-[44ch] text-base leading-relaxed text-white/70">{item.body}</dd>
            </div>
          ))}
        </dl>

        {/* Outline, not amber: the email capture just below is the block's one primary action. */}
        <div className="mt-14 flex justify-center">
          <Button asChild variant="outline" size="lg" className="group w-full sm:w-auto">
            <Link href={principles.cta.href}>
              {principles.cta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
