"use client";

import { Fragment, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps, type Variants } from "motion/react";
import { ease, fadeUp, scaleIn, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Page-load stagger for the hero. Animates on mount (not on scroll):
 * eyebrow -> H1 -> sub -> form -> trust -> mock, 0.08 s apart.
 */
export function HeroStagger({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(className)} variants={stagger(0.08, 0.05)} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.div>
  );
}

export function HeroItem({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={cn(className)} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}

const word: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
};

/**
 * The headline arrives word by word, each word sharpening out of a blur, 60 ms apart.
 * The emphasised word keeps its hand-drawn underline, which draws once the words have landed.
 */
export function HeroHeadline({ text, emphasis, className }: { text: string; emphasis: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.h1 className={className} variants={stagger(0.06, 0)}>
      {words.map((w, i) => {
        const bare = w.replace(/[.,!?]$/, "");
        const tail = w.slice(bare.length);
        return (
          <Fragment key={i}>
            <motion.span variants={word} className="inline-block">
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
 * The product window: it rises in last, leaning back like a screen on a desk,
 * and straightens to face you as you scroll it into view.
 */
export function HeroMock({ className, children, ...rest }: HTMLMotionProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  return (
    <motion.div ref={ref} className={cn("[perspective:1400px]", className)} variants={scaleIn} {...rest}>
      <motion.div style={reduce ? undefined : { rotateX, scale }} className="will-change-transform">
        {children}
      </motion.div>
    </motion.div>
  );
}

const strokeMain: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.7, duration: 0.7, ease },
      opacity: { delay: 0.7, duration: 0.15 },
    },
  },
};

const strokeSecond: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 1.15, duration: 0.5, ease },
      opacity: { delay: 1.15, duration: 0.15 },
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
