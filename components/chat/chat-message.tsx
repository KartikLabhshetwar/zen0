import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { Copy, Paperclip, Image as ImageIcon, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn, formatModelName } from "@/lib/utils"
import { useState } from "react"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant" | "system"
    content: string | Array<{
      type: "text" | "image_url"
      text?: string
      image_url?: { url: string }
    }>
    created_at?: string
    metadata?: Record<string, any>
  }
  index: number
  selectedModel?: string
}

export function ChatMessage({ message, index, selectedModel }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  // Helper function to render user message content (text + images)
  const renderUserMessageContent = (content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>) => {
    if (typeof content === 'string') {
      return content;
    }
    
    return (
      <div className="space-y-2">
        {content.map((item, itemIndex) => {
          if (item.type === "text" && item.text) {
            return (
              <div key={itemIndex} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {item.text}
              </div>
            );
          } else if (item.type === "image_url" && item.image_url) {
            const hasError = imageErrors.has(itemIndex)
            
            return (
              <div key={itemIndex} className="flex flex-col gap-2">
                {hasError ? (
                  <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Image failed to load
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageErrors(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(itemIndex)
                          return newSet
                        })
                      }}
                      className="ml-auto h-6 px-2 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={item.image_url.url} 
                      alt="Uploaded image" 
                      className="max-w-full max-h-64 rounded-lg object-contain border border-gray-200"
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(itemIndex))
                      }}
                      onLoad={() => {
                        setImageErrors(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(itemIndex)
                          return newSet
                        })
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Image
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full max-w-full`}>
      <div
        className={`${
          isUser 
            ? "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] bg-gray-500 text-white shadow-sm dark:bg-primary dark:text-primary-foreground" 
            : "max-w-[75%] sm:max-w-[60%] md:max-w-[55%] text-foreground bg-background/80 backdrop-blur-sm"
        } rounded-2xl ${isUser ? "p-4 sm:p-4" : "p-4 sm:p-5"} overflow-hidden break-words`}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0">
            <Markdown className="text-sm leading-relaxed [&>*]:max-w-full [&>*]:break-words [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words">
              {typeof message.content === 'string' ? message.content : 'Image analysis response'}
            </Markdown>
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words max-w-full">
            {renderUserMessageContent(message.content)}
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
      </div>
      
      {/* Copy Button Below Message */}
      <div className={`mt-2 flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-accent/80 transition-colors"
          onClick={async () => {
            try {
              let textToCopy = "";
              if (typeof message.content === 'string') {
                textToCopy = message.content;
              } else {
                // For multimodal messages, extract text content
                textToCopy = message.content
                  .filter(item => item.type === "text" && item.text)
                  .map(item => item.text)
                  .join(" ");
              }
              await navigator.clipboard.writeText(textToCopy);
              toast.success("Message copied to clipboard!");
            } catch (error) {
              toast.error("Failed to copy message");
            }
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        {isAssistant && selectedModel && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md font-mono">
            {formatModelName(selectedModel)}
          </span>
        )}
      </div>
    </div>
  )
}
