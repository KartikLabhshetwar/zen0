"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Edit2, Save, Anvil as Cancel } from "lucide-react"
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
    models: [], // Will be populated dynamically
    keyPrefix: "gsk_",
    description: "Fast inference with Llama, OpenAI, DeepSeek, and more",
  },
]

export function BYOKSetup() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showKey, setShowKey] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [editingProvider, setEditingProvider] = useState<string>("")
  const [editKey, setEditKey] = useState<string>("")
  const [editModel, setEditModel] = useState<string>("")
  const [showEditKey, setShowEditKey] = useState<boolean>(false)

  // Load saved API keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zen0-api-keys")
    if (saved) {
      setApiKeys(JSON.parse(saved))
    }
  }, [])

  // Save API keys to localStorage
  const saveApiKeys = (keys: APIKey[]) => {
    localStorage.setItem("zen0-api-keys", JSON.stringify(keys))
    setApiKeys(keys)
  }

  const validateApiKey = async (provider: string, key: string): Promise<boolean> => {
    const providerConfig = providers.find((p) => p.id === provider)
    if (!providerConfig) return false

    // Only Groq is supported now
    try {
      console.log("[v0] Validating Groq API key")
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
      console.log("[v0] Groq API key validation result:", isValid)
      return isValid
    } catch (error) {
      console.error("[v0] Groq API key validation failed:", error)
      return false
    }
  }

  const handleAddKey = async () => {
    if (!apiKey || !selectedModel) return

    setValidating(true)

    try {
      const isValid = await validateApiKey("groq", apiKey)

      if (isValid) {
        const newKey: APIKey = {
          provider: "groq",
          key: apiKey,
          model: selectedModel,
        }

        // Remove existing key for this provider if it exists
        const updatedKeys = apiKeys.filter((k) => k.provider !== "groq")
        updatedKeys.push(newKey)

        saveApiKeys(updatedKeys)

        // Reset form
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

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-3xl font-light mb-2">Groq API Configuration</h2>
        <p className="text-gray-600">Configure your Groq API key to start chatting with fast AI models</p>
      </div>

      {/* Current API Keys */}
      <div className="max-w-md">
        {providers.map((provider) => {
          const status = getProviderStatus(provider.id)
          const isEditing = editingProvider === provider.id
          const currentModel = status?.model || "No model selected"

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
                          <GroqModelSelector
                            value={editModel}
                            onValueChange={setEditModel}
                            apiKey={editKey}
                            placeholder="Select a model"
                          />
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
                          Model: <span className="font-medium break-all">{currentModel}</span>
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
          <CardTitle className="text-xl">Add Groq API Key</CardTitle>
          <CardDescription>Configure your Groq API key to start chatting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <GroqModelSelector
              value={selectedModel}
              onValueChange={setSelectedModel}
              apiKey={apiKey}
              placeholder="Select a model"
            />
            {/* loadingGroqModels && ( // This line is no longer needed */}
            {/*   <p className="text-xs text-gray-500">Fetching latest models from Groq API...</p> */}
            {/* ) */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Starts with gsk_"
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
            disabled={!apiKey || !selectedModel || validating}
            className="w-full"
          >
            {validating ? "Validating..." : "Add Groq API Key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
