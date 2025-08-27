import { useRef, useEffect } from "react"
import { Markdown } from "@/components/ui/markdown"
import { Loader } from "@/components/ui/loader"
import { ChatMessage } from "./chat-message"

interface ChatMessagesProps {
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string | Array<{
      type: "text" | "image_url"
      text?: string
      image_url?: { url: string }
    }>
    created_at?: string
    metadata?: Record<string, any>
  }>
  streamingMessage: string
  isStreaming: boolean
  isProcessing?: boolean
  selectedModel?: string
}

export function ChatMessages({ messages, streamingMessage, isStreaming, isProcessing = false, selectedModel }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when not streaming to prevent jittering
  useEffect(() => {
    if (!isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isStreaming])

  // Stable scroll to bottom during streaming
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  // Update scroll position when streaming message changes
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      // Use setTimeout instead of requestAnimationFrame for more consistent behavior
      const timeoutId = setTimeout(() => {
        scrollToBottom()
      }, 50)
      
      return () => clearTimeout(timeoutId)
    }
  }, [streamingMessage, isStreaming])

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 mobile-scroll chat-scroll-container h-full"
    >
      <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full sm:max-w-4xl mx-auto pb-4 sm:pb-6">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} selectedModel={selectedModel} />
        ))}

        {/* Show AI thinking process when available, otherwise show shimmer loading */}
        {isProcessing && (
            <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base px-1 sm:px-0">
              <Loader variant="text-shimmer" size="sm" />
              <span>Thinking...</span>
            </div>
          
        )}

        {/* Show streaming message when available */}
        {streamingMessage && (
          <div className="w-full max-w-full rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-gray-900 break-words">
            {(() => {
              // Check if the content contains HTML tags
              if (streamingMessage.includes('<') && streamingMessage.includes('>')) {
                // If it's HTML, render it safely with custom CSS
                return (
                  <div 
                    className="prose prose-sm sm:prose-base w-full max-w-full text-gray-800 leading-relaxed chat-html-content break-words [&>*]:mb-3 [&>p]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:mb-3 [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words"
                    dangerouslySetInnerHTML={{ __html: streamingMessage }}
                  />
                );
              } else {
                // If it's regular text/markdown, use the Markdown component
                return (
                  <Markdown className="w-full max-w-full prose-sm sm:prose-base break-words [&>*]:mb-3 [&>p]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:mb-3 [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words">
                    {streamingMessage}
                  </Markdown>
                );
              }
            })()}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
