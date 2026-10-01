import { Container } from "@/components/site/container";
import { Reveal, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { faq, faqHeading, site } from "@/lib/content";

/**
 * Every answer stays open: they are one to three sentences, and the privacy and therapy ones are
 * exactly what an anxious visitor came to read, so hiding them behind clicks costs more than it saves.
 */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 py-20 md:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="self-start lg:sticky lg:top-28 lg:col-span-4">
            <Reveal className="flex flex-col gap-4">
              <SectionHeading align="left" title={faqHeading.title} />
              <p className="text-base leading-relaxed text-muted-foreground">
                {faqHeading.contact}
                <br />
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:decoration-foreground"
                >
                  {site.contactEmail}
                </a>
              </p>
            </Reveal>
          </div>

          <Reveal group staggerBy={0.05} className="min-w-0 lg:col-span-8">
            <dl className="border-b border-border">
              {faq.map((item) => (
                <RevealItem
                  key={item.q}
                  className="grid gap-2 border-t border-border py-6 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-8"
                >
                  <dt className="font-display text-lg leading-snug font-semibold text-foreground break-words">{item.q}</dt>
                  <dd className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">{item.a}</dd>
                </RevealItem>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
