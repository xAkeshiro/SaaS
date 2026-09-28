import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

/*
 * Buttons in the mirror world. Amber is the light switched on: the one primary action per view.
 * Press feedback follows Emil Kowalski's rule (scale 0.97, 160ms, ease-out); hover only exists on
 * devices that can hover (Tailwind v4 gates `hover:` behind `(hover: hover)`).
 */
const buttonVariants = cva(
  "group/btn relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold [font-stretch:100%] whitespace-nowrap outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        amber:
          "bg-amber text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_12px_24px_-14px_rgba(2,24,18,0.85)] hover:bg-[#ffc06a]",
        glass:
          "bg-glass text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_10px_22px_-14px_rgba(2,24,18,0.8)] hover:bg-white",
        ink: "bg-ink text-glass hover:bg-[#1b3b32]",
        quiet: "text-wall-ink hover:bg-white/10",
        quietInk: "text-ink hover:bg-ink/[0.06]",
        outlineInk:
          "text-ink shadow-[inset_0_0_0_1.5px_rgba(15,42,35,0.24)] hover:shadow-[inset_0_0_0_1.5px_rgba(15,42,35,0.5)]",
      },
      size: {
        sm: "h-10 px-4 text-[0.9375rem]",
        md: "h-12 px-5 text-base",
        lg: "h-14 px-6 text-[1.0625rem]",
        icon: "size-11",
        iconSm: "size-10",
      },
    },
    defaultVariants: {
      variant: "amber",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "amber",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
