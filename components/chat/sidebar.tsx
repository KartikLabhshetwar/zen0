import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Settings, Database, ChevronsLeft, ChevronsRight, X, Trash2 } from "lucide-react"
import { Conversation } from "@/lib/local-storage"

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
    <div className={`${sidebarCollapsed ? 'md:w-20 -translate-x-full md:translate-x-0' : 'md:w-80 translate-x-0'} w-full md:border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out md:relative absolute md:static z-30 h-full`}>
      {/* Sidebar Header with Toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col items-center gap-3 mb-4">
          {sidebarCollapsed ? (
            <>
              <Link href="/" className="flex flex-col items-center gap-2">
                <div className="text-lg font-bold text-neutral-800">zen0</div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="hidden md:flex h-8 w-8 p-0 rounded-md hover:bg-gray-100"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewConversation}
                className="h-8 w-8 p-0 rounded-full bg-neutral-800 hover:bg-neutral-900"
                title="New Chat"
              >
                <Plus className="w-4 h-4 text-white" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between w-full">
                <Link href="/" className="text-lg font-bold text-neutral-800">zen0</Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSidebarToggle}
                  className="hidden md:flex h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                onClick={onNewConversation} 
                className="md:w-full h-10 bg-neutral-800 hover:bg-neutral-900 font-medium rounded-lg transition-all duration-300 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </>
          )}
          <div className="flex items-center gap-1 w-full justify-between md:justify-end">
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="md:hidden h-8 w-8 p-0 rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-2">
        <div className="px-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative mb-1">
              <Button
                {...({ variant: currentConversation?.id === conv.id ? "secondary" : "ghost" } as any)}
                className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-auto py-3 px-2 text-left hover:bg-gray-100 rounded-lg transition-all duration-200`}
                onClick={() => onConversationSelect(conv)}
              >
                <div className="min-w-0 flex-1">
                  {sidebarCollapsed ? (
                    <div className="md:hidden flex flex-col items-start">
                      <div className="font-medium text-gray-900 truncate text-sm">{conv.title}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{conv.model}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start">
                      <div className="font-medium text-gray-900 truncate text-sm">{conv.title}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{conv.model}</div>
                    </div>
                  )}
                </div>
              </Button>
              <Button
                {...({ variant: "ghost" } as any)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-gray-200 rounded-md z-10"
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

      <div className="p-2 border-t border-gray-200">
        <div className="space-y-1">
          <Button 
            {...({ variant: "ghost" } as any)} 
            className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200`} 
            onClick={onShowApiSetup}
          >
            <Settings className="w-4 h-4 md:mr-0 mr-3" />
            {!sidebarCollapsed && <span className="md:ml-3">API Settings</span>}
          </Button>
          <Button 
            {...({ variant: "ghost" } as any)} 
            className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200`}
            onClick={onShowDataManager}
          >
            <Database className="w-4 h-4 md:mr-0 mr-3" />
            {!sidebarCollapsed && <span className="md:ml-3">Data Manager</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
