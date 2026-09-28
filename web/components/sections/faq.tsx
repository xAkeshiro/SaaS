import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq, faqHeading } from "@/lib/content";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionHeading eyebrow={faqHeading.eyebrow} title={faqHeading.title} />
          </Reveal>

          <Reveal className="mt-12 md:mt-14">
            <Accordion
              type="single"
              collapsible
              className="rounded-3xl border border-border bg-card px-5 sm:px-6 md:px-8"
            >
              {faq.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline [&>svg]:mt-0.5 [&>svg]:size-[1.125rem] [&>svg]:transition-[transform,color] [&:hover>svg]:text-foreground">
                    <span className="min-w-0 break-words pr-2">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[60ch] pb-6 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
