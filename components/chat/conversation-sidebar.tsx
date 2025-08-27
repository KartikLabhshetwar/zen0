"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, Trash2, Settings, Bot, User, Search, Clock, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const convos = await conversationService.getConversations()
      setConversations(convos)
      setFilteredConversations(convos)
    } catch (error) {
      console.error("Failed to load conversations:", error)
      toast.error("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }
    
    const filtered = conversations.filter(conversation => 
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  const handleNewConversation = useCallback(async () => {
    try {
      const newConvo = await conversationService.createConversation()
      setConversations(prev => [newConvo, ...prev])
      setSearchQuery("") // Clear search when creating new conversation
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

  // Group conversations by recency
  const recentConversations = filteredConversations.slice(0, 5)
  const olderConversations = filteredConversations.slice(5)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col gap-3 p-2">
          <Button
            onClick={handleNewConversation}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {isLoading ? (
          <div className="space-y-4 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8 px-4">
            {searchQuery ? (
              <>
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
                <p className="text-xs">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Recent Conversations */}
            {recentConversations.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentConversations.map((conversation) => (
                      <SidebarMenuItem key={conversation.id}>
                        <SidebarMenuButton
                          isActive={currentConversationId === conversation.id}
                          onClick={() => onConversationSelect(conversation.id)}
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
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Older Conversations */}
            {olderConversations.length > 0 && (
              <>
                <SidebarSeparator />
                <SidebarGroup>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Older
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {olderConversations.map((conversation) => (
                        <SidebarMenuItem key={conversation.id}>
                          <SidebarMenuButton
                            isActive={currentConversationId === conversation.id}
                            onClick={() => onConversationSelect(conversation.id)}
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
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            {/* Search Results Badge */}
            {searchQuery && (
              <div className="px-4 py-2">
                <Badge variant="secondary" className="w-full justify-center">
                  {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </>
        )}
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
