"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Edit2, Save, Anvil as Cancel } from "lucide-react"

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

const fetchGroqModels = async (apiKey: string): Promise<string[]> => {
  try {
    console.log("[v0] Fetching Groq models with API key")
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Groq API response not ok:", response.status, response.statusText)
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Groq API response:", data)

    const models =
      data.data
        ?.filter(
          (model: any) =>
            model.active &&
            !model.id.includes("whisper") &&
            !model.id.includes("guard") &&
            !model.id.includes("distil-whisper") &&
            !model.id.includes("tts"),
        )
        ?.map((model: any) => model.id)
        ?.sort() || []

    console.log("[v0] Filtered Groq models:", models)
    return models.length > 0
      ? models
      : ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b"]
  } catch (error) {
    console.error("[v0] Error fetching Groq models:", error)
    return [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "deepseek-r1-distill-llama-70b",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "compound-beta",
    ]
  }
}

const providers: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    keyPrefix: "sk-",
    description: "GPT models from OpenAI",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    keyPrefix: "sk-ant-",
    description: "Claude models from Anthropic",
  },
  {
    id: "groq",
    name: "Groq",
    models: [], // Will be populated dynamically
    keyPrefix: "gsk_",
    description: "Fast inference with Llama, OpenAI, DeepSeek, and more",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
    keyPrefix: "AIza",
    description: "Gemini models from Google",
  },
]

export function BYOKSetup() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showKey, setShowKey] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [editingProvider, setEditingProvider] = useState<string>("")
  const [editKey, setEditKey] = useState<string>("")
  const [editModel, setEditModel] = useState<string>("")
  const [showEditKey, setShowEditKey] = useState<boolean>(false)
  const [groqModels, setGroqModels] = useState<string[]>([])
  const [loadingGroqModels, setLoadingGroqModels] = useState<boolean>(false)

  // Load saved API keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zen0-api-keys")
    if (saved) {
      setApiKeys(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (selectedProvider === "groq") {
      setLoadingGroqModels(true)
      // Use a temporary API key or existing one to fetch models
      const existingGroqKey = apiKeys.find((k) => k.provider === "groq")?.key
      const keyToUse = apiKey && apiKey.startsWith("gsk_") ? apiKey : existingGroqKey

      if (keyToUse) {
        fetchGroqModels(keyToUse)
          .then((models) => {
            console.log("[v0] Loaded Groq models:", models)
            setGroqModels(models)
            setLoadingGroqModels(false)
          })
          .catch((error) => {
            console.error("[v0] Failed to load Groq models:", error)
            setLoadingGroqModels(false)
          })
      } else {
        // Load fallback models if no API key available
        setGroqModels(["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b"])
        setLoadingGroqModels(false)
      }
    }
  }, [selectedProvider, apiKey, apiKeys])

  // Save API keys to localStorage
  const saveApiKeys = (keys: APIKey[]) => {
    localStorage.setItem("zen0-api-keys", JSON.stringify(keys))
    setApiKeys(keys)
  }

  const validateApiKey = async (provider: string, key: string): Promise<boolean> => {
    const providerConfig = providers.find((p) => p.id === provider)
    if (!providerConfig) return false

    if (provider === "groq") {
      try {
        console.log("[v0] Validating Groq API key")
        const models = await fetchGroqModels(key)
        const isValid = models.length > 0
        console.log("[v0] Groq API key validation result:", isValid)
        return isValid
      } catch (error) {
        console.error("[v0] Groq API key validation failed:", error)
        return false
      }
    }

    const isValidFormat = key.startsWith(providerConfig.keyPrefix) && key.length > 10
    console.log("[v0] API key format validation for", provider, ":", isValidFormat)
    return isValidFormat
  }

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKey) return

    if (!selectedModel) return

    setValidating(true)

    try {
      const isValid = await validateApiKey(selectedProvider, apiKey)

      if (isValid) {
        const newKey: APIKey = {
          provider: selectedProvider,
          key: apiKey,
          model: selectedModel,
        }

        // Remove existing key for this provider if it exists
        const updatedKeys = apiKeys.filter((k) => k.provider !== selectedProvider)
        updatedKeys.push(newKey)

        saveApiKeys(updatedKeys)

        // Reset form
        setSelectedProvider("")
        setApiKey("")
        setSelectedModel("")
      }
    } finally {
      setValidating(false)
    }
  }

  const handleRemoveKey = (provider: string) => {
    const updatedKeys = apiKeys.filter((k) => k.provider !== provider)
    saveApiKeys(updatedKeys)
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
    if (!editingProvider || !editKey || !editModel) return

    setValidating(true)

    try {
      const isValid = await validateApiKey(editingProvider, editKey)

      if (isValid) {
        const updatedKeys = apiKeys.map((k) =>
          k.provider === editingProvider ? { ...k, key: editKey, model: editModel } : k,
        )

        saveApiKeys(updatedKeys)

        // Reset edit state
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

  const getCurrentModels = (providerId: string) => {
    if (providerId === "groq") {
      return groqModels.length > 0 ? groqModels : providers.find((p) => p.id === providerId)?.models || []
    }
    return providers.find((p) => p.id === providerId)?.models || []
  }

  const selectedProviderConfig = providers.find((p) => p.id === selectedProvider)

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-3xl font-light mb-2">API Configuration</h2>
        <p className="text-gray-600">Add your API keys to start chatting with different AI models</p>
      </div>

      {/* Current API Keys */}
      <div className="grid grid-cols-2 gap-4">
        {providers.map((provider) => {
          const status = getProviderStatus(provider.id)
          const isEditing = editingProvider === provider.id
          const currentModels = getCurrentModels(provider.id)

          return (
            <Card key={provider.id} className="relative">
              <CardHeader className="pb-3 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {provider.icon}
                    <CardTitle className="text-lg truncate">{provider.name}</CardTitle>
                  </div>
                  {status ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                      <Check className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      <X className="w-3 h-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">{provider.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {status ? (
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-model-${provider.id}`}>Model</Label>
                          <Select value={editModel} onValueChange={setEditModel}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {currentModels.map((model) => (
                                <SelectItem key={model} value={model}>
                                  <span className="break-all">{model}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-key-${provider.id}`}>API Key</Label>
                          <div className="relative">
                            <Input
                              id={`edit-key-${provider.id}`}
                              type={showEditKey ? "text" : "password"}
                              value={editKey}
                              onChange={(e) => setEditKey(e.target.value)}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowEditKey(!showEditKey)}
                            >
                              {showEditKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={validating}
                            className="flex-1"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {validating ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="flex-1 bg-transparent"
                          >
                            <Cancel className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          Model: <span className="font-medium break-all">{status.model}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Key: <span className="font-mono">{status.key.slice(0, 8)}...</span>
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditKey(provider.id)}
                            className="flex-1"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveKey(provider.id)}
                            className="flex-1"
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No API key configured</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add New API Key */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-xl">Add New API Key</CardTitle>
          <CardDescription>Configure a new AI provider to expand your model options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      {provider.icon}
                      {provider.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProviderConfig && selectedProvider !== "mem0" && (
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedProvider === "groq" && loadingGroqModels ? "Loading models..." : "Select a model"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {getCurrentModels(selectedProvider).map((model) => (
                    <SelectItem key={model} value={model}>
                      <span className="break-all">{model}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider === "groq" && loadingGroqModels && (
                <p className="text-xs text-gray-500">Fetching latest models from Groq API...</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  selectedProviderConfig ? `Starts with ${selectedProviderConfig.keyPrefix}` : "Enter your API key"
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAddKey}
            disabled={!selectedProvider || !apiKey || !selectedModel || validating}
            className="w-full"
          >
            {validating ? "Validating..." : "Add API Key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
