"use client";

import { useEffect, useId } from "react";
import { useMirror } from "@/components/world/mirror";

/**
 * Wipes the whole mirror clean in overlapping sweeps, top to bottom, like a hand towel.
 * Mount it inside a <Mirror> when the glass must be fully readable (a debrief, a long answer);
 * unmount it and the steam comes back.
 */
export function WipeClean({ play = true, stagger = 70, sweep = 320 }: { play?: boolean; stagger?: number; sweep?: number }) {
  const mirror = useMirror();
  const key = useId();

  useEffect(() => {
    if (!mirror || !play) return;
    const engine = mirror.engine();
    const glass = mirror.glassRef.current;
    if (!engine || !glass) return;
    const { width, height } = glass.getBoundingClientRect();
    const r = Math.max(34, Math.min(64, height / 9));
    const rows: { x0: number; y0: number; x1: number; y1: number; r: number }[] = [];
    let y = r * 0.7;
    let i = 0;
    while (y - r < height) {
      // Alternate direction, like a real sweep.
      const ltr = i % 2 === 0;
      rows.push({ x0: ltr ? -r : width + r, y0: y, x1: ltr ? width + r : -r, y1: y + r * 0.12, r });
      y += r * 1.35;
      i += 1;
    }
    engine.setKept(
      key,
      rows,
      rows.map((_, j) => ({ startIn: j * stagger, duration: sweep })),
    );
    return () => {
      mirror.engine()?.removeKept(key);
    };
    // Re-run on resize (mirror.version) so the whole glass stays clear.
  }, [mirror, mirror?.version, play, key, stagger, sweep]);

  return null;
}
