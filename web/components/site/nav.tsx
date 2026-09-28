"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { nav } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export function Nav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    const path = href.split("#")[0] || "/";
    return path !== "/" && pathname.startsWith(path);
  };

  return (
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
          scrolled ? "glass shadow-soft" : "border-transparent bg-transparent",
        )}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {nav.links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground",
                  isActive(l.href) && "text-foreground",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={nav.cta.href}>{nav.cta.label}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
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
  );
}
