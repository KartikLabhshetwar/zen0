import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { toast } from "sonner"

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const handleMenuToggle = () => {
    onMenuToggle()
    toast.info("Menu toggled")
  }

  return (
    <div className="md:hidden flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white flex-shrink-0">
      <h1 className="text-lg font-bold text-slate-800">zen0</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMenuToggle}
        className="h-9 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl transition-all duration-200"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </div>
  )
}
