import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Markdown } from "@/components/ui/markdown"
import { Loader } from "@/components/ui/loader"
import { ChatMessage } from "./chat-message"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ui/reasoning"

interface ChatMessagesProps {
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
    created_at?: string
    metadata?: Record<string, any>
  }>
  streamingMessage: string
  isStreaming: boolean
  isProcessing?: boolean
  reasoningText?: string
  showReasoning?: boolean
}

export function ChatMessages({ messages, streamingMessage, isStreaming, isProcessing = false, reasoningText = "", showReasoning = false }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when not streaming to prevent jittering
  useEffect(() => {
    if (!isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isStreaming])

  // Stable scroll to bottom during streaming
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  // Update scroll position when streaming message changes
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [streamingMessage, isStreaming])

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 h-full">
      <div className="space-y-8 max-w-5xl mx-auto pb-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} />
        ))}

        {/* Show AI thinking process when available, otherwise show shimmer loading */}
        {isProcessing && (
          showReasoning && reasoningText && reasoningText.includes('<think>') ? (
            <Reasoning isStreaming={isProcessing} open={true}>
              <ReasoningTrigger>AI is thinking...</ReasoningTrigger>
              <ReasoningContent 
                className="ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700"
                markdown={false}
              >
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {reasoningText.match(/<think>([\s\S]*?)<\/think>/)?.[1]?.trim() || 'Thinking...'}
                </div>
              </ReasoningContent>
            </Reasoning>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Loader variant="text-shimmer" size="sm" />
              <span>Thinking...</span>
            </div>
          )
        )}

        {/* Show streaming message when available */}
        {streamingMessage && (
          <div className="w-full max-w-5xl rounded-2xl p-6 text-gray-900">
            {(() => {
              // Check if the content contains HTML tags
              if (streamingMessage.includes('<') && streamingMessage.includes('>')) {
                // If it's HTML, render it safely with custom CSS
                return (
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed chat-html-content"
                    dangerouslySetInnerHTML={{ __html: streamingMessage }}
                  />
                );
              } else {
                // If it's regular text/markdown, use the Markdown component
                return (
                  <Markdown className="max-w-none">
                    {streamingMessage}
                  </Markdown>
                );
              }
            })()}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
