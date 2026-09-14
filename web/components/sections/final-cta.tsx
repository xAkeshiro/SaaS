import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { Reveal } from "@/components/site/reveal";
import { finalCta } from "@/lib/content";

export function FinalCta() {
  return (
    <section id="early-access-bottom" className="dark bg-band-ink text-foreground scroll-mt-28">
      <Container className="py-24 md:py-32">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <span className="text-eyebrow text-amber">Early access</span>
          <h2 className="text-display-lg text-white">{finalCta.title}</h2>
          <p className="text-lede text-white/70">{finalCta.sub}</p>
          <EmailCapture source="footer-cta" inverted note={finalCta.note} className="mt-2 items-center" />
        </Reveal>
      </Container>
    </section>
  );
}
