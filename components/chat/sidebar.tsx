import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Settings, Database, X, Trash2 } from "lucide-react"
import { Conversation } from "@/lib/local-storage"
import { toast } from "sonner"

interface SidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  onNewConversation: () => void
  onConversationSelect: (conversation: Conversation) => void
  onConversationDelete: (conversationId: string) => void
  onShowApiSetup: () => void
  onShowDataManager: () => void
}

export function Sidebar({
  conversations,
  currentConversation,
  sidebarCollapsed,
  onSidebarToggle,
  onNewConversation,
  onConversationSelect,
  onConversationDelete,
  onShowApiSetup,
  onShowDataManager
}: SidebarProps) {
  return (
    <div className={`${sidebarCollapsed ? 'w-[80%] -translate-x-full' : 'w-[80%] translate-x-0'} md:w-80 md:translate-x-0 md:relative absolute z-30 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
      {/* Sidebar Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="text-lg font-bold text-slate-800">zen0</Link>
            {/* Mobile Close Button - Only visible on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSidebarToggle()
                toast.info("Sidebar toggled")
              }}
              className="md:hidden h-8 w-8 p-0 rounded-2xl hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={onNewConversation} 
            className="w-full h-10 bg-slate-700 hover:bg-slate-800 font-medium rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 py-2 overflow-hidden">
        <div className="px-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative mb-1">
              <Button
                {...({ variant: currentConversation?.id === conv.id ? "secondary" : "ghost" } as any)}
                className="w-full justify-start h-auto py-3 px-2 text-left hover:bg-slate-100 rounded-2xl transition-all duration-200"
                onClick={() => {
                  onConversationSelect(conv)
                  toast.success(`Switched to: ${conv.title}`)
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-start">
                    <div className="font-medium text-slate-900 truncate text-sm">{conv.title}</div>
                    <div className="text-xs text-slate-500 truncate mt-1">{conv.model}</div>
                  </div>
                </div>
              </Button>
              {/* Delete button - Always visible on mobile, hover visible on desktop */}
              <Button
                {...({ variant: "ghost" } as any)}
                className="absolute right-2 top-1/2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-slate-200 rounded-xl z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onConversationDelete(conv.id)
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-2 border-t border-slate-200">
        <div className="space-y-1">
          <Button 
            {...({ variant: "ghost" } as any)} 
            className="w-full justify-start h-10 text-slate-700 hover:bg-slate-100 rounded-2xl transition-all duration-200" 
            onClick={() => {
              onShowApiSetup()
              toast.info("Opening API Setup...")
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            API Setup
          </Button>
          <Button 
            {...({ variant: "ghost" } as any)} 
            className="w-full justify-start h-10 text-slate-700 hover:bg-slate-100 rounded-2xl transition-all duration-200" 
            onClick={() => {
              onShowDataManager()
              toast.info("Opening Data Manager...")
            }}
          >
            <Database className="w-4 h-4 mr-2" />
            Data Manager
          </Button>
        </div>
      </div>
    </div>
  )
}
