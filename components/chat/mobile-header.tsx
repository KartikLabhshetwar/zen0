import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <div className="md:hidden p-3 border-b border-gray-200 bg-white">
      <Button
        variant="outline"
        size="sm"
        onClick={onMenuToggle}
        className="h-9 px-3 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
      >
        <Menu className="w-4 h-4 mr-2" />
        Menu
      </Button>
    </div>
  )
}
