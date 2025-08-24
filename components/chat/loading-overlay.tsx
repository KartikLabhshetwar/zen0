import { Loader } from "@/components/ui/loader"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  variant?: "overlay" | "inline"
  className?: string
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Processing...", 
  variant = "overlay",
  className = ""
}: LoadingOverlayProps) {
  if (!isVisible) return null

  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader variant="text-shimmer" size="md" text={message} />
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center gap-3">
          <Loader variant="text-shimmer" size="lg" text={message} />
        </div>
      </div>
    </div>
  )
}
