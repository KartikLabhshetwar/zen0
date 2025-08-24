import { Loader } from "@/components/ui/loader"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface MessageStatusIndicatorProps {
  status: "sending" | "sent" | "error" | "processing"
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function MessageStatusIndicator({ 
  status, 
  message, 
  size = "md",
  className = ""
}: MessageStatusIndicatorProps) {
  const getStatusContent = () => {
    switch (status) {
      case "sending":
        return (
          <div className="flex items-center gap-2">
            <Loader variant="text-shimmer" size={size} text={message || "Sending..."} />
          </div>
        )
      case "processing":
        return (
          <div className="flex items-center gap-2">
            <Loader variant="text-shimmer" size={size} text={message || "Processing..."} />
          </div>
        )
      case "sent":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
            <span className="text-sm">{message || "Sent"}</span>
          </div>
        )
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
            <span className="text-sm">{message || "Error"}</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex items-center ${className}`}>
      {getStatusContent()}
    </div>
  )
}
