import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { PostIt } from "@/components/world/post-it";
import { FinalCta } from "@/components/sections/final-cta";
import { manifesto, manifestoExtras } from "@/lib/content";

export const metadata: Metadata = { title: "Manifesto", description: manifesto.sub };

export default function ManifestoPage() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <section aria-labelledby="manifesto-title" className="relative pt-[120px] pb-14 sm:pt-[144px] sm:pb-20">
          <Container>
            <h1 id="manifesto-title" className="display-1 on-tile max-w-[15ch] text-wall-ink">
              {manifesto.title}
            </h1>
            <p className="lede on-tile mt-6 max-w-[44ch] text-wall-muted">{manifesto.sub}</p>
          </Container>
        </section>

        <div className="relative pb-24 sm:pb-32">
          <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* The index stays in view beside the sheet on wide screens; the footer carries the same anchors. */}
            <nav aria-label={manifestoExtras.indexLabel} className="hidden lg:col-span-3 lg:block">
              <ul className="sticky top-28 flex flex-col gap-1.5">
                {manifesto.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="on-tile block rounded-md py-1.5 text-[0.9375rem] leading-snug text-wall-muted transition-colors duration-150 hover:text-wall-ink"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* One sheet of glass: the prose reads on it at a comfortable measure. */}
            <article className="glass-panel px-6 py-10 sm:px-12 sm:py-14 lg:col-span-9 lg:px-16 lg:py-16">
              <div className="flex flex-col gap-14">
                {manifesto.sections.map((section) => (
                  <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
                    <h2
                      id={`${section.id}-title`}
                      className="max-w-[26ch] text-[clamp(1.5rem,2.3vw,2rem)] leading-[1.12] font-[740] tracking-[-0.018em] text-ink [font-stretch:92%]"
                    >
                      {section.heading}
                    </h2>
                    <div className="mt-5 flex max-w-[66ch] flex-col gap-5">
                      {section.paragraphs.map((paragraph) =>
                        paragraph === manifestoExtras.pullQuote ? (
                          <PostIt
                            key={paragraph}
                            as="blockquote"
                            tilt={-1.5}
                            className="my-4 max-w-[28rem] self-start px-7 pt-5 pb-6 text-[1.65rem] leading-[1.3] font-bold"
                          >
                            <p>{paragraph}</p>
                          </PostIt>
                        ) : (
                          <p key={paragraph} className="text-[1.0625rem] leading-[1.75] text-ink">
                            {paragraph}
                          </p>
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </div>
              <p className="mt-14 text-[1.0625rem] font-semibold text-ink">{manifestoExtras.signOff}</p>
            </article>
          </Container>
        </div>

        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
