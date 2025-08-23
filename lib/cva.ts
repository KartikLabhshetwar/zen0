type ClassValue = string | number | boolean | undefined | null
type ClassArray = ClassValue[]
type ClassDictionary = Record<string, any>
type ClassProp = ClassValue | ClassArray | ClassDictionary

export function clsx(...classes: ClassProp[]): string {
  const result: string[] = []

  for (const cls of classes) {
    if (!cls) continue

    if (typeof cls === "string" || typeof cls === "number") {
      result.push(String(cls))
    } else if (Array.isArray(cls)) {
      const inner = clsx(...cls)
      if (inner) result.push(inner)
    } else if (typeof cls === "object") {
      for (const key in cls) {
        if (cls[key]) result.push(key)
      }
    }
  }

  return result.join(" ")
}

type VariantConfig = {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export function cva(base: string, config?: VariantConfig) {
  return (props?: Record<string, string | undefined> & { className?: string }) => {
    if (!props) return base

    const classes = [base]

    if (config?.variants) {
      for (const [key, value] of Object.entries(props)) {
        if (key === "className") continue

        const variant = config.variants[key]
        if (variant && value && variant[value]) {
          classes.push(variant[value])
        }
      }
    }

    if (config?.defaultVariants) {
      for (const [key, defaultValue] of Object.entries(config.defaultVariants)) {
        if (!(key in props) && config.variants?.[key]?.[defaultValue]) {
          classes.push(config.variants[key][defaultValue])
        }
      }
    }

    if (props.className) {
      classes.push(props.className)
    }

    return clsx(...classes)
  }
}

export type VariantProps<T extends (...args: any) => any> = Omit<Parameters<T>[0], "className">
