import { cn } from "@/lib/utils"

interface Zen0IconProps {
  className?: string
  size?: number
}

export function Zen0Icon({ className, size = 24 }: Zen0IconProps) {
  return (
    <svg 
      className={cn("text-current", className)} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Second circle with gap */}
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="22 2"/>
      {/* Third circle */}
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Fourth circle */}
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Small arc at top */}
      <path d="M12 9.5 A0.5 0.5 0 0 1 12.5 10 A0.5 0.5 0 0 1 12 10.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Small circle at bottom */}
      <circle cx="12" cy="13.5" r="0.5" fill="currentColor"/>
    </svg>
  )
}
