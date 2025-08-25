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
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full max-w-full overflow-hidden`}>
      <div
        className={`${
          isUser 
            ? "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] bg-slate-700 text-white shadow-sm" 
            : "w-full max-w-full text-slate-800 bg-white"
        } rounded-xl sm:rounded-2xl md:rounded-3xl ${isUser ? "p-3 sm:p-4" : "p-3 sm:p-4 md:p-6"} overflow-hidden break-words`}
      >
        {isAssistant ? (
          <Markdown className="w-full max-w-full text-sm sm:text-base leading-relaxed prose-sm sm:prose-base overflow-hidden break-words [&>*]:mb-3 [&>p]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:mb-3 [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words [&>*]:word-wrap:break-word">
            {message.content}
          </Markdown>
        ) : (
          <div className="whitespace-pre-wrap break-words word-wrap-break-word text-sm sm:text-base leading-relaxed overflow-hidden max-w-full">
            {message.content}
            {message.metadata?.files && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-300/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Attached files: {message.metadata.files.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {message.metadata.files.map((file: any, fileIndex: number) => (
                      <div key={fileIndex} className="flex items-center gap-1.5 sm:gap-2 text-xs bg-gray-800/50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md">
                        {file.type?.startsWith('image/') ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-700 flex items-center justify-center">
                            <span className="text-[9px] sm:text-[10px] text-gray-300">🖼️</span>
                          </div>
                        ) : (
                          <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        )}
                        <span className="text-gray-300 max-w-[60px] sm:max-w-[80px] truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {message.created_at && (
          <div className="text-xs opacity-70 mt-1.5 sm:mt-2 md:mt-3 text-right">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {/* Copy Button Below Message */}
      <div className={`mt-1.5 sm:mt-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50 transition-all duration-200 rounded-lg sm:rounded-xl md:rounded-2xl hover:scale-105 touch-manipulation"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message.content);
              toast.success("Message copied to clipboard!");
            } catch (error) {
              toast.error("Failed to copy message");
            }
          }}
        >
          <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )
}
