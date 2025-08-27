"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, Trash2, Search, Clock, Key, Database } from "lucide-react"
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
import { DataManagerDialog } from "./data-manager-dialog"
import { BYOKSetupDialog } from "./byok-setup-dialog"
import { useIsMobile } from "@/hooks/use-mobile"

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
  const [showDataManager, setShowDataManager] = useState(false)
  const [showBYOKSetup, setShowBYOKSetup] = useState(false)
  const isMobile = useIsMobile()

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
      onNewConversation()
    } catch (error) {
      console.error("Failed to handle new conversation:", error)
      toast.error("Failed to create new conversation")
    }
  }, [onNewConversation])

  const handleDeleteConversation = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      await conversationService.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      
      window.dispatchEvent(new CustomEvent('conversation-deleted'))
      
      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }, [])

  // Data management functions
  const handleExportData = useCallback(async () => {
    try {
      const data = {
        conversations: await conversationService.getConversations(),
        settings: {
          apiKeys: localStorage.getItem("zen0-api-keys")
        }
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zen0-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Data exported successfully")
    } catch (error) {
      console.error("Failed to export data:", error)
      toast.error("Failed to export data")
    }
  }, [])

  const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.conversations) {
        localStorage.setItem('zen0-conversations', JSON.stringify(data.conversations))
      }
      
      if (data.settings?.apiKeys) {
        localStorage.setItem('zen0-api-keys', data.settings.apiKeys)
      }
      
      const updatedConvos = await conversationService.getConversations()
      setConversations(updatedConvos)
      
      toast.success("Data imported successfully")
      setShowDataManager(false)
    } catch (error) {
      console.error("Failed to import data:", error)
      toast.error("Failed to import data")
    }
  }, [])

  const handleClearAllData = useCallback(async () => {
    try {
      await conversationService.clearConversations()
      setConversations([])
      
      toast.success("All data cleared successfully")
      setShowDataManager(false)
    } catch (error) {
      console.error("Failed to clear data:", error)
      toast.error("Failed to clear data")
    }
  }, [])

  const formatTitle = (title: string) => {
    if (!title || title.trim() === "") return "Untitled Chat"
    return title.length > 30 ? title.substring(0, 30) + "..." : title
  }

  const formatLastMessage = (message?: string) => {
    if (!message || message.trim() === "") return "No messages yet"
    return message.length > 45 ? message.substring(0, 45) + "..." : message
  }

  useEffect(() => {
    loadConversations()
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "zen0-conversations") {
        loadConversations()
      }
    }
    
    const handleConversationCreated = () => {
      loadConversations()
    }
    
    const handleConversationUpdated = () => {
      loadConversations()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('conversation-created', handleConversationCreated)
    window.addEventListener('conversation-updated', handleConversationUpdated)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('conversation-created', handleConversationCreated)
      window.removeEventListener('conversation-updated', handleConversationUpdated)
    }
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
          <div className="space-y-4 p-4 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2 mx-auto" />
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
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Conversations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredConversations.map((conversation, index) => (
                  <SidebarMenuItem key={conversation.id} className="mb-2">
                    <SidebarMenuButton
                      isActive={currentConversationId === conversation.id}
                      onClick={() => onConversationSelect(conversation.id)}
                      size="lg"
                      className="group p-3 h-auto min-h-[2rem]"
                    >
                      <div className="flex-1 min-w-0 text-left space-y-2 overflow-hidden">
                        <div className="font-semibold text-sm leading-normal text-gray-900 dark:text-gray-100 break-words">
                          {formatTitle(conversation.title)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 leading-normal">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </SidebarMenuButton>
                    
                    <SidebarMenuAction
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className={`transition-opacity ${
                        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
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

        {/* Search Results Badge */}
        {searchQuery && (
          <div className="px-4 py-2">
            <Badge variant="secondary" className="w-full justify-center">
              {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarSeparator />
        <div className="p-2 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowBYOKSetup(true)}
          >
            <Key className="h-4 w-4" />
            API Keys
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowDataManager(true)}
          >
            <Database className="h-4 w-4" />
            Data Management
          </Button>
        </div>
      </SidebarFooter>

      <DataManagerDialog
        open={showDataManager}
        onOpenChange={setShowDataManager}
        onExport={handleExportData}
        onImport={handleImportData}
        onClearAll={handleClearAllData}
      />

      <BYOKSetupDialog
        open={showBYOKSetup}
        onOpenChange={setShowBYOKSetup}
      />
    </Sidebar>
  )
}
