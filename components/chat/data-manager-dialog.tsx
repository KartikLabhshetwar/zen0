import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload as UploadIcon } from "lucide-react"

interface DataManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearAll: () => void
}

export function DataManagerDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
  onClearAll
}: DataManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Data Management</DialogTitle>
          <DialogDescription>Export, import, or clear your local data</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button onClick={onExport} className="w-full h-10 bg-gray-900 hover:bg-gray-800 rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button {...({ variant: "outline" } as any)} className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
              <label className="flex items-center justify-center w-full cursor-pointer">
                <UploadIcon className="w-4 h-4 mr-2" />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
          
          <Button {...({ variant: "destructive" } as any)} onClick={onClearAll} className="w-full h-10 rounded-lg">
            Clear All Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
