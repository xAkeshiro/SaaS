"use client"

import { useEffect, useEffectEvent, useRef, type ComponentPropsWithoutRef } from "react"
import { animate, inView, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react"

import { ease } from "@/lib/motion"
import { cn } from "@/lib/utils"

interface NumberTickerProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  /** Seconds to wait after the number scrolls into view. */
  delay?: number
  decimalPlaces?: number
  /**
   * Turns each frame's number into text, e.g. `(n) => \`0:${String(Math.round(n)).padStart(2, "0")}\``.
   * Defaults to an en-US number with `decimalPlaces`. A function cannot cross the server/client
   * boundary, so only client components can pass one.
   */
  format?: (n: number) => string
}

function formatNumber(n: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(n.toFixed(decimalPlaces)))
}

/**
 * Counts to `value` once it scrolls into view. The server renders the final value, so crawlers,
 * link previews and visitors without JavaScript never see a "0". The count only replays for a
 * number that mounts off screen; one already visible keeps its final value.
 */
export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  format,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const from = direction === "down" ? value : startValue
  const to = direction === "down" ? startValue : value
  const motionValue = useMotionValue(to)
  const text = (n: number) => (format ? format(n) : formatNumber(n, decimalPlaces))

  // Writes into React's own text node (never replacing it), so a later prop change still lands.
  const paint = useEffectEvent((n: number) => {
    const node = ref.current?.firstChild
    if (node) node.textContent = text(n)
  })
  // Leaves the latest final value showing when a count is torn down mid-flight.
  const settle = useEffectEvent(() => paint(to))

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    // Already on screen at mount: keep the final value rather than blank it to replay a count.
    const { top, bottom } = el.getBoundingClientRect()
    if (top < window.innerHeight && bottom > 0) return

    motionValue.jump(from)
    paint(from)
    const unsubscribe = motionValue.on("change", (n) => paint(n))
    let controls: AnimationPlaybackControls | undefined
    const stopWatching = inView(el, () => {
      controls = animate(motionValue, to, { duration: 0.9, ease, delay })
    })
    return () => {
      stopWatching()
      controls?.stop()
      unsubscribe()
      settle()
    }
  }, [motionValue, reduce, from, to, delay])

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      {text(to)}
    </span>
  )
}
