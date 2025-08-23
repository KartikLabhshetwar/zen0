"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageSquare, ExternalLink } from "lucide-react"
import Link from "next/link"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
  image?: string
  imageUrl?: string
}

interface SharedConversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
  messages: ChatMessage[]
}

export default function SharedConversationPage({ params }: { params: { token: string } }) {
  const [conversation, setConversation] = useState<SharedConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedConversation()
  }, [params.token])

  const fetchSharedConversation = async () => {
    try {
      const response = await fetch(`/api/shared/${params.token}`)

      if (response.ok) {
        const data = await response.json()
        setConversation(data)
      } else if (response.status === 404) {
        setError("Conversation not found or no longer shared")
      } else {
        setError("Failed to load conversation")
      }
    } catch (error) {
      console.error("Failed to fetch shared conversation:", error)
      setError("Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conversation Not Available</h2>
          <p className="text-muted-foreground mb-4">
            {error || "This conversation may have been removed or is no longer shared."}
          </p>
          <Button asChild>
            <Link href="/">Go to zen0</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{conversation.title}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{conversation.provider}</Badge>
                <Badge variant="outline">{conversation.model}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/chat">
                <ExternalLink className="w-4 h-4 mr-2" />
                Try zen0
              </Link>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[calc(100vh-200px)] p-6">
          <div className="space-y-4">
            {conversation.messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.image && (
                    <div className="mb-3">
                      <img
                        src={message.image || "/placeholder.svg"}
                        alt="Uploaded image"
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: "300px" }}
                      />
                    </div>
                  )}
                  {message.imageUrl && (
                    <div className="mb-3">
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt="Generated image"
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: "300px" }}
                      />
                    </div>
                  )}
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  )}
                  {message.created_at && (
                    <div className="text-xs opacity-70 mt-2">{new Date(message.created_at).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            This conversation was shared from zen0 - AI Chat with Memory
          </p>
          <Button asChild>
            <Link href="/chat">Start Your Own Conversation</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
