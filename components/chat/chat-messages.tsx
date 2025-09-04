import { useRef, useEffect } from "react"
import { Markdown } from "@/components/ui/markdown"
import { Loader } from "@/components/ui/loader"
import { ChatMessage } from "./chat-message"
import { WebSearchMessage } from "@/components/web-search"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"

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
    reasoning?: string
  }>
  streamingMessage: string
  isStreaming: boolean
  isProcessing?: boolean
  selectedModel?: string
  webSearchResult?: any
  isWebSearchLoading?: boolean
}

export function ChatMessages({ messages, streamingMessage, isStreaming, isProcessing = false, selectedModel, webSearchResult, isWebSearchLoading }: ChatMessagesProps) {
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
      <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full sm:max-w-4xl mx-auto pb-2">
        {messages.map((message, index) => {
          // Check if this is a web search result
          if (message.metadata?.searchMode === "Web Search" && message.role === "assistant") {
            return (
              <WebSearchMessage
                key={index}
                message={message}
                sources={message.metadata?.sources || []}
                toolCalls={message.metadata?.toolCalls || []}
              />
            )
          }
          return <ChatMessage key={index} message={message} index={index} selectedModel={selectedModel} />
        })}

        {/* Show processing indicator when available and no streaming message */}
        {isProcessing && !streamingMessage && (
            <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base px-1 sm:px-0">
              <Loader variant="text-shimmer" size="sm" />
              <span>Processing...</span>
            </div>
        )}

        {/* Show streaming message when available */}
        {streamingMessage && (
          <div className="w-full max-w-full">
            <div className="max-w-[75%] sm:max-w-[60%] md:max-w-[55%] text-foreground bg-background/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 overflow-hidden break-words">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0">
                {/* Check if streaming message contains reasoning */}
                {streamingMessage.includes('<think>') ? (
                  <>
                    {/* Show reasoning first - always show if we have <think> tag */}
                    <Reasoning>
                      <ReasoningTrigger />
                      <ReasoningContent>
                        {streamingMessage.match(/<think>([\s\S]*?)<\/think>/)?.[1] || 
                         streamingMessage.match(/<think>([\s\S]*)/)?.[1] || ''}
                      </ReasoningContent>
                    </Reasoning>
                    
                    {/* Show response if reasoning is complete */}
                    {streamingMessage.includes('</think>') && (
                      <Markdown className="w-full max-w-full prose-sm sm:prose-base break-words [&>*]:mb-3 [&>p]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:mb-3 [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words">
                        {streamingMessage.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}
                      </Markdown>
                    )}
                  </>
                ) : (
                  /* No reasoning, show content normally */
                  <Markdown className="w-full max-w-full prose-sm sm:prose-base break-words [&>*]:mb-3 [&>p]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>blockquote]:mb-3 [&>pre]:overflow-x-auto [&>pre]:whitespace-pre-wrap [&>code]:break-words">
                    {streamingMessage}
                  </Markdown>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
