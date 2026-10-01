import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { LogoMark } from "@/components/site/logo";
import { FinalCta } from "@/components/sections/final-cta";
import { manifesto, manifestoExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Manifesto" };

export default function ManifestoPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-hero-mesh pt-36 pb-12 md:pt-44 md:pb-16">
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <h1 className="display-lg max-w-[20ch] text-foreground">{manifesto.title}</h1>
              <p className="lede max-w-[58ch]">{manifesto.sub}</p>
            </div>
          </Container>
        </section>

        {/* Prose */}
        <article className="pb-24 md:pb-32">
          <Container>
            {/* One 68ch prose column. The sections are unordered, so they carry no numbers. */}
            <div className="mx-auto max-w-[68ch]">
              {manifesto.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 border-t border-border py-12 first:border-t-0 md:py-14"
                >
                  <h2 className="display-md max-w-[24ch] text-foreground break-words">{section.heading}</h2>
                  <div className="mt-6 flex flex-col gap-5">
                    {section.paragraphs.map((paragraph) =>
                      paragraph === manifestoExtras.pullQuote ? (
                        <blockquote
                          key={paragraph}
                          className="my-4 font-display text-2xl leading-snug font-semibold tracking-tight text-balance text-foreground md:text-[2rem]"
                        >
                          <span aria-hidden="true" className="-mb-3 block font-display text-[4.5rem] leading-none text-amber">
                            &ldquo;
                          </span>
                          {paragraph}
                        </blockquote>
                      ) : (
                        <p key={paragraph} className="text-[1.0625rem] leading-[1.75] text-foreground/85">
                          <WithFootnotes text={paragraph} />
                        </p>
                      ),
                    )}
                  </div>
                </section>
              ))}

              {/* Sign-off */}
              <p className="flex items-center gap-3 border-t border-border pt-10 font-display text-lg font-semibold text-foreground md:pt-12">
                <LogoMark className="size-8 shrink-0" />
                <span className="min-w-0 break-words">{manifestoExtras.signOff}</span>
              </p>
            </div>
          </Container>
        </article>

        <FinalCta />
      </main>
      {/* The prose cites sources 1 and 3. */}
      <Footer notes={[1, 3]} />
    </>
  );
}

/** Paragraphs mark a source as "[n]"; it renders as a superscript link to footnote n in the footer. */
function WithFootnotes({ text }: { text: string }) {
  return text.split(/\[(\d+)\]/).map((part, i) =>
    i % 2 === 1 ? (
      <sup key={i} className="ml-0.5">
        <a
          href={`#fn-${part}`}
          aria-label={`Source ${part}`}
          className="rounded-sm px-0.5 text-xs font-semibold text-amber-ink transition-colors duration-200 hover:text-foreground"
        >
          {part}
        </a>
      </sup>
    ) : (
      part
    ),
  );
}
