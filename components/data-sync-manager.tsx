"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Cloud, HardDrive, Upload, Download, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface LocalConversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
}

interface SyncManagerProps {
  onSyncComplete?: () => void
}

export function DataSyncManager({ onSyncComplete }: SyncManagerProps) {
  const { data: session } = useSession()
  const [localConversations, setLocalConversations] = useState<LocalConversation[]>([])
  const [cloudMode, setCloudMode] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadLocalConversations()
      loadCloudMode()
    }
  }, [session])

  const loadLocalConversations = () => {
    const stored = localStorage.getItem("zen0-conversations")
    if (stored) {
      setLocalConversations(JSON.parse(stored))
    }
  }

  const loadCloudMode = async () => {
    try {
      const response = await fetch("/api/user/settings")
      if (response.ok) {
        const settings = await response.json()
        setCloudMode(settings.cloud_sync !== false)
      }
    } catch (error) {
      console.error("Failed to load cloud mode setting:", error)
    }
  }

  const toggleCloudMode = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloud_sync: enabled }),
      })

      if (response.ok) {
        setCloudMode(enabled)
        toast.success(enabled ? "Cloud sync enabled" : "Cloud sync disabled")
      } else {
        toast.error("Failed to update sync setting")
      }
    } catch (error) {
      console.error("Failed to toggle cloud mode:", error)
      toast.error("Failed to update sync setting")
    }
  }

  const syncLocalToCloud = async () => {
    if (!session?.user || localConversations.length === 0) return

    setSyncing(true)
    try {
      let syncedCount = 0

      for (const conv of localConversations) {
        // Check if conversation already exists in cloud
        const existsResponse = await fetch(`/api/conversations/${conv.id}`)
        if (existsResponse.ok) continue // Skip if already exists

        // Create conversation in cloud
        const createResponse = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conv),
        })

        if (createResponse.ok) {
          // Sync messages
          const messages = localStorage.getItem(`zen0-messages-${conv.id}`)
          if (messages) {
            await fetch(`/api/conversations/${conv.id}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: JSON.parse(messages) }),
            })
          }
          syncedCount++
        }
      }

      toast.success(`Synced ${syncedCount} conversations to cloud`)
      onSyncComplete?.()
    } catch (error) {
      console.error("Failed to sync to cloud:", error)
      toast.error("Failed to sync conversations")
    } finally {
      setSyncing(false)
    }
  }

  const clearLocalData = () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      localStorage.removeItem("zen0-conversations")
      localConversations.forEach((conv) => {
        localStorage.removeItem(`zen0-messages-${conv.id}`)
      })
      setLocalConversations([])
      toast.success("Local data cleared")
      onSyncComplete?.()
    }
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Local Storage Mode
          </CardTitle>
          <CardDescription>
            Your conversations are stored locally in your browser. Sign in to enable cloud sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <HardDrive className="w-3 h-3" />
            Local Only
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cloud Sync Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Sync
          </CardTitle>
          <CardDescription>Choose how your conversations are stored and synchronized</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Cloud Sync</Label>
              <p className="text-sm text-muted-foreground">Store conversations in the cloud and sync across devices</p>
            </div>
            <Switch checked={cloudMode} onCheckedChange={toggleCloudMode} />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={cloudMode ? "default" : "secondary"} className="flex items-center gap-1">
              {cloudMode ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              {cloudMode ? "Cloud Sync" : "Local Only"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Local Data Migration */}
      {localConversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Local Data Migration
            </CardTitle>
            <CardDescription>You have {localConversations.length} conversations stored locally</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Local conversations found</p>
                <p className="text-amber-700">
                  Sync your local conversations to the cloud to access them across devices
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={syncLocalToCloud} disabled={syncing} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                {syncing ? "Syncing..." : "Sync to Cloud"}
              </Button>
              <Button variant="outline" onClick={clearLocalData}>
                Clear Local Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Storage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Local conversations:</span>
            <Badge variant="outline">{localConversations.length}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {cloudMode
              ? "New conversations will be saved to the cloud and synced across devices"
              : "New conversations will be saved locally in your browser only"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
