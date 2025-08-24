import { Button } from "@/components/ui/button"
import { BYOKSetup } from "@/components/byok-setup"

interface ApiSetupScreenProps {
  onBackToChat: () => void
  onContinueToChat: () => void
}

export function ApiSetupScreen({ onBackToChat, onContinueToChat }: ApiSetupScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back to Chat Button */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="outline"
            onClick={onBackToChat}
            className="h-9 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
          >
            ← Back to Chat
          </Button>
        </div>
        
        <BYOKSetup />
        <div className="text-center mt-8 sm:mt-12">
          <Button
            onClick={onContinueToChat}
            className="h-10 px-6 sm:px-8 bg-neutral-800 hover:bg-neutral-900 text-base font-medium rounded-full"
          >
            Continue to Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
