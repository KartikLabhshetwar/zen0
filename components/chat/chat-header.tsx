import { Conversation } from "@/lib/local-storage"

interface ChatHeaderProps {
  conversation: Conversation
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <div className="border-b border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-slate-900 truncate">{conversation.title}</h1>
          <p className="text-xs text-slate-600 truncate mt-1">
            {conversation.model}
          </p>
        </div>
      </div>
    </div>
  )
}
