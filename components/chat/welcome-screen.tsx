import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WelcomeScreenProps {
  onNewConversation: () => void
}

export function WelcomeScreen({ onNewConversation }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-xs sm:max-w-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-light text-gray-900 mb-2">Welcome to zen0</h2>
        <p className="text-gray-600 mb-6 text-center leading-relaxed text-sm">
          Create a new chat to start a conversation with AI
        </p>
        <Button onClick={onNewConversation} className="h-10 px-6 bg-gray-900 hover:bg-gray-800 text-base font-medium rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  )
}
