import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { LogoMark } from "@/components/site/logo";
import { Reveal } from "@/components/site/reveal";
import { FinalCta } from "@/components/sections/final-cta";
import { manifesto, manifestoExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Manifesto" };

export default function ManifestoPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-mesh pt-36 pb-12 md:pt-44 md:pb-16">
          <Container>
            <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="eyebrow text-amber-ink">{manifestoExtras.eyebrow}</span>
              <h1 className="display-lg max-w-[20ch] text-foreground">{manifesto.title}</h1>
              <p className="lede max-w-[58ch]">{manifesto.sub}</p>
            </Reveal>
          </Container>
        </section>

        {/* Prose */}
        <article className="pb-24 md:pb-32">
          <Container>
            {/* 68ch of prose plus the index column at md and up. */}
            <div className="mx-auto max-w-[68ch] md:max-w-[calc(68ch_+_5rem)]">
              {manifesto.sections.map((section, i) => (
                <Reveal key={section.id} className="border-t border-border first:border-t-0">
                  <section id={section.id} className="scroll-mt-28 py-12 md:grid md:grid-cols-[3.5rem_1fr] md:gap-6 md:py-14">
                    <span
                      aria-hidden="true"
                      className="mb-4 block font-mono text-sm font-medium text-amber-ink md:mb-0 md:pt-2"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="display-md max-w-[24ch] text-foreground break-words">{section.heading}</h2>
                      <div className="mt-6 flex flex-col gap-5">
                        {section.paragraphs.map((paragraph) =>
                          paragraph === manifestoExtras.pullQuote ? (
                            <blockquote
                              key={paragraph}
                              className="my-2 border-l-4 border-amber pl-6 font-display text-2xl leading-snug font-semibold tracking-tight text-foreground md:text-[1.75rem]"
                            >
                              {paragraph}
                            </blockquote>
                          ) : (
                            <p key={paragraph} className="text-[1.0625rem] leading-[1.75] text-foreground/85">
                              {paragraph}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  </section>
                </Reveal>
              ))}

              {/* Sign-off */}
              <Reveal className="border-t border-border pt-10 md:pt-12">
                <p className="flex items-center gap-3 font-display text-lg font-semibold text-foreground md:pl-20">
                  <LogoMark className="size-8 shrink-0" />
                  <span className="min-w-0 break-words">{manifestoExtras.signOff}</span>
                </p>
              </Reveal>
            </div>
          </Container>
        </article>

        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
