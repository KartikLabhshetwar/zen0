import { Button } from "@/components/ui/button"
import { BYOKSetup } from "@/components/byok-setup"
import { toast } from "sonner"

interface ApiSetupScreenProps {
  onBackToChat: () => void
  onContinueToChat: () => void
}

export function ApiSetupScreen({ onBackToChat, onContinueToChat }: ApiSetupScreenProps) {
  const handleBackToChat = () => {
    onBackToChat()
    toast.info("Returning to chat...")
  }

  const handleContinueToChat = () => {
    onContinueToChat()
    toast.success("API setup completed! Welcome to chat!")
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back to Chat Button */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="outline"
            onClick={handleBackToChat}
            className="h-9 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl transition-all duration-200"
          >
            ← Back to Chat
          </Button>
        </div>
        
        <BYOKSetup />
        <div className="text-center mt-8 sm:mt-12">
          <Button
            onClick={handleContinueToChat}
            className="h-10 px-6 sm:px-8 bg-slate-700 hover:bg-slate-800 text-base font-medium rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm"
          >
            Continue to Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
