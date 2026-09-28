"use client";

import { Fragment, useEffect, useId, useMemo, useRef, type CSSProperties, type ElementType } from "react";
import { useReducedMotion } from "motion/react";
import { useMirror } from "@/components/world/mirror";
import type { Stroke } from "@/components/world/fog-engine";
import { cn } from "@/lib/utils";

type SteamTextProps = {
  text: string;
  as?: ElementType;
  /**
   * Omit for text that is simply there. `false` holds the words back (still readable without JavaScript);
   * `true` writes them into the steam, word by word.
   */
  play?: boolean;
  /** Milliseconds before the first word. */
  delay?: number;
  /** Milliseconds per word: speaking pace, not typing pace. */
  perWord?: number;
  /** Wipe a clear band through the fog behind each line. */
  wipe?: boolean;
  padX?: number;
  padY?: number;
  /** Change this when surrounding layout moves the text, so its band follows without replaying. */
  layoutKey?: string | number;
  id?: string;
  className?: string;
  style?: CSSProperties;
};

type Line = { stroke: Stroke; first: number; count: number };

/** Group the word boxes into visual lines and turn each line into a wipe stroke, in glass coordinates. */
function measureLines(el: HTMLElement, glass: HTMLElement, padX: number, padY: number): Line[] {
  const g = glass.getBoundingClientRect();
  const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
  const lines: { top: number; bottom: number; left: number; right: number; first: number; count: number }[] = [];
  spans.forEach((span, i) => {
    const r = span.getBoundingClientRect();
    const last = lines[lines.length - 1];
    if (last && Math.abs(r.top - last.top) < r.height * 0.5) {
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.right);
      last.bottom = Math.max(last.bottom, r.bottom);
      last.count += 1;
    } else {
      lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right, first: i, count: 1 });
    }
  });
  return lines.map((l) => {
    const mid = (l.top + l.bottom) / 2 - g.top;
    return {
      stroke: {
        x0: l.left - g.left - padX,
        y0: mid,
        x1: l.right - g.left + padX,
        y1: mid,
        r: (l.bottom - l.top) / 2 + padY,
      },
      first: l.first,
      count: l.count,
    };
  });
}

export function SteamText({
  text,
  as: Tag = "p",
  play,
  delay = 0,
  perWord = 110,
  wipe = true,
  padX = 12,
  padY = 7,
  layoutKey,
  id,
  className,
  style,
}: SteamTextProps) {
  const mirror = useMirror();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const key = useId();
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const sequenced = play !== undefined;
  const shown = sequenced ? Boolean(play) : true;
  const animate = sequenced && Boolean(play) && !reduce;

  // When the words started (ms, performance.now); the wipe follows the same clock.
  const startedAt = useRef<number | null>(null);
  const scheduled = useRef(false);

  useEffect(() => {
    if (shown && startedAt.current === null) startedAt.current = performance.now();
    if (!shown) {
      startedAt.current = null;
      scheduled.current = false;
    }
  }, [shown]);

  // Schedule the wipe once per showing; on later resizes only move the bands.
  useEffect(() => {
    if (!wipe || !mirror || !shown) return;
    const engine = mirror.engine();
    const el = ref.current;
    const glass = mirror.glassRef.current;
    if (!engine || !el || !glass) return;
    const lines = measureLines(el, glass, padX, padY);
    if (!lines.length) return;

    if (scheduled.current) {
      engine.moveKept(key, lines.map((l) => l.stroke));
      return;
    }
    scheduled.current = true;
    if (!animate) {
      engine.setKept(key, lines.map((l) => l.stroke));
      return;
    }
    const elapsed = startedAt.current === null ? 0 : performance.now() - startedAt.current;
    engine.setKept(
      key,
      lines.map((l) => l.stroke),
      lines.map((l) => ({
        startIn: Math.max(0, delay + l.first * perWord - 40 - elapsed),
        duration: l.count * perWord + 160,
      })),
    );
  }, [wipe, mirror, mirror?.version, layoutKey, shown, animate, key, delay, perWord, padX, padY]);

  // Take the band away when the text goes (unmount or hidden again for a replay).
  useEffect(() => {
    if (!wipe || !mirror || shown) return;
    mirror.engine()?.removeKept(key);
  }, [wipe, mirror, shown, key]);

  useEffect(() => {
    const m = mirror;
    return () => {
      m?.engine()?.removeKept(key);
    };
  }, [mirror, key]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={style}
      data-seq={sequenced ? "" : undefined}
      data-seq-ready={sequenced && shown ? "" : undefined}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            data-w=""
            className={cn("inline-block", animate && "steam-word")}
            style={animate ? ({ "--d": `${delay + i * perWord}ms` } as CSSProperties) : undefined}
          >
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
