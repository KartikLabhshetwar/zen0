"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Edit2, Save, X as Cancel, Info } from "lucide-react"
import { GroqModelSelector } from "@/components/ui/groq-model-selector"

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
    description: "Fast inference with Llama, OpenAI, DeepSeek, and more",
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
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showGroqKey, setShowGroqKey] = useState<boolean>(false)
  const [showMem0Key, setShowMem0Key] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [editingProvider, setEditingProvider] = useState<string>("")
  const [editKey, setEditKey] = useState<string>("")
  const [editModel, setEditModel] = useState<string>("")
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
      // Simple validation - check if key has the right prefix
      // In a real implementation, you might want to make an actual API call
      const isValid = key.startsWith("m0-") && key.length > 10
      console.log("[zen0] Mem0 API key validation result:", isValid)
      return isValid
    } catch (error) {
      console.error("[zen0] Mem0 API key validation failed:", error)
      return false
    }
  }

  const handleAddGroqKey = async () => {
    if (!groqApiKey || !selectedModel) return

    setValidating(true)

    try {
      const isValid = await validateGroqApiKey(groqApiKey)

      if (isValid) {
        const newKey: APIKey = {
          provider: "groq",
          key: groqApiKey,
          model: selectedModel,
        }

        const updatedKeys = apiKeys.filter((k) => k.provider !== "groq")
        updatedKeys.push(newKey)
        saveApiKeys(updatedKeys)

        setGroqApiKey("")
        setSelectedModel("")
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
      setEditModel(existingKey.model || "")
    }
  }

  const handleSaveEdit = async () => {
    if (!editingProvider || !editKey) return

    setValidating(true)

    try {
      let isValid = false
      let updatedKey: APIKey | null = null

      if (editingProvider === "groq") {
        if (!editModel) return
        isValid = await validateGroqApiKey(editKey)
        if (isValid) {
          updatedKey = {
            provider: "groq",
            key: editKey,
            model: editModel,
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
        setEditModel("")
        setShowEditKey(false)
      }
    } finally {
      setValidating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProvider("")
    setEditKey("")
    setEditModel("")
    setShowEditKey(false)
  }

  const getProviderStatus = (providerId: string) => {
    return apiKeys.find((k) => k.provider === providerId)
  }

  // Check if any provider has a configured API key
  const groqConfigured = getProviderStatus("groq")
  const mem0Configured = getProviderStatus("mem0")

  return (
    <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">API Key Setup</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Configure your API keys to start chatting with AI models and enable memory features
        </p>
      </div>

      {/* Current Configuration */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-light text-gray-900">Current Configuration</h2>
          <p className="text-gray-600 mt-2">Manage your existing API key configurations</p>
        </div>

        <div className="grid gap-6 max-w-3xl mx-auto">
          {providers.map((provider) => {
            const status = getProviderStatus(provider.id)
            const isEditing = editingProvider === provider.id
            const currentModel = status?.model || "No model selected"

            return (
              <Card key={provider.id} className="border-2 border-gray-300 shadow-none bg-white rounded-2xl overflow-hidden">
                <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-medium text-gray-900">{provider.name}</CardTitle>
                      <CardDescription className="text-gray-600">{provider.description}</CardDescription>
                    </div>
                    {status ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-2 border-green-200 px-4 py-2 text-sm font-medium self-start sm:self-auto rounded-full">
                        <Check className="w-4 h-4 mr-2" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-2 border-gray-200 px-4 py-2 text-sm font-medium self-start sm:self-auto rounded-full">
                        <X className="w-4 h-4 mr-2" />
                        Not Set
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
                  {status ? (
                    <div className="space-y-6">
                      {isEditing ? (
                        <div className="space-y-6">
                          {provider.id === "groq" && (
                            <div className="space-y-4">
                              <Label htmlFor={`edit-model-${provider.id}`} className="text-sm font-medium text-gray-700">
                                Model
                              </Label>
                              <div className="w-full max-w-md mx-auto">
                                <GroqModelSelector
                                  value={editModel}
                                  onValueChange={setEditModel}
                                  apiKey={editKey}
                                  placeholder="Select a model"
                                  className="w-full rounded-xl border-2 border-gray-300"
                                />
                              </div>
                            </div>
                          )}
                          <div className="space-y-4">
                            <Label htmlFor={`edit-key-${provider.id}`} className="text-sm font-medium text-gray-700">
                              API Key
                            </Label>
                            <div className="relative max-w-md mx-auto">
                              <Input
                                id={`edit-key-${provider.id}`}
                                type={showEditKey ? "text" : "password"}
                                value={editKey}
                                onChange={(e) => setEditKey(e.target.value)}
                                className="pr-12 h-12 border-2 border-gray-300 focus:border-gray-500 focus:ring-0 rounded-xl"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100 rounded-xl"
                                onClick={() => setShowEditKey(!showEditKey)}
                              >
                                {showEditKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={handleCancelEdit}
                              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                            >
                              <Cancel className="w-5 h-5 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="lg"
                              onClick={handleSaveEdit}
                              disabled={validating}
                              className="flex-1 h-12 bg-neutral-800 hover:bg-neutral-900 rounded-xl font-medium"
                            >
                              <Save className="w-5 h-5 mr-2" />
                              {validating ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {provider.id === "groq" && (
                              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Model</p>
                                <p className="text-sm text-gray-900 font-mono break-all">{currentModel}</p>
                              </div>
                            )}
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">API Key</p>
                              <p className="text-sm text-gray-900 font-mono">••••••{status.key.slice(-4)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleEditKey(provider.id)}
                              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                            >
                              <Edit2 className="w-5 h-5 mr-2" />
                              Edit Configuration
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleRemoveKey(provider.id)}
                              className="flex-1 h-12 border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-xl font-medium"
                            >
                              <X className="w-5 h-5 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg">No API key configured for this provider</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Add New API Keys - Separate sections for Groq and Mem0 */}
      {(!groqConfigured || !mem0Configured) && (
        <div className="space-y-8 pb-10">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-light text-gray-900">Add New API Keys</h2>
            <p className="text-gray-600 mt-2">Configure your API keys to start chatting</p>
          </div>

          {/* Groq Configuration */}
          {!groqConfigured && (
            <Card className="border-2 border-gray-300 shadow-none bg-white rounded-2xl max-w-3xl mx-auto overflow-hidden">
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl font-medium text-gray-900 text-center">Groq API Configuration</CardTitle>
                <CardDescription className="text-gray-600 text-center mt-2">
                  Enter your Groq API key and select a model to begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
                <div className="space-y-4">
                  <Label htmlFor="model" className="text-sm font-medium text-gray-700 text-center block">
                    Model
                  </Label>
                  <div className="w-full max-w-md mx-auto">
                    <GroqModelSelector
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      apiKey={groqApiKey}
                      placeholder="Select a model"
                      className="w-full rounded-xl border-2 border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="groq-apikey" className="text-sm font-medium text-gray-700 text-center block">
                    Groq API Key
                  </Label>
                  <div className="relative max-w-md mx-auto">
                    <Input
                      id="groq-apikey"
                      type={showGroqKey ? "text" : "password"}
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="Starts with gsk_"
                      className="pr-12 h-12 border-2 border-gray-300 focus:border-gray-500 focus:ring-0 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100 rounded-xl"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                    >
                      {showGroqKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Get your API key from{" "}
                    <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline font-medium">
                      Groq Console
                    </a>
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleAddGroqKey}
                    disabled={!groqApiKey || !selectedModel || validating}
                    className="h-12 px-8 bg-neutral-800 hover:bg-neutral-900 text-base font-medium rounded-xl"
                  >
                    {validating ? "Validating..." : "Add Groq API Key"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mem0 Configuration */}
          {!mem0Configured && (
            <Card className="border-2 border-gray-300 shadow-none bg-white rounded-2xl max-w-3xl mx-auto overflow-hidden">
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl font-medium text-gray-900 text-center">Mem0 API Configuration</CardTitle>
                <CardDescription className="text-gray-600 text-center mt-2">
                  Enter your Mem0 API key to enable advanced memory features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
                <div className="space-y-4">
                  <Label htmlFor="mem0-apikey" className="text-sm font-medium text-gray-700 text-center block">
                    Mem0 API Key
                  </Label>
                  <div className="relative max-w-md mx-auto">
                    <Input
                      id="mem0-apikey"
                      type={showMem0Key ? "text" : "password"}
                      value={mem0ApiKey}
                      onChange={(e) => setMem0ApiKey(e.target.value)}
                      placeholder="Starts with m0-"
                      className="pr-12 h-12 border-2 border-gray-300 focus:border-gray-500 focus:ring-0 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100 rounded-xl"
                      onClick={() => setShowMem0Key(!showMem0Key)}
                    >
                      {showMem0Key ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Get your API key from{" "}
                    <a href="https://app.mem0.ai/dashboard/api-keys" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline font-medium">
                      Mem0 Dashboard
                    </a>
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleAddMem0Key}
                    disabled={!mem0ApiKey || validating}
                    className="h-12 px-8 bg-neutral-800 hover:bg-neutral-900 text-base font-medium rounded-xl"
                  >
                    {validating ? "Validating..." : "Add Mem0 API Key"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">How to get your API keys</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <span className="font-medium">Groq:</span> Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">https://console.groq.com/keys</a> to get your free API key</li>
              <li>• <span className="font-medium">Mem0:</span> Visit <a href="https://app.mem0.ai/dashboard/api-keys" target="_blank" rel="noopener noreferrer" className="underline">https://app.mem0.ai/dashboard/api-keys</a> to get your API key</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}