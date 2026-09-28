import { Container } from "@/components/site/container";
import { faq, faqHeading } from "@/lib/content";

/** Six short answers, all open, side by side on glass. No accordion to open one at a time. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-12">
        <h2 id="faq-title" className="display-2 on-tile max-w-[14ch] text-wall-ink lg:col-span-4">
          {faqHeading.title}
        </h2>
        <dl className="glass-panel grid gap-x-10 gap-y-9 p-7 sm:p-10 md:grid-cols-2 lg:col-span-8">
          {faq.map((f) => (
            <div key={f.q}>
              <dt className="text-[1.0625rem] leading-snug font-bold text-ink">{f.q}</dt>
              <dd className="mt-2 text-[0.9688rem] leading-relaxed text-ink-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
