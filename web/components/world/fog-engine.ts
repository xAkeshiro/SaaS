/**
 * FogEngine: condensation on a mirror, drawn on a canvas that sits over the glass.
 *
 * Model (all masks are offscreen canvases in device pixels):
 *   visible = pristine fog − clearMask − keptMask
 *   - pristine: haze plus droplets, painted once per size.
 *   - clearMask: where a pointer or finger wiped; it fades back to nothing ("re-fogs").
 *   - keptMask: bands wiped behind text; they stay clear while the text is shown.
 * Frames only run while something is changing (a stroke drawing, drips running, fog returning),
 * and never while the mirror is offscreen or the tab is hidden.
 */

export type Stroke = { x0: number; y0: number; x1: number; y1: number; r: number };

type KeptEntry = {
  strokes: Stroke[];
  /** Absolute start time (ms, performance.now) and duration per stroke. */
  timing: { start: number; duration: number }[];
  /** How far each stroke has been drawn, 0..1. */
  drawn: number[];
};

type Drip = { x: number; y: number; vy: number; r: number; stopAt: number; wobble: number; phase: number };

type Options = {
  reducedMotion?: boolean;
  seed?: number;
  /** 0..1, how thick the steam is. */
  density?: number;
};

const REFOG_DELAY = 1100;
const REFOG_SPAN = 6500;
const MAX_DRIPS = 26;
const DPR_CAP = 1.5;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return { c, ctx };
}

export class FogEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fog!: HTMLCanvasElement;
  private fctx!: CanvasRenderingContext2D;
  private clear!: HTMLCanvasElement;
  private cctx!: CanvasRenderingContext2D;
  private kept!: HTMLCanvasElement;
  private kctx!: CanvasRenderingContext2D;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private lastFrame = 0;
  private lastWipe = -Infinity;
  private visible = true;
  private destroyed = false;

  private keptEntries = new Map<string, KeptEntry>();
  private drips: Drip[] = [];
  private brushCache = new Map<number, HTMLCanvasElement>();
  private rand: () => number;
  private reduced: boolean;
  private density: number;

  constructor(canvas: HTMLCanvasElement, opts: Options = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.reduced = Boolean(opts.reducedMotion);
    this.density = opts.density ?? 1;
    this.rand = mulberry32(opts.seed ?? 0x51ea11);
  }

  setReducedMotion(v: boolean) {
    this.reduced = v;
    if (v) this.drips = [];
  }

  /** Size in CSS pixels. Repaints the fog and redraws every kept band at its current progress. */
  setSize(w: number, h: number) {
    if (this.destroyed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (W === this.canvas.width && H === this.canvas.height && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = W;
    this.canvas.height = H;
    ({ c: this.fog, ctx: this.fctx } = makeCanvas(W, H));
    ({ c: this.clear, ctx: this.cctx } = makeCanvas(W, H));
    ({ c: this.kept, ctx: this.kctx } = makeCanvas(W, H));
    this.brushCache.clear();
    this.drips = [];
    this.paintFog();
    this.redrawKept();
    this.compose();
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.kick();
    else this.stop();
  }

  /**
   * Replace the kept bands for one key (usually one line of text).
   * `startIn` delays each stroke (ms from now); `duration` 0 draws it at once.
   */
  setKept(key: string, strokes: Stroke[], timing?: { startIn: number; duration: number }[]) {
    const now = performance.now();
    const t = strokes.map((_, i) => {
      const spec = timing?.[i];
      const instant = this.reduced || !spec || spec.duration <= 0;
      return { start: instant ? now : now + spec.startIn, duration: instant ? 0 : spec.duration };
    });
    // Instant bands are complete on arrival, so they show even if the mirror is offscreen right now.
    this.keptEntries.set(key, { strokes, timing: t, drawn: t.map((x) => (x.duration === 0 ? 1 : 0)) });
    this.redrawKept();
    this.compose();
    this.kick();
  }

  /** Move kept bands without replaying them (the text reflowed). */
  moveKept(key: string, strokes: Stroke[]) {
    const entry = this.keptEntries.get(key);
    if (!entry) return this.setKept(key, strokes);
    entry.strokes = strokes;
    while (entry.timing.length < strokes.length) entry.timing.push({ start: performance.now(), duration: 0 });
    while (entry.drawn.length < strokes.length) entry.drawn.push(1);
    this.redrawKept();
    this.compose();
  }

  removeKept(key: string) {
    if (this.keptEntries.delete(key)) {
      this.redrawKept();
      this.compose();
    }
  }

  clearKept() {
    this.keptEntries.clear();
    this.redrawKept();
    this.compose();
  }

  /** A pointer or finger dragged from (px,py) to (x,y), in CSS pixels. */
  wipe(px: number, py: number, x: number, y: number, radius = 30) {
    if (this.destroyed || !this.w) return;
    const d = this.dpr;
    this.eraseSegment(this.cctx, px * d, py * d, x * d, y * d, radius * d);
    this.lastWipe = performance.now();
    if (!this.reduced) this.maybeDrip(px, py, x, y, radius);
    this.kick();
  }

  /** Bring the steam back everywhere at once (used before a replay). */
  refogNow() {
    this.cctx.clearRect(0, 0, this.clear.width, this.clear.height);
    this.drips = [];
    this.compose();
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    this.keptEntries.clear();
    this.drips = [];
  }

  /* ---------------------------------------------------------------- */

  private kick() {
    if (this.raf || !this.visible || this.destroyed) return;
    if (typeof document !== "undefined" && document.hidden) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.destroyed || !this.visible) return;
    const dt = Math.min(64, now - this.lastFrame);
    this.lastFrame = now;
    let active = false;

    // 1. Kept bands drawing in, stroke by stroke.
    for (const entry of this.keptEntries.values()) {
      entry.strokes.forEach((s, i) => {
        const { start, duration } = entry.timing[i];
        if (entry.drawn[i] >= 1) return;
        if (now < start) {
          active = true;
          return;
        }
        const p = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
        const eased = easeOut(p);
        const from = entry.drawn[i];
        if (eased > from) {
          this.drawStrokePart(this.kctx, s, from, eased);
          entry.drawn[i] = eased >= 0.999 ? 1 : eased;
          if (entry.drawn[i] >= 1) this.drawStreaks(this.kctx, s);
        }
        if (entry.drawn[i] < 1) active = true;
      });
    }

    // 2. Drips running down from wiped edges.
    if (this.drips.length) {
      active = true;
      this.updateDrips(dt);
    }

    // 3. Steam returning over pointer wipes.
    const since = now - this.lastWipe;
    if (since > REFOG_DELAY && since < REFOG_DELAY + REFOG_SPAN) {
      const k = 1 - Math.pow(1 - 0.0075, dt / 16.67);
      this.cctx.globalCompositeOperation = "destination-out";
      this.cctx.fillStyle = `rgba(0,0,0,${k})`;
      this.cctx.fillRect(0, 0, this.clear.width, this.clear.height);
      this.cctx.globalCompositeOperation = "source-over";
      active = true;
    } else if (since <= REFOG_DELAY) {
      active = true;
    }

    this.compose();
    if (active) this.raf = requestAnimationFrame(this.frame);
  };

  private compose() {
    const { ctx, canvas } = this;
    if (!this.fog) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.fog, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(this.clear, 0, 0);
    ctx.drawImage(this.kept, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    if (this.drips.length) this.drawDripHeads();
  }

  /* ---------------- painting the steam ---------------- */

  private paintFog() {
    const c = this.fctx;
    const W = this.fog.width;
    const H = this.fog.height;
    const d = this.dpr;
    const rand = this.rand;
    const dens = this.density;

    c.clearRect(0, 0, W, H);
    c.fillStyle = `rgba(247, 250, 248, ${0.6 * dens + 0.06})`;
    c.fillRect(0, 0, W, H);

    // Steam is never even: denser clouds, thinner patches, heavier near the top where warm air collects.
    const top = c.createLinearGradient(0, 0, 0, H * 0.5);
    top.addColorStop(0, "rgba(255,255,255,0.16)");
    top.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = top;
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = (0.25 + rand() * 0.45) * Math.max(W, H);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.07 + rand() * 0.1})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    c.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 5; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = (0.12 + rand() * 0.22) * Math.max(W, H);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${0.06 + rand() * 0.08})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    c.globalCompositeOperation = "source-over";

    // Droplets: many beads, a few drops, rare big ones pulled long by gravity.
    const area = this.w * this.h;
    const beads = Math.round((area / 105) * dens);
    const drops = Math.round((area / 2400) * dens);
    const big = Math.round((area / 13000) * dens);

    for (let i = 0; i < beads; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = (0.45 + rand() * 0.8) * d;
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "rgba(0,0,0,0.3)";
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      if (rand() < 0.4) {
        c.globalCompositeOperation = "source-over";
        c.fillStyle = "rgba(255,255,255,0.8)";
        c.beginPath();
        c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalCompositeOperation = "source-over";
    for (let i = 0; i < drops; i++) this.drawDrop(c, rand() * W, rand() * H, (1.6 + rand() * 1.8) * d, 1 + rand() * 0.15);
    for (let i = 0; i < big; i++) this.drawDrop(c, rand() * W, rand() * H, (3.4 + rand() * 3.2) * d, 1.12 + rand() * 0.25);
  }

  private drawDrop(c: CanvasRenderingContext2D, x: number, y: number, r: number, stretch: number) {
    c.save();
    c.translate(x, y);
    c.scale(1, stretch);
    // The bead itself is clearer than the haze around it.
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = "rgba(0,0,0,0.58)";
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    // Shadow side (light comes from above), then the specular highlight.
    c.strokeStyle = "rgba(44, 70, 61, 0.24)";
    c.lineWidth = Math.max(0.6, r * 0.32);
    c.beginPath();
    c.arc(0, 0, r * 0.84, Math.PI * 0.12, Math.PI * 0.88);
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.9)";
    c.beginPath();
    c.arc(-r * 0.34, -r * 0.38, Math.max(0.5, r * 0.28), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  /* ---------------- wiping ---------------- */

  private brush(r: number) {
    const key = Math.max(2, Math.round(r));
    let b = this.brushCache.get(key);
    if (!b) {
      const size = key * 2 + 2;
      const { c, ctx } = makeCanvas(size, size);
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, key);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.6, "rgba(0,0,0,0.92)");
      g.addColorStop(0.85, "rgba(0,0,0,0.45)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      b = c;
      this.brushCache.set(key, b);
    }
    return b;
  }

  private eraseSegment(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) {
    const b = this.brush(r);
    const half = b.width / 2;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const step = Math.max(1, r * 0.28);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      c.drawImage(b, x0 + (x1 - x0) * t - half, y0 + (y1 - y0) * t - half);
    }
  }

  /** Deterministic wander and pressure for a stroke, so a band redrawn after a resize looks the same. */
  private strokePath(s: Stroke) {
    const d = this.dpr;
    const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
    const seed = Math.abs(Math.sin(s.x0 * 12.9898 + s.y0 * 78.233 + s.x1 * 3.17)) * 1000;
    const p1 = seed % 6.283;
    const p2 = (seed * 1.7) % 6.283;
    const p3 = (seed * 2.3) % 6.283;
    const at = (t: number) => {
      const u = t * len;
      const wobble = s.r * (0.13 * Math.sin(u / (s.r * 2.4) + p1) + 0.05 * Math.sin(u / (s.r * 0.95) + p2));
      const pressure = 1 + 0.09 * Math.sin(u / (s.r * 3.1) + p3) - 0.06 * Math.sin(u / (s.r * 1.3) + p1);
      return {
        x: (s.x0 + (s.x1 - s.x0) * t) * d,
        y: (s.y0 + (s.y1 - s.y0) * t + wobble) * d,
        r: s.r * pressure * d,
      };
    };
    const stepT = Math.max(0.002, (s.r * 0.26) / Math.max(1, len));
    return { at, stepT };
  }

  /** A finger wipe is not a ruler: the path wanders and the pressure varies. */
  private drawStrokePart(c: CanvasRenderingContext2D, s: Stroke, from: number, to: number) {
    const { at, stepT } = this.strokePath(s);
    for (let t = from; t <= to + 1e-6; t += stepT) {
      const p = at(Math.min(t, to));
      const b = this.brush(p.r);
      c.drawImage(b, p.x - b.width / 2, p.y - b.height / 2);
    }
  }

  /** The edges of the finger leave thin lines of steam inside a finished band. */
  private drawStreaks(c: CanvasRenderingContext2D, s: Stroke) {
    const { at, stepT } = this.strokePath(s);
    const d = this.dpr;
    c.save();
    c.globalCompositeOperation = "destination-out";
    c.lineCap = "round";
    for (const [off, alpha, w] of [
      [-0.64, 0.34, 0.09],
      [0.6, 0.3, 0.07],
      [0.2, 0.12, 0.05],
    ] as const) {
      c.beginPath();
      let first = true;
      for (let t = 0; t <= 1 + 1e-6; t += stepT) {
        const p = at(Math.min(t, 1));
        const y = p.y + off * s.r * d;
        if (first) {
          c.moveTo(p.x, y);
          first = false;
        } else c.lineTo(p.x, y);
      }
      c.strokeStyle = `rgba(0,0,0,${alpha})`;
      c.lineWidth = Math.max(1, s.r * w * d);
      c.stroke();
    }
    c.restore();
  }

  private redrawKept() {
    if (!this.kept) return;
    this.kctx.clearRect(0, 0, this.kept.width, this.kept.height);
    for (const entry of this.keptEntries.values()) {
      entry.strokes.forEach((s, i) => {
        const p = entry.drawn[i];
        if (p > 0) this.drawStrokePart(this.kctx, s, 0, p);
      });
    }
    for (const entry of this.keptEntries.values()) {
      entry.strokes.forEach((s, i) => {
        if (entry.drawn[i] >= 1) this.drawStreaks(this.kctx, s);
      });
    }
  }

  /* ---------------- drips ---------------- */

  private maybeDrip(px: number, py: number, x: number, y: number, radius: number) {
    const len = Math.hypot(x - px, y - py);
    if (len < 2 || this.drips.length >= MAX_DRIPS) return;
    // Water gathers along the lower edge of a mostly sideways wipe.
    const sideways = Math.abs(x - px) > Math.abs(y - py);
    if (!sideways || this.rand() > Math.min(0.5, len / 90)) return;
    this.drips.push({
      x: x + (this.rand() - 0.5) * radius,
      y: y + radius * 0.82,
      vy: 18 + this.rand() * 26,
      r: 1.3 + this.rand() * 1.4,
      stopAt: y + radius + 30 + this.rand() * 130,
      wobble: 0.6 + this.rand() * 1.2,
      phase: this.rand() * Math.PI * 2,
    });
  }

  private updateDrips(dt: number) {
    const s = dt / 1000;
    const d = this.dpr;
    const next: Drip[] = [];
    for (const drip of this.drips) {
      const oy = drip.y;
      const ox = drip.x;
      drip.vy *= Math.pow(0.55, s); // water slows as it sheds
      drip.y += drip.vy * s;
      drip.phase += s * 6;
      drip.x += Math.sin(drip.phase) * drip.wobble * s * 6;
      this.eraseSegment(this.cctx, ox * d, oy * d, drip.x * d, drip.y * d, drip.r * d);
      if (drip.y < drip.stopAt && drip.y < this.h + 10 && drip.vy > 3) next.push(drip);
    }
    this.drips = next;
  }

  private drawDripHeads() {
    const c = this.ctx;
    const d = this.dpr;
    for (const drip of this.drips) {
      const r = (drip.r + 0.9) * d;
      c.fillStyle = "rgba(255,255,255,0.75)";
      c.beginPath();
      c.arc(drip.x * d - r * 0.3, drip.y * d - r * 0.35, r * 0.35, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(44,70,61,0.22)";
      c.lineWidth = Math.max(0.6, r * 0.3);
      c.beginPath();
      c.arc(drip.x * d, drip.y * d, r * 0.8, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    }
  }
}
