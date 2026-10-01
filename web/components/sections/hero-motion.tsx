"use client";

import { Fragment, useRef } from "react";
import { motion, useScroll, useTransform, type HTMLMotionProps, type Variants } from "motion/react";
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

const rise: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)" },
  show: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.4, ease } },
};

const word: Variants = {
  hidden: { opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" },
  show: { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)", transition: { duration: 0.45, ease } },
};

const windowIn: Variants = {
  hidden: { opacity: 0, transform: "translateY(16px) scale(0.97)" },
  show: { opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.6, ease } },
};

/**
 * Page-load stagger for the hero. Animates on mount (not on scroll):
 * pill -> H1 (word by word) -> sub -> form -> link -> mock, 60 ms apart.
 */
export function HeroStagger({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(className)} variants={stagger(0.06, 0)} initial="hidden" animate="show" {...rest}>
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
 * The headline arrives word by word, each word sharpening out of a light blur, 50 ms apart.
 * The emphasised word keeps its hand-drawn underline, which draws as the last word lands.
 */
export function HeroHeadline({ text, emphasis, className }: { text: string; emphasis: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h1 className={className} variants={stagger(0.05, 0)}>
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
 * The product window: it rises in last, leaning back slightly like a screen on a desk,
 * and straightens within the first stretch of scroll. The lean is small (8 degrees) and done by
 * the time the window's top reaches 60% of the viewport, so on desktop it is all but flat at first
 * paint and the transcript stays readable. Flat under reduced motion.
 */
export function HeroMock({ className, children, ...rest }: HTMLMotionProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 60%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  return (
    <motion.div ref={ref} className={cn("[perspective:1400px]", REDUCE_FLAT, className)} variants={windowIn} {...rest}>
      {/* The tilt lives on its own element, so its transform never collides with the entrance's. */}
      <motion.div style={{ rotateX, scale }} className={cn("will-change-transform", REDUCE_FLAT)}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* The underline inherits the headline's variants, so these delays count from the moment the
   word "people" starts to rise: the main stroke draws as the word lands, the second follows. */
const strokeMain: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.45, duration: 0.6, ease },
      opacity: { delay: 0.45, duration: 0.15 },
    },
  },
};

const strokeSecond: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.8, duration: 0.4, ease },
      opacity: { delay: 0.8, duration: 0.15 },
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
