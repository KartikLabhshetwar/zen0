import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Edit2, Save, X as Cancel, Info, Key } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"

interface APIKey {
  provider: string
  key: string
  model?: string
}

interface BYOKSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BYOKSetupDialog({ open, onOpenChange }: BYOKSetupDialogProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [groqApiKey, setGroqApiKey] = useState<string>("")
  const [mem0ApiKey, setMem0ApiKey] = useState<string>("")
  const [showGroqKey, setShowGroqKey] = useState<boolean>(false)
  const [showMem0Key, setShowMem0Key] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [editingProvider, setEditingProvider] = useState<string>("")
  const [editKey, setEditKey] = useState<string>("")
  const [showEditKey, setShowEditKey] = useState<boolean>(false)
  const [showEditGroqKey, setShowEditGroqKey] = useState<boolean>(false)
  const [showEditMem0Key, setShowEditMem0Key] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem("zen0-api-keys")
    if (saved) {
      const parsedKeys = JSON.parse(saved)
      setApiKeys(parsedKeys)
      
      const groqKey = parsedKeys.find((key: APIKey) => key.provider === "groq")
      const mem0Key = parsedKeys.find((key: APIKey) => key.provider === "mem0")
      
      if (groqKey) {
        setGroqApiKey(groqKey.key)
      }
      if (mem0Key) {
        setMem0ApiKey(mem0Key.key)
      }
    }
  }, [])

  const saveApiKeys = (keys: APIKey[]) => {
    localStorage.setItem("zen0-api-keys", JSON.stringify(keys))
    setApiKeys(keys)
  }

  const validateGroqApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/groq/models", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  const validateMem0ApiKey = async (key: string): Promise<boolean> => {
    try {
      return key.startsWith("m0-") && key.length > 10
    } catch (error) {
      return false
    }
  }

  const handleAddGroqKey = async () => {
    if (!groqApiKey) return

    setValidating(true)
    try {
      const isValid = await validateGroqApiKey(groqApiKey)
      if (isValid) {
        const newKey: APIKey = { provider: "groq", key: groqApiKey }
        const updatedKeys = apiKeys.filter((k) => k.provider !== "groq")
        updatedKeys.push(newKey)
        saveApiKeys(updatedKeys)
        setGroqApiKey("")
        toast.success("Groq API key added successfully!")
      } else {
        toast.error("Invalid Groq API key. Please check and try again.")
      }
    } finally {
      setValidating(false)
    }
  }

  const handleAddMem0Key = async () => {
    if (!mem0ApiKey) return

    setValidating(true)
    try {
      const isValid = await validateMem0ApiKey(mem0ApiKey)
      if (isValid) {
        const newKey: APIKey = { provider: "mem0", key: mem0ApiKey }
        const updatedKeys = apiKeys.filter((k) => k.provider !== "mem0")
        updatedKeys.push(newKey)
        saveApiKeys(updatedKeys)
        setMem0ApiKey("")
        toast.success("Mem0 API key added successfully!")
      } else {
        toast.error("Invalid Mem0 API key. Please check and try again.")
      }
    } finally {
      setValidating(false)
    }
  }

  const handleRemoveKey = (provider: string) => {
    const updatedKeys = apiKeys.filter((k) => k.provider !== provider)
    saveApiKeys(updatedKeys)
    
    if (provider === "groq") {
      setGroqApiKey("")
    } else if (provider === "mem0") {
      setMem0ApiKey("")
    }
  }

  const handleEditKey = (provider: string) => {
    const existingKey = apiKeys.find((k) => k.provider === provider)
    if (existingKey) {
      setEditingProvider(provider)
      setEditKey(existingKey.key)
      setShowEditKey(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingProvider || !editKey) return

    setValidating(true)
    try {
      let isValid = false
      let updatedKey: APIKey | null = null

      if (editingProvider === "groq") {
        isValid = await validateGroqApiKey(editKey)
        if (isValid) {
          updatedKey = { provider: "groq", key: editKey }
        }
      } else if (editingProvider === "mem0") {
        isValid = await validateMem0ApiKey(editKey)
        if (isValid) {
          updatedKey = { provider: "mem0", key: editKey }
        }
      }

      if (isValid && updatedKey) {
        const updatedKeys = apiKeys.map((k) =>
          k.provider === editingProvider ? updatedKey! : k
        )
        saveApiKeys(updatedKeys)
        setEditingProvider("")
        setEditKey("")
        setShowEditKey(false)
        toast.success("API key updated successfully!")
      } else {
        toast.error("Invalid API key. Please check and try again.")
      }
    } finally {
      setValidating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProvider("")
    setEditKey("")
    setShowEditKey(false)
  }

  const getProviderStatus = (providerId: string) => {
    return apiKeys.find((k) => k.provider === providerId)
  }

  const groqConfigured = getProviderStatus("groq")
  const mem0Configured = getProviderStatus("mem0")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Setup
          </DialogTitle>
          <DialogDescription>Configure your API keys to start chatting with AI models</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Groq Configuration */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Groq API</h3>
              {groqConfigured ? (
                <Badge className="bg-green-50 text-green-700 border border-green-200">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="secondary">Not Set</Badge>
              )}
            </div>
            
            {groqConfigured ? (
                                <div className="space-y-4">
                    {editingProvider === "groq" && showEditKey ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">API Key</Label>
                          <div className="relative">
                            <Input
                              type={showEditGroqKey ? "text" : "password"}
                              value={editKey}
                              onChange={(e) => setEditKey(e.target.value)}
                              className="pr-12"
                              placeholder="Enter your Groq API key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowEditGroqKey(!showEditGroqKey)}
                            >
                              {showEditGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                          <Button variant="outline" onClick={handleCancelEdit} className="flex-1 h-10">
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} disabled={validating} className="flex-1 h-10">
                            Save
                          </Button>
                        </div>
                      </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">API Key</p>
                      <p className="text-sm font-mono">••••••{groqConfigured.key.slice(-4)}</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <Button variant="outline" onClick={() => handleEditKey("groq")} className="flex-1 h-10">
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => handleRemoveKey("groq")} className="flex-1 h-10 text-red-700 border-red-200 hover:bg-red-50">
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Groq API Key</Label>
                  <div className="relative">
                    <Input
                      type={showGroqKey ? "text" : "password"}
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="Starts with gsk_"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                    >
                      {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Get your API key from{" "}
                    <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline font-medium">
                      Groq Console
                    </a>
                  </p>
                </div>
                <Button
                  onClick={handleAddGroqKey}
                  disabled={!groqApiKey || validating}
                  className="w-full h-10"
                >
                  {validating ? "Validating..." : "Add Groq API Key"}
                </Button>
              </div>
            )}
          </div>

          {/* Mem0 Configuration */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Mem0 API</h3>
              {mem0Configured ? (
                <Badge className="bg-green-50 text-green-700 border border-green-200">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="secondary">Not Set</Badge>
              )}
            </div>
            
            {mem0Configured ? (
              <div className="space-y-4">
                {editingProvider === "mem0" && showEditKey ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">API Key</Label>
                      <div className="relative">
                        <Input
                          type={showEditMem0Key ? "text" : "password"}
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          className="pr-12"
                          placeholder="Enter your Mem0 API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowEditMem0Key(!showEditMem0Key)}
                        >
                          {showEditMem0Key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <Button variant="outline" onClick={handleCancelEdit} className="flex-1 h-10">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} disabled={validating} className="flex-1 h-10">
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">API Key</p>
                      <p className="text-sm font-mono">••••••{mem0Configured.key.slice(-4)}</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <Button variant="outline" onClick={() => handleEditKey("mem0")} className="flex-1 h-10">
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => handleRemoveKey("mem0")} className="flex-1 h-10 text-red-700 border-red-200 hover:bg-red-50">
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mem0 API Key</Label>
                  <div className="relative">
                    <Input
                      type={showMem0Key ? "text" : "password"}
                      value={mem0ApiKey}
                      onChange={(e) => setMem0ApiKey(e.target.value)}
                      placeholder="Starts with m0-"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowMem0Key(!showMem0Key)}
                    >
                      {showMem0Key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Get your API key from{" "}
                    <a href="https://app.mem0.ai/dashboard/api-keys" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline font-medium">
                      Mem0 Dashboard
                    </a>
                  </p>
                </div>
                <Button
                  onClick={handleAddMem0Key}
                  disabled={!mem0ApiKey || validating}
                  className="w-full h-10"
                >
                  {validating ? "Validating..." : "Add Mem0 API Key"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
