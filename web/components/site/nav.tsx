"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Dialog } from "radix-ui";
import { List, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { Logo } from "@/components/site/logo";
import { nav } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // The bar picks up a backing once the page moves under it. An observer, not a scroll listener.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isActive = (href: string) => {
    const path = href.split("#")[0] || "/";
    return path !== "/" && pathname.startsWith(path);
  };

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-6 w-px" />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top,0px)] transition-[background-color,box-shadow] duration-200 ease-out",
          scrolled ? "bg-wall-night/95 shadow-[0_1px_0_rgba(242,247,244,0.08)]" : "bg-transparent",
        )}
      >
        <Container>
          <nav aria-label="Primary" className="flex h-[72px] items-center justify-between gap-6">
            <Logo />

            <ul className="hidden items-center gap-1 lg:flex">
              {nav.links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-wall-ink",
                        active
                          ? "text-wall-ink underline decoration-amber decoration-2 underline-offset-[10px]"
                          : "text-wall-muted",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-1.5">
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={nav.cta.href}>{nav.cta.label}</Link>
              </Button>

              <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Trigger asChild>
                  <Button variant="quiet" size="icon" className="lg:hidden" aria-label="Open menu">
                    <List weight="bold" className="size-6" />
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="menu-overlay fixed inset-0 z-50 bg-[rgba(4,26,20,0.55)]" />
                  <Dialog.Content
                    aria-describedby={undefined}
                    className="menu-panel fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto bg-wall-night pt-[env(safe-area-inset-top,0px)] pb-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
                  >
                    <Dialog.Title className="sr-only">Menu</Dialog.Title>
                    <Container>
                      <div className="flex h-[72px] items-center justify-between">
                        <Logo />
                        <Dialog.Close asChild>
                          <Button variant="quiet" size="icon" aria-label="Close menu">
                            <X weight="bold" className="size-6" />
                          </Button>
                        </Dialog.Close>
                      </div>
                      <ul className="mt-4 flex flex-col">
                        {nav.links.map((l, i) => (
                          <li key={l.href} className="menu-link" style={{ "--d": `${60 + i * 45}ms` } as CSSProperties}>
                            <Link
                              href={l.href}
                              onClick={() => setOpen(false)}
                              aria-current={isActive(l.href) ? "page" : undefined}
                              className="block rounded-xl py-3 text-[1.75rem] font-bold tracking-[-0.02em] text-wall-ink [font-stretch:90%] aria-[current=page]:text-amber"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Button asChild size="lg" className="menu-link mt-6 w-full" style={{ "--d": "300ms" } as CSSProperties}>
                        <Link href={nav.cta.href} onClick={() => setOpen(false)}>
                          {nav.cta.label}
                        </Link>
                      </Button>
                    </Container>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </nav>
        </Container>
      </header>
    </>
  );
}
