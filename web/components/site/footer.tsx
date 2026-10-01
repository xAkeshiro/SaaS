import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Container } from "@/components/site/container";
import { footer, footnotes, site } from "@/lib/content";

/**
 * `notes` lists the footnote numbers this page cites (1-based, as in `footnotes`). Only those print,
 * under their original numbers, so a page that cites nothing shows no sources.
 */
export function Footer({ notes = [] }: { notes?: readonly number[] } = {}) {
  const shown = footnotes.map((f, i) => ({ f, n: i + 1 })).filter((x) => notes.includes(x.n));
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{footer.blurb}</p>
            <p className="text-sm text-muted-foreground">{site.status}</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              {/* Each link is a 44px row on touch screens; from md the rows tighten back to text height.
                  The row's own padding stands in for the heading's margin below md. */}
              <h3 className="text-sm font-semibold text-foreground md:mb-3">{col.title}</h3>
              <ul className="flex flex-col md:gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground md:min-h-0"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8">
          {shown.length > 0 ? (
            <ol className="flex max-w-[60ch] flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
              {shown.map(({ f, n }) => (
                <li key={n} id={`fn-${n}`} className="flex gap-2">
                  <span className="font-medium tabular-nums text-amber-ink">{n}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <p className="max-w-[60ch] text-xs leading-relaxed text-muted-foreground">{footer.finePrint}</p>
          <p className="text-xs text-muted-foreground">© 2026 {site.name}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
