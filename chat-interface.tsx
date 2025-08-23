'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Download, ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Message {
  role: "agent" | "user"
  content: string
  timestamp: string
}

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages] = useState<Message[]>([
    {
      role: "agent",
      content: "Hello, I am a generative AI agent. How may I assist you today?",
      timestamp: "4:08:28 PM"
    },
    {
      role: "user",
      content: "Hi, I'd like to check my bill.",
      timestamp: "4:08:37 PM"
    },
    {
      role: "agent",
      content: "Please hold for a second.\n\nOk, I can help you with that\n\nI'm pulling up your current bill information\n\nYour current bill is $150, and it is due on August 31, 2024.\n\nIf you need more details, feel free to ask!",
      timestamp: "4:08:37 PM"
    }
  ])

  return (
    <div className="flex-1 flex flex-col h-screen max-w-4xl mx-auto w-full">
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-2 max-w-[90%] md:max-w-[80%]",
                message.role === "user" && "ml-auto flex-row-reverse"
              )}
            >
              {message.role === "agent" && (
                <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === "agent" ? "GenerativeAgent" : "You"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </span>
                </div>
                <div className={`p-3 md:p-4 rounded-2xl md:rounded-lg ${
                  message.role === "user" ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-900"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "agent" && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button size="icon" className="h-11 w-11 rounded-lg bg-neutral-700 hover:bg-neutral-900">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
