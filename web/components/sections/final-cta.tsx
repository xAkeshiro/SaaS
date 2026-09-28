import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { FinalMirror } from "@/components/sections/final-mirror";
import { finalCta } from "@/lib/content";

/** The close: the last mirror on the wall, where you say it first. */
export function FinalCta() {
  return (
    <section id="early-access-bottom" aria-labelledby="final-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container className="flex flex-col items-center text-center">
        <FinalMirror id="final-title" title={finalCta.title} />
        <p className="lede on-tile mt-12 max-w-[44ch] text-wall-muted">{finalCta.sub}</p>
        <EmailCapture source="footer-cta" note={finalCta.note} className="mx-auto mt-8 text-left" />
      </Container>
    </section>
  );
}
