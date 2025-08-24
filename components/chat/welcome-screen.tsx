import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

interface WelcomeScreenProps {
  onNewConversation: () => void
}

export function WelcomeScreen({ onNewConversation }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/50">
        <MessageSquare className="w-8 h-8 text-slate-600" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Welcome to zen0</h1>
      <p className="text-slate-600 mb-6 max-w-md">
        Start a new conversation to begin chatting with AI models. Your conversations will be saved locally for privacy.
      </p>
      <Button onClick={onNewConversation} className="h-10 px-6 bg-slate-700 hover:bg-slate-800 text-base font-medium rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm">
        Start New Chat
      </Button>
    </div>
  )
}
