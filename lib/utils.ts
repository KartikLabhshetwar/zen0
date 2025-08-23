import type { ClassValue } from "clsx"

// Fallback clsx implementation
function clsx(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .map((input) => {
      if (typeof input === "string") return input
      if (typeof input === "object" && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(" ")
      }
      return ""
    })
    .join(" ")
    .trim()
}

// Try to import clsx, fall back to our implementation
let clsxFn: typeof clsx
try {
  clsxFn = require("clsx").clsx || require("clsx").default || clsx
} catch {
  clsxFn = clsx
}

// Try to import tailwind-merge, fall back to identity function
let twMerge: (input: string) => string
try {
  twMerge = require("tailwind-merge").twMerge
} catch {
  twMerge = (input: string) => input
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsxFn(...inputs))
}
