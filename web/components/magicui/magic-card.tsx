"use client"

import React, { useCallback, useEffect, useRef } from "react"
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"

import { cn } from "@/lib/utils"

interface MagicCardBaseProps {
  /** Set when the card sits on a dark band (switches blend mode). */
  dark?: boolean
  children?: React.ReactNode
  className?: string
  gradientSize?: number
  gradientFrom?: string
  gradientTo?: string
}

interface MagicCardGradientProps extends MagicCardBaseProps {
  mode?: "gradient"

  gradientColor?: string
  gradientOpacity?: number

  glowFrom?: never
  glowTo?: never
  glowAngle?: never
  glowSize?: never
  glowBlur?: never
  glowOpacity?: never
}

interface MagicCardOrbProps extends MagicCardBaseProps {
  mode: "orb"

  glowFrom?: string
  glowTo?: string
  glowAngle?: number
  glowSize?: number
  glowBlur?: number
  glowOpacity?: number

  gradientColor?: never
  gradientOpacity?: never
}

type MagicCardProps = MagicCardGradientProps | MagicCardOrbProps

function isOrbMode(props: MagicCardProps): props is MagicCardOrbProps {
  return props.mode === "orb"
}

const ease = [0.23, 1, 0.32, 1] as const
/** Exits run faster than entrances. */
const fadeIn = { duration: 0.24, ease }
const fadeOut = { duration: 0.16, ease }

export function MagicCard(props: MagicCardProps) {
  const {
    children,
    className,
    gradientSize = 200,
    gradientColor = "#262626",
    gradientOpacity = 0.8,
    gradientFrom = "#9E7AFF",
    gradientTo = "#FE8BBB",
    mode = "gradient",
  } = props

  const glowFrom = isOrbMode(props) ? (props.glowFrom ?? "#ee4f27") : "#ee4f27"
  const glowTo = isOrbMode(props) ? (props.glowTo ?? "#6b21ef") : "#6b21ef"
  const glowAngle = isOrbMode(props) ? (props.glowAngle ?? 90) : 90
  const glowSize = isOrbMode(props) ? (props.glowSize ?? 420) : 420
  const glowBlur = isOrbMode(props) ? (props.glowBlur ?? 60) : 60
  const glowOpacity = isOrbMode(props) ? (props.glowOpacity ?? 0.9) : 0.9
  // Unmute: site is light by default; pass `dark` when the card sits on a dark band.
  const isDarkTheme = props.dark ?? false

  // The pointer is the target; the springs trail it so the light follows smoothly instead of snapping.
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)
  const lightX = useSpring(mouseX, { stiffness: 250, damping: 30, mass: 0.6 })
  const lightY = useSpring(mouseY, { stiffness: 250, damping: 30, mass: 0.6 })

  // Hover strength, 0 to 1. Fading this instead of parking the light off-card means
  // leaving never drags the glow across the card, and entering never sweeps it in from a corner.
  const strength = useMotionValue(0)
  const fillOpacity = useMotionValue(0)
  const borderMix = useMotionValue(0)
  const orbVisible = useMotionValue(0)

  const reduceMotion = useReducedMotion()
  const reduceRef = useRef(reduceMotion)
  const settingsRef = useRef({ mode, gradientOpacity, glowOpacity })

  useEffect(() => {
    reduceRef.current = reduceMotion
  }, [reduceMotion])

  useEffect(() => {
    settingsRef.current = { mode, gradientOpacity, glowOpacity }
  }, [mode, gradientOpacity, glowOpacity])

  // One driver for every hover layer, so they always fade together.
  useEffect(() => {
    return strength.on("change", (v) => {
      const s = settingsRef.current
      if (s.mode === "orb") {
        orbVisible.set(v * s.glowOpacity)
        return
      }
      fillOpacity.set(v * s.gradientOpacity)
      borderMix.set(v * 100)
    })
  }, [strength, fillOpacity, borderMix, orbVisible])

  const moveTo = useCallback(
    (x: number, y: number, jump: boolean) => {
      mouseX.set(x)
      mouseY.set(y)
      // Under reduced motion the light sits under the pointer instead of trailing it.
      if (jump || reduceRef.current) {
        lightX.jump(x)
        lightY.jump(y)
      }
    },
    [mouseX, mouseY, lightX, lightY]
  )

  const hide = useCallback(() => {
    animate(strength, 0, fadeOut)
  }, [strength])

  // Spotlight is a mouse affordance only: on touch, a tap would paint it where the finger lands.
  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return
      const rect = e.currentTarget.getBoundingClientRect()
      moveTo(e.clientX - rect.left, e.clientY - rect.top, true)
      animate(strength, 1, fadeIn)
    },
    [moveTo, strength]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return
      const rect = e.currentTarget.getBoundingClientRect()
      moveTo(e.clientX - rect.left, e.clientY - rect.top, false)
    },
    [moveTo]
  )

  useEffect(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) hide()
    }
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") hide()
    }

    window.addEventListener("pointerout", handleGlobalPointerOut)
    window.addEventListener("blur", hide)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut)
      window.removeEventListener("blur", hide)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [hide])

  // The border glow mixes toward the plain border colour as the hover fades out.
  const borderBackground = useMotionTemplate`
    linear-gradient(var(--color-background) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${lightX}px ${lightY}px,
      color-mix(in oklab, ${gradientFrom} ${borderMix}%, var(--color-border)),
      color-mix(in oklab, ${gradientTo} ${borderMix}%, var(--color-border)),
      var(--color-border) 100%
    ) border-box
  `
  const fillBackground = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${lightX}px ${lightY}px,
      ${gradientColor},
      transparent 100%
    )
  `

  return (
    <motion.div
      className={cn(
        "relative isolate overflow-hidden rounded-[inherit] border border-transparent",
        className
      )}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={hide}
      style={{
        background: borderBackground,
      }}
    >
      <div className="bg-background absolute inset-px z-20 rounded-[inherit]" />

      {mode === "gradient" && (
        <motion.div
          suppressHydrationWarning
          aria-hidden="true"
          className="pointer-events-none absolute inset-px z-30 rounded-[inherit]"
          style={{
            background: fillBackground,
            opacity: fillOpacity,
          }}
        />
      )}

      {mode === "orb" && (
        <motion.div
          suppressHydrationWarning
          aria-hidden="true"
          className="pointer-events-none absolute z-30"
          style={{
            width: glowSize,
            height: glowSize,
            x: lightX,
            y: lightY,
            translateX: "-50%",
            translateY: "-50%",
            borderRadius: 9999,
            filter: `blur(${glowBlur}px)`,
            opacity: orbVisible,
            background: `linear-gradient(${glowAngle}deg, ${glowFrom}, ${glowTo})`,

            mixBlendMode: isDarkTheme ? "screen" : "multiply",
            willChange: "transform, opacity",
          }}
        />
      )}
      <div className="relative z-40 h-full">{children}</div>
    </motion.div>
  )
}
