"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Check, X, Brain } from "lucide-react"

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
    models: [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "gemma-7b-it",
    ],
    keyPrefix: "gsk_",
    description: "Fast inference with Llama, Mixtral, and Gemma",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
    keyPrefix: "AIza",
    description: "Gemini models from Google",
  },
  {
    id: "mem0",
    name: "Mem0",
    models: ["memory-service"], // Special case - not really a model
    keyPrefix: "m0-",
    description: "Long-term memory and context awareness",
    icon: <Brain className="w-4 h-4" />,
  },
]

export function BYOKSetup() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showKey, setShowKey] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)

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
    // Basic validation - check key format
    const providerConfig = providers.find((p) => p.id === provider)
    if (!providerConfig) return false

    if (provider === "mem0") {
      return key.startsWith("m0-") && key.length > 10
    }

    return key.startsWith(providerConfig.keyPrefix) && key.length > 10
  }

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKey) return

    if (selectedProvider !== "mem0" && !selectedModel) return

    setValidating(true)

    try {
      const isValid = await validateApiKey(selectedProvider, apiKey)

      if (isValid) {
        const newKey: APIKey = {
          provider: selectedProvider,
          key: apiKey,
          model: selectedProvider === "mem0" ? "memory-service" : selectedModel,
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

  const getProviderStatus = (providerId: string) => {
    return apiKeys.find((k) => k.provider === providerId)
  }

  const selectedProviderConfig = providers.find((p) => p.id === selectedProvider)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-light mb-2">API Configuration</h2>
        <p className="text-gray-600">Add your API keys to start chatting with different AI models</p>
      </div>

      {/* Current API Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const status = getProviderStatus(provider.id)
          return (
            <Card key={provider.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {provider.icon}
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                  </div>
                  {status ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="w-3 h-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </div>
                <CardDescription>{provider.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {status ? (
                  <div className="space-y-2">
                    {provider.id !== "mem0" && (
                      <p className="text-sm text-gray-600">
                        Model: <span className="font-medium">{status.model}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Key: <span className="font-mono">{status.key.slice(0, 8)}...</span>
                    </p>
                    <Button variant="outline" size="sm" onClick={() => handleRemoveKey(provider.id)} className="w-full">
                      Remove Key
                    </Button>
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
        <CardHeader>
          <CardTitle>Add New API Key</CardTitle>
          <CardDescription>Configure a new AI provider to expand your model options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProviderConfig.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            disabled={!selectedProvider || !apiKey || (selectedProvider !== "mem0" && !selectedModel) || validating}
            className="w-full"
          >
            {validating ? "Validating..." : "Add API Key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
