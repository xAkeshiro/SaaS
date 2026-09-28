"use client";

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { useMirror } from "@/components/world/mirror";
import type { Stroke } from "@/components/world/fog-engine";
import { cn } from "@/lib/utils";

type TallyProps = {
  count: number;
  /** Omit for marks that are simply there; `false` holds them back; `true` draws them one by one. */
  play?: boolean;
  delay?: number;
  className?: string;
};

/**
 * Tally marks drawn with a fingertip through the steam: four down, the fifth struck across them.
 * The box only reserves the space; the marks are wiped out of the mirror's fog around it.
 */
export function Tally({ count, play, delay = 0, className }: TallyProps) {
  const mirror = useMirror();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const key = useId();
  const scheduled = useRef(false);
  const shown = play !== false;
  const animate = play === true && !reduce;

  useEffect(() => {
    if (!mirror) return;
    const engine = mirror.engine();
    if (!engine) return;
    if (!shown) {
      engine.removeKept(key);
      scheduled.current = false;
      return;
    }
    const el = ref.current;
    const glass = mirror.glassRef.current;
    if (!el || !glass) return;
    const strokes = tallyStrokes(el.getBoundingClientRect(), glass.getBoundingClientRect(), count);
    if (scheduled.current) {
      engine.moveKept(key, strokes);
      return;
    }
    scheduled.current = true;
    engine.setKept(key, strokes, animate ? strokes.map((_, i) => ({ startIn: delay + i * 240, duration: 180 })) : undefined);
  }, [mirror, mirror?.version, shown, animate, key, delay, count]);

  useEffect(() => {
    const m = mirror;
    return () => {
      m?.engine()?.removeKept(key);
    };
  }, [mirror, key]);

  // The box is as wide as the marks need, so neighbours never sit on a stroke.
  return <div ref={ref} aria-hidden="true" className={cn("shrink-0", className)} style={{ aspectRatio: widthRatio(count) }} />;
}

/** Width over height that holds `count` marks: the geometry of `tallyStrokes` in units of h, plus a little air. */
function widthRatio(count: number) {
  const r = 0.09;
  const s = 0.3;
  let gx = r + s * 0.45;
  let right = 0;
  for (let i = 0; i < count; i++) {
    const k = i % 5;
    if (k < 4) {
      right = Math.max(right, gx + k * s + 0.05 + r);
    } else {
      right = Math.max(right, gx + 3.45 * s + r * 0.9);
      gx += 3 * s + 1.55 * s;
    }
  }
  return right + 0.1;
}

/** Stroke geometry in glass coordinates. Each group is four slightly leaning marks and one diagonal. */
function tallyStrokes(box: DOMRect, glass: DOMRect, count: number): Stroke[] {
  const h = box.height;
  const top = box.top - glass.top;
  const r = Math.max(6, h * 0.09);
  const s = h * 0.3;
  const gap = s * 1.55;
  const lean = h * 0.05;
  const strokes: Stroke[] = [];
  let gx = box.left - glass.left + r + s * 0.45;
  for (let i = 0; i < count; i++) {
    const k = i % 5;
    if (k < 4) {
      const x = gx + k * s;
      strokes.push({ x0: x, y0: top + r, x1: x + lean, y1: top + h - r, r });
    } else {
      strokes.push({ x0: gx - s * 0.45, y0: top + h * 0.8, x1: gx + 3 * s + s * 0.45, y1: top + h * 0.2, r: r * 0.9 });
      gx += 3 * s + gap;
    }
  }
  return strokes;
}
