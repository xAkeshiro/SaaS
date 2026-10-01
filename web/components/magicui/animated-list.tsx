"use client"

import React, {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from "react"
import { AnimatePresence, motion, type MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

const ease = [0.23, 1, 0.32, 1] as const

/*
 * Each item drops in a few pixels from the top edge instead of growing out of its centre.
 * These stay y/scale keys rather than a transform string: the item has `layout`, and the
 * projection writes `transform` itself, which would override a string.
 */
const animations: MotionProps = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease } },
  transition: { type: "spring", duration: 0.45, bounce: 0.15 },
}

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...animations} layout style={{ originY: 0 }} className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode
  /** Milliseconds between items. The sequence plays once and stops on the last item. */
  delay?: number
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    )

    useEffect(() => {
      if (index >= childrenArray.length - 1) return
      const timeout = setTimeout(() => setIndex((i) => i + 1), delay)
      return () => clearTimeout(timeout)
    }, [index, delay, childrenArray.length])

    // Newest first: each arrival lands on top and pushes the rest down.
    const itemsToShow = useMemo(
      () => childrenArray.slice(0, index + 1).reverse(),
      [index, childrenArray]
    )

    return (
      <div
        className={cn(`flex flex-col items-center gap-4`, className)}
        {...props}
      >
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = "AnimatedList"
