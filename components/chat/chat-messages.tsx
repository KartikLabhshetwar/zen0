import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Markdown } from "@/components/ui/markdown"
import { ChatMessage } from "./chat-message"

interface ChatMessagesProps {
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
    created_at?: string
    metadata?: Record<string, any>
  }>
  streamingMessage: string
  isStreaming: boolean
}

export function ChatMessages({ messages, streamingMessage, isStreaming }: ChatMessagesProps) {
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
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="space-y-8 max-w-5xl mx-auto">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} />
        ))}

        {streamingMessage && (
          <div className="w-full max-w-5xl rounded-2xl p-6 text-gray-900">
            <Markdown className="max-w-none">
              {streamingMessage}
            </Markdown>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
