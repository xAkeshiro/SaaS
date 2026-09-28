import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Container } from "@/components/site/container";
import { footer, footnotes, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.08] bg-wall-night/70">
      <Container className="pt-16 pb-12 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div className="max-w-[40ch]">
            <Logo />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-wall-muted">{footer.blurb}</p>
            <p className="mt-4 text-[0.9375rem] font-medium text-wall-ink">{site.status}</p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-sm font-semibold text-wall-ink">{col.title}</h2>
                <ul className="mt-3 flex flex-col gap-1">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="inline-block py-1.5 text-[0.9375rem] text-wall-muted transition-colors duration-150 hover:text-wall-ink hover:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 border-t border-white/[0.08] pt-8">
          <ol className="flex max-w-[62ch] flex-col gap-2 text-[0.8125rem] leading-relaxed text-wall-muted">
            {footnotes.map((f, i) => (
              <li key={i} id={`fn-${i + 1}`} className="flex scroll-mt-28 gap-2.5">
                <span className="tnum font-semibold text-amber">{i + 1}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[62ch] text-[0.8125rem] leading-relaxed text-wall-muted">{footer.finePrint}</p>
          <p className="mt-6 text-[0.8125rem] text-wall-muted">© 2026 {site.name}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
