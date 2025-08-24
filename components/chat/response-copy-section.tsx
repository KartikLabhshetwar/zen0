import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface ResponseCopySectionProps {
  streamingMessage: string
  isStreaming: boolean
}

export function ResponseCopySection({ streamingMessage, isStreaming }: ResponseCopySectionProps) {
  if (streamingMessage && !isStreaming) {
    return (
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response complete</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors duration-200"
              onClick={() => {
                navigator.clipboard.writeText(streamingMessage);
                toast.success("Copied to clipboard!");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Response
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}
