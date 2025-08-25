"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Edit2, Save, X as Cancel, Info, Key } from "lucide-react"
import { toast } from "sonner"

interface APIKey {
  provider: string
  key: string
  model?: string
}

interface Provider {
  id: string
  name: string
  models: string[]
  keyPrefix: string
  description: string
  icon?: React.ReactNode
}

const providers: Provider[] = [
  {
    id: "groq",
    name: "Groq",
    models: [],
    keyPrefix: "gsk_",
    description: "Ultra-fast inference API for cutting-edge AI models",
  },
  {
    id: "mem0",
    name: "Mem0",
    models: [],
    keyPrefix: "m0-",
    description: "Advanced memory system for persistent conversation context",
  },
]

export function BYOKSetup() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [groqApiKey, setGroqApiKey] = useState<string>("")
  const [mem0ApiKey, setMem0ApiKey] = useState<string>("")

  const [showGroqKey, setShowGroqKey] = useState<boolean>(false)
  const [showMem0Key, setShowMem0Key] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [editingProvider, setEditingProvider] = useState<string>("")
  const [editKey, setEditKey] = useState<string>("")
  const [showEditKey, setShowEditKey] = useState<boolean>(false)

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
      console.log("[zen0] Validating Groq API key")
      const response = await fetch("/api/groq/models", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      })
      
      if (!response.ok) {
        return false
      }
      
      const models = await response.json()
      const isValid = Array.isArray(models) && models.length > 0
      console.log("[zen0] Groq API key validation result:", isValid)
      return isValid
    } catch (error) {
      console.error("[zen0] Groq API key validation failed:", error)
      return false
    }
  }

  const validateMem0ApiKey = async (key: string): Promise<boolean> => {
    try {
      console.log("[zen0] Validating Mem0 API key")
      const isValid = key.startsWith("m0-") && key.length > 10
      console.log("[zen0] Mem0 API key validation result:", isValid)
      return isValid
    } catch (error) {
      console.error("[zen0] Mem0 API key validation failed:", error)
      return false
    }
  }

  const handleAddGroqKey = async () => {
    if (!groqApiKey) return

    setValidating(true)

    try {
      const isValid = await validateGroqApiKey(groqApiKey)

      if (isValid) {
        const newKey: APIKey = {
          provider: "groq",
          key: groqApiKey,
        }

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
        const newKey: APIKey = {
          provider: "mem0",
          key: mem0ApiKey,
        }

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
          updatedKey = {
            provider: "groq",
            key: editKey,
          }
        }
      } else if (editingProvider === "mem0") {
        isValid = await validateMem0ApiKey(editKey)
        if (isValid) {
          updatedKey = {
            provider: "mem0",
            key: editKey,
          }
        }
      }

      if (isValid && updatedKey) {
        const updatedKeys = apiKeys.map((k) =>
          k.provider === editingProvider ? updatedKey! : k,
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
    <div className="max-w-6xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section - Swiss Design Principles */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-6">
          <Key className="w-8 h-8 text-slate-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">API Key Setup</h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Configure your API keys to start chatting with AI models and enable memory features
        </p>
      </div>

      {/* Current Configuration Grid - Swiss Grid Layout */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-light text-slate-900">Current Configuration</h2>
          <p className="text-slate-600 text-lg">Manage your existing API key configurations</p>
        </div>

        {/* Provider Cards Grid - Always show both cards to maintain layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Groq Card - Always rendered */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden h-full">
            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-medium text-slate-900">{providers[0].name}</CardTitle>
                    <CardDescription className="text-slate-600 text-sm">{providers[0].description}</CardDescription>
                  </div>
                </div>
                {groqConfigured ? (
                  <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium rounded-full">
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1.5 text-sm font-medium rounded-full">
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Not Set
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8 pt-0">
              {groqConfigured ? (
                <div className="space-y-6">
                  {editingProvider === "groq" && showEditKey ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="edit-groq-key" className="text-sm font-medium text-slate-700">
                          API Key
                        </Label>
                        <div className="relative">
                          <Input
                            id="edit-groq-key"
                            type={showEditKey ? "text" : "password"}
                            value={editKey}
                            onChange={(e) => setEditKey(e.target.value)}
                            className="pr-12 h-12 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl"
                            placeholder="Enter your Groq API key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
                            onClick={() => setShowEditKey(!showEditKey)}
                          >
                            {showEditKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                        >
                          <Cancel className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                          disabled={validating}
                          className="flex-1 h-11 bg-slate-700 hover:bg-slate-800 rounded-2xl"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {validating ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">API Key</p>
                        <p className="text-sm text-slate-900 font-mono">••••••{groqConfigured.key.slice(-4)}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleEditKey("groq")}
                          className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRemoveKey("groq")}
                          className="flex-1 h-11 border-red-200 text-red-700 hover:bg-red-50 rounded-2xl"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="groq-apikey" className="text-sm font-medium text-slate-700">
                      Groq API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="groq-apikey"
                        type={showGroqKey ? "text" : "password"}
                        value={groqApiKey}
                        onChange={(e) => setGroqApiKey(e.target.value)}
                        placeholder="Starts with gsk_"
                        className="pr-12 h-12 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
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
                    className="w-full h-11 bg-slate-700 hover:bg-slate-800 rounded-2xl"
                  >
                    {validating ? "Validating..." : "Add Groq API Key"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mem0 Card - Always rendered */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden h-full">
            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-medium text-slate-900">{providers[1].name}</CardTitle>
                    <CardDescription className="text-slate-600 text-sm">{providers[1].description}</CardDescription>
                  </div>
                </div>
                {mem0Configured ? (
                  <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium rounded-full">
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1.5 text-sm font-medium rounded-full">
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Not Set
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8 pt-0">
              {mem0Configured ? (
                <div className="space-y-6">
                  {editingProvider === "mem0" && showEditKey ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="edit-mem0-key" className="text-sm font-medium text-slate-700">
                          API Key
                        </Label>
                        <div className="relative">
                          <Input
                            id="edit-mem0-key"
                            type={showEditKey ? "text" : "password"}
                            value={editKey}
                            onChange={(e) => setEditKey(e.target.value)}
                            className="pr-12 h-12 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl"
                            placeholder="Enter your Mem0 API key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
                            onClick={() => setShowEditKey(!showEditKey)}
                          >
                            {showEditKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                        >
                          <Cancel className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                          disabled={validating}
                          className="flex-1 h-11 bg-slate-700 hover:bg-slate-800 rounded-2xl"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {validating ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">API Key</p>
                        <p className="text-sm text-slate-900 font-mono">••••••{mem0Configured.key.slice(-4)}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleEditKey("mem0")}
                          className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRemoveKey("mem0")}
                          className="flex-1 h-11 border-red-200 text-red-700 hover:bg-red-50 rounded-2xl"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="mem0-apikey" className="text-sm font-medium text-slate-700">
                      Mem0 API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="mem0-apikey"
                        type={showMem0Key ? "text" : "password"}
                        value={mem0ApiKey}
                        onChange={(e) => setMem0ApiKey(e.target.value)}
                        placeholder="Starts with m0-"
                        className="pr-12 h-12 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
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
                    className="w-full h-11 bg-slate-700 hover:bg-slate-800 rounded-2xl"
                  >
                    {validating ? "Validating..." : "Add Mem0 API Key"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">How to get your API keys</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <span className="font-medium">Groq:</span> Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">https://console.groq.com/keys</a> to get your API key</li>
              <li>• <span className="font-medium">Mem0:</span> Visit <a href="https://app.mem0.ai/dashboard/api-keys" target="_blank" rel="noopener noreferrer" className="underline">https://app.mem0.ai/dashboard/api-keys</a> to get your API key</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}