import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-sm w-[95vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Data Management</DialogTitle>
          <DialogDescription>Export, import, or clear your local data</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <Button onClick={onExport} className="w-full h-10 bg-slate-700 hover:bg-slate-800 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
                id="import-file"
              />
              <Button 
                variant="outline" 
                className="w-full h-10 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </label>
          </div>
          <Button 
            variant="destructive" 
            onClick={onClearAll}
            className="w-full h-10 bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm"
          >
            Clear All Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
