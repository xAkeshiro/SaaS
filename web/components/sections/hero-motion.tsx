"use client";

import { Fragment } from "react";
import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { ease, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * Hero entrance values are whole `transform` strings, not x/y/scale shorthands: motion can hand a
 * plain transform to the compositor, so the entrance keeps its frames while hydration busies the
 * main thread. The global MotionConfig only neutralizes shorthand keys, so every element that
 * animates `transform` here also carries `motion-reduce:transform-none!`: reduced motion keeps
 * the fades and drops the movement. The !important beats both motion's inline style and WAAPI.
 */
const REDUCE_FLAT = "motion-reduce:transform-none!";

/** `custom` is the item's delay in seconds from the hero's mount, so each one waits its turn. */
const rise: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)" },
  show: (delay: number = 0) => ({ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.4, ease, delay } }),
};

const word: Variants = {
  hidden: { opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" },
  show: { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)", transition: { duration: 0.45, ease } },
};

const windowIn: Variants = {
  hidden: { opacity: 0, transform: "translateY(16px) scale(0.97)" },
  show: { opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.6, ease, delay: 0.55 } },
};

/**
 * Page-load entrance for the hero. Animates on mount (not on scroll), in reading order:
 * pill (0s) -> H1 word by word (0.05 to 0.32s) -> sub (0.35s) -> form (0.41s) -> window (0.55s).
 * The parent does not stagger: a 10-word headline is one child here, so a sibling stagger would
 * raise the sub and form before the headline's last words. Each item carries its own delay instead.
 */
export function HeroStagger({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(className)} variants={stagger(0, 0)} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.div>
  );
}

export function HeroItem({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(REDUCE_FLAT, className)} variants={rise} {...rest}>
      {children}
    </motion.div>
  );
}

/**
 * The headline arrives word by word, each word sharpening out of a light blur, 30 ms apart.
 * The emphasised word keeps its hand-drawn underline, which draws as the last word lands.
 */
export function HeroHeadline({ text, emphasis, className }: { text: string; emphasis: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h1 className={className} variants={stagger(0.03, 0.05)}>
      {words.map((w, i) => {
        const bare = w.replace(/[.,!?]$/, "");
        const tail = w.slice(bare.length);
        return (
          <Fragment key={i}>
            <motion.span variants={word} className={cn("inline-block", REDUCE_FLAT)}>
              {bare === emphasis ? (
                <>
                  <UnderlinedWord>{bare}</UnderlinedWord>
                  {tail}
                </>
              ) : (
                w
              )}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </motion.h1>
  );
}

/**
 * The product window: it rises in last, flat, so the transcript is sharp from the first frame.
 * No scroll-linked lean: below about 1680px wide it never finished by first paint, and the
 * tilted text was resampled soft.
 */
export function HeroMock({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(REDUCE_FLAT, className)} variants={windowIn} {...rest}>
      {children}
    </motion.div>
  );
}

/* An explicit delay replaces the stagger delay a child would inherit, so these count from the
   hero's mount, not from the word. "people" starts at 0.32s and lands by 0.77s: the main stroke
   starts as the word settles, the second follows. */
const strokeMain: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.65, duration: 0.6, ease },
      opacity: { delay: 0.65, duration: 0.15 },
    },
  },
};

const strokeSecond: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.95, duration: 0.4, ease },
      opacity: { delay: 0.95, duration: 0.15 },
    },
  },
};

/**
 * Hand-drawn amber underline under a single word. Two strokes draw
 * themselves after the headline lands, inheriting the hero variants.
 */
export function UnderlinedWord({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 24"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[0.03em] -bottom-[0.1em] h-[0.24em] w-[calc(100%+0.06em)] overflow-visible"
      >
        <motion.path
          d="M6 13 C 58 5, 118 19, 176 11 S 252 7, 294 12"
          fill="none"
          stroke="var(--amber)"
          strokeWidth={3.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={strokeMain}
        />
        <motion.path
          d="M16 19 C 82 13, 146 22, 224 15 S 268 15, 288 18"
          fill="none"
          stroke="var(--amber)"
          strokeOpacity={0.6}
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={strokeSecond}
        />
      </svg>
    </span>
  );
}
