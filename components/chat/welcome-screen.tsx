import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface WelcomeScreenProps {
  onNewConversation: () => void
}

export function WelcomeScreen({ onNewConversation }: WelcomeScreenProps) {
  const handleNewConversation = () => {
    onNewConversation()
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center min-h-full w-full">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/50">
        <MessageSquare className="w-8 h-8 text-slate-600" />
      </div>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 mb-2 px-2">Welcome to zen0</h1>
      <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-xs sm:max-w-sm md:max-w-md px-4 leading-relaxed">
        Start a new conversation to begin chatting with AI models. Your conversations will be saved locally for privacy.
      </p>
      <Button onClick={handleNewConversation} className="h-10 px-6 bg-slate-700 hover:bg-slate-800 text-base font-medium rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm">
        Start New Chat
      </Button>
    </div>
  )
}
