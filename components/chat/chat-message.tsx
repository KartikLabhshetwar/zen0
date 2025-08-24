import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { Copy, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant" | "system"
    content: string
    created_at?: string
    metadata?: Record<string, any>
  }
  index: number
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`${
          isUser 
            ? "max-w-[85%] md:max-w-[80%] bg-neutral-800 text-white" 
            : "w-full max-w-5xl text-gray-900"
        } rounded-2xl ${isUser ? "p-4" : "p-6"}`}
      >
        {isAssistant ? (
          <Markdown className="max-w-none">
            {message.content}
          </Markdown>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.metadata?.files && (
              <div className="mt-3 pt-3 border-t border-gray-300/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attached files: {message.metadata.files.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.files.map((file: any, fileIndex: number) => (
                      <div key={fileIndex} className="flex items-center gap-2 text-xs bg-gray-800/50 px-2.5 py-1.5 rounded-md">
                        {file.type?.startsWith('image/') ? (
                          <div className="w-4 h-4 rounded bg-gray-700 flex items-center justify-center">
                            <span className="text-[10px] text-gray-300">🖼️</span>
                          </div>
                        ) : (
                          <Paperclip className="w-3.5 h-3.5" />
                        )}
                        <span className="text-gray-300 max-w-[80px] truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {message.created_at && (
          <div className="text-xs opacity-70 mt-3 text-right">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {/* Copy Button Below Message */}
      <div className={`mt-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors duration-200"
          onClick={() => {
            navigator.clipboard.writeText(message.content);
            toast.success("Copied to clipboard!");
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
