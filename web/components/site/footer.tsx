import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Container } from "@/components/site/container";
import { footer, footnotes, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{footer.blurb}</p>
            <p className="eyebrow text-amber-ink">{site.status}</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <ol className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
            {footnotes.map((f, i) => (
              <li key={i} id={`fn-${i + 1}`} className="flex gap-2">
                <span className="font-mono text-amber-ink">{i + 1}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[90ch] text-xs leading-relaxed text-muted-foreground">{footer.finePrint}</p>
          <p className="mt-6 text-xs text-muted-foreground">© 2026 {site.name}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
