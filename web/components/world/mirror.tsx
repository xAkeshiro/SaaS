"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useReducedMotion } from "motion/react";
import { FogEngine } from "@/components/world/fog-engine";
import { cn } from "@/lib/utils";

type MirrorApi = {
  glassRef: RefObject<HTMLDivElement | null>;
  engine: () => FogEngine | null;
  /** Increments whenever the glass is (re)sized, so text can re-measure its wiped bands. */
  version: number;
};

const MirrorContext = createContext<MirrorApi | null>(null);

export function useMirror() {
  return useContext(MirrorContext);
}

type MirrorProps = {
  /** An arched bathroom mirror, or a plain cabinet mirror with rounded corners. */
  shape?: "arch" | "rect";
  /** Steam on the glass. Off gives a clean mirror. */
  fog?: boolean;
  density?: number;
  /** Pointer and finger wiping. */
  interactive?: boolean;
  seed?: number;
  className?: string;
  glassClassName?: string;
  children?: ReactNode;
};

const RADIUS = {
  arch: { outer: "rounded-t-[999px] rounded-b-[26px]", inner: "rounded-t-[999px] rounded-b-[18px]" },
  rect: { outer: "rounded-[30px]", inner: "rounded-[22px]" },
} as const;

export function Mirror({
  shape = "arch",
  fog = true,
  density = 1,
  interactive = true,
  seed,
  className,
  glassClassName,
  children,
}: MirrorProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FogEngine | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [version, setVersion] = useState(0);
  const [painted, setPainted] = useState(false);
  const reduce = useReducedMotion();
  const reduceRef = useRef(Boolean(reduce));

  useEffect(() => {
    reduceRef.current = Boolean(reduce);
    engineRef.current?.setReducedMotion(Boolean(reduce));
  }, [reduce]);

  useEffect(() => {
    if (!fog) return;
    const canvas = canvasRef.current;
    const glass = glassRef.current;
    if (!canvas || !glass) return;

    let engine: FogEngine;
    try {
      engine = new FogEngine(canvas, { reducedMotion: reduceRef.current, seed, density });
    } catch {
      return; // No 2D canvas: the CSS steam stays in place.
    }
    engineRef.current = engine;

    let inView = true;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width < 2 || height < 2) return;
      engine.setSize(width, height);
      setPainted(true);
      setVersion((v) => v + 1);
    });
    ro.observe(glass);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        engine.setVisible(inView && !document.hidden);
      },
      { rootMargin: "160px" },
    );
    io.observe(glass);

    const onVisibility = () => engine.setVisible(inView && !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engine.destroy();
      engineRef.current = null;
    };
  }, [fog, seed, density]);

  const api = useMemo<MirrorApi>(() => ({ glassRef, engine: () => engineRef.current, version }), [version]);

  function localPoint(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const engine = engineRef.current;
    if (!interactive || !engine) return;
    const p = localPoint(e);
    const prev = lastPoint.current ?? p;
    engine.wipe(prev.x, prev.y, p.x, p.y, e.pointerType === "touch" ? 34 : 28);
    lastPoint.current = p;
  }

  function endStroke() {
    lastPoint.current = null;
  }

  const r = RADIUS[shape];

  return (
    <div className={cn("chrome relative p-[9px]", r.outer, className)}>
      <div
        ref={glassRef}
        className={cn("relative isolate h-full w-full overflow-hidden bg-[#dbe7e1]", r.inner, glassClassName)}
        style={{ touchAction: interactive ? "pan-y" : undefined }}
        onPointerMove={onPointerMove}
        onPointerDown={(e) => {
          if (interactive) lastPoint.current = localPoint(e);
        }}
        onPointerLeave={endStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      >
        {/* The reflection: the tiled wall behind you and the vanity light, out of focus. */}
        <div aria-hidden="true" className="mirror-reflection absolute inset-0" />
        {fog ? (
          <>
            <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
            {/* Steam before the canvas paints, and for anyone without canvas or JavaScript. */}
            {!painted ? <div aria-hidden="true" className="absolute inset-0 bg-[rgba(247,250,248,0.64)]" /> : null}
          </>
        ) : null}
        <MirrorContext.Provider value={api}>
          <div className="relative z-10 h-full">{children}</div>
        </MirrorContext.Provider>
      </div>
    </div>
  );
}
