import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Typographic apostrophes for text we don't author at build time (live model
 * replies), so it matches the site copy: "I'm" becomes "I’m". Only in-word
 * apostrophes change; quotes and leading or trailing ones are left alone.
 */
export function curly(s: string) {
  return s.replace(/([\p{L}\p{N}])'(?=[\p{L}\p{N}])/gu, "$1’")
}
