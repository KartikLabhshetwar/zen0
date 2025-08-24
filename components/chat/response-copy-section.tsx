import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface ResponseCopySectionProps {
  streamingMessage: string
  isStreaming: boolean
}

export function ResponseCopySection({ streamingMessage, isStreaming }: ResponseCopySectionProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamingMessage)
      toast.success("Response copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy response")
    }
  }

  if (!streamingMessage || isStreaming) return null

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-3 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50 transition-all duration-200 rounded-2xl hover:scale-105"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Response
        </Button>
      </div>
    </div>
  )
}
