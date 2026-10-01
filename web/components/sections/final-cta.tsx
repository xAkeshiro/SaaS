import { Container } from "@/components/site/container";
import { EmailCapture } from "@/components/site/email-capture";
import { finalCta } from "@/lib/content";
import { cn } from "@/lib/utils";

type FinalCtaProps = {
  /**
   * Render its own dark band (inner pages). The home page passes `false` because it already
   * sits inside the shared dark block with AntiCompanion; a hairline separates the two instead.
   */
  band?: boolean;
};

export function FinalCta({ band = true }: FinalCtaProps) {
  return (
    <section
      id="early-access-bottom"
      className={cn("scroll-mt-28", band && "dark bg-band-ink text-foreground")}
    >
      <Container>
        <div className={cn("py-24 md:py-32", !band && "border-t border-white/10")}>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="display-lg text-white">{finalCta.title}</h2>
            <p className="lede text-white/70">{finalCta.sub}</p>
            <EmailCapture source="footer-cta" inverted note={finalCta.note} className="mt-2 text-center" />
          </div>
        </div>
      </Container>
    </section>
  );
}
