"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { nav } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

/** Home-page sections the nav can point at, keyed by their link. */
const SECTION_LINKS = nav.links.filter((l) => l.href.startsWith("/#"));

export function Nav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // The bar turns to glass once the top of the page leaves the viewport. No scroll listener.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // On the home page, the link for the section in the middle of the screen stays lit.
  useEffect(() => {
    if (pathname !== "/") return;
    const targets = SECTION_LINKS.map((l) => document.getElementById(l.href.slice(2))).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSection(`/#${e.target.id}`);
          else setSection((cur) => (cur === `/#${e.target.id}` ? null : cur));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && section === href;
    const path = href.split("#")[0] || "/";
    return path !== "/" && pathname.startsWith(path);
  };
  const pill = hovered ?? nav.links.find((l) => isActive(l.href))?.href ?? null;

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-3" />
      <motion.header
        initial={reduce ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
      >
        <nav
          aria-label="Primary"
          className={cn(
            "flex h-14 w-full max-w-[1120px] items-center justify-between gap-4 rounded-full border px-3 pl-4 transition-[background-color,box-shadow,border-color] duration-300",
            scrolled
              ? "border-border bg-white/90 shadow-soft backdrop-blur-xl backdrop-saturate-150"
              : "border-transparent bg-transparent",
          )}
        >
          <Logo />

          <ul className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
            {nav.links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href} className="relative">
                  <Link
                    href={l.href}
                    aria-current={active ? (l.href.startsWith("/#") ? "location" : "page") : undefined}
                    onMouseEnter={() => setHovered(l.href)}
                    onFocus={() => setHovered(l.href)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      "relative block rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors duration-200",
                      active || hovered === l.href ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {/* One soft pill slides to whichever link is pointed at, or rests on the current one. */}
                    {pill === l.href ? (
                      <motion.span
                        layoutId="nav-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-muted"
                        transition={{ duration: 0.22, ease }}
                      />
                    ) : null}
                    <span className="relative">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href={nav.cta.href}>{nav.cta.label}</Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="rounded-b-3xl p-6 pt-14">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <ul className="flex flex-col gap-1">
                  {nav.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-3 py-3 text-lg font-medium text-foreground hover:bg-muted"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-4 w-full">
                  <Link href={nav.cta.href} onClick={() => setOpen(false)}>
                    {nav.cta.label}
                  </Link>
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </motion.header>
    </>
  );
}
