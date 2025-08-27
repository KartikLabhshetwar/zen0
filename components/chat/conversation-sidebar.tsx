"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, Trash2, Settings, Bot, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { conversationService, type Conversation } from "@/lib/conversation-service"

interface ConversationSidebarProps {
  currentConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
}

export function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const convos = await conversationService.getConversations()
      setConversations(convos)
    } catch (error) {
      console.error("Failed to load conversations:", error)
      toast.error("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewConversation = useCallback(async () => {
    try {
      const newConvo = await conversationService.createConversation()
      setConversations(prev => [newConvo, ...prev])
      onNewConversation()
      toast.success("New conversation created")
    } catch (error) {
      console.error("Failed to create conversation:", error)
      toast.error("Failed to create conversation")
    }
  }, [onNewConversation])

  const handleDeleteConversation = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      await conversationService.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      
      if (currentConversationId === id) {
        onNewConversation()
      }
      
      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }, [currentConversationId, onNewConversation])

  const formatTitle = (title: string) => {
    return title.length > 30 ? title.substring(0, 30) + "..." : title
  }

  const formatLastMessage = (message?: string) => {
    if (!message) return "No messages yet"
    return message.length > 50 ? message.substring(0, 50) + "..." : message
  }

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <Sidebar>
      <SidebarHeader>
        <Button
          onClick={handleNewConversation}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              <SidebarMenu>
                {conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      isActive={currentConversationId === conversation.id}
                      onClick={() => onConversationSelect(conversation.id)}
                      tooltip={conversation.title}
                      className="group"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium truncate">
                          {formatTitle(conversation.title)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatLastMessage(conversation.lastMessage)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </SidebarMenuButton>
                    
                    <SidebarMenuAction
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              // TODO: Implement settings
              toast.info("Settings coming soon")
            }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
