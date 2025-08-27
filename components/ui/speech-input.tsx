"use client"

import { useState, useRef } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

interface SpeechInputProps {
  onTranscriptChange: (transcript: string) => void
  className?: string
  disabled?: boolean
  apiKey?: string
  selectedModel?: string
}

export function SpeechInput({ onTranscriptChange, className, disabled, apiKey, selectedModel }: SpeechInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        
        try {
          if (!apiKey) {
            throw new Error("API key required for speech transcription")
          }

          // Select the best available STT model
          let sttModel = "whisper-large-v3" // fallback
          if (selectedModel && selectedModel.includes("whisper")) {
            sttModel = selectedModel
          } else {
            // Use the fastest model for speech transcription
            sttModel = "whisper-large-v3-turbo"
          }

          const formData = new FormData()
          formData.append("file", audioBlob, "recording.wav")
          formData.append("model", sttModel)
          formData.append("response_format", "text")



          const response = await fetch("/api/groq/audio/transcribe", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.statusText}`)
          }

          const transcript = await response.text()
          onTranscriptChange(transcript)
        } catch (error) {
          console.error("Transcription error:", error)
          // Show user-friendly error message
          if (error instanceof Error) {
            if (error.message.includes("API key required")) {
              onTranscriptChange("[Error: Please configure your API key first]")
            } else {
              onTranscriptChange("[Error: Speech transcription failed. Please try again.]")
            }
          } else {
            onTranscriptChange("[Error: Speech transcription failed. Please try again.]")
          }
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const getIcon = () => {
    if (isProcessing) {
      return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    }
    if (!apiKey) {
      return <Mic className="h-4 w-4 text-gray-400" />
    }
    if (isRecording) {
      return (
        <div className="relative">
          <Mic className="h-4 w-4 text-red-500 recording-animation" />
          <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>
      )
    }
    return <Mic className="h-4 w-4" />
  }

  const getTooltip = () => {
    if (!apiKey) return "API key required for speech transcription"
    if (isProcessing) return "Processing audio..."
    if (isRecording) return "Recording... Click to stop"
    
    // Show which STT model will be used
    let sttModel = "whisper-large-v3-turbo" // default
    if (selectedModel && selectedModel.includes("whisper")) {
      sttModel = selectedModel
    }
    
    return `Click to start voice recording (using ${sttModel})`
  }

    return (
    <div className="relative">
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-100 animate-ping" />
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap animate-pulse">
            Recording...
          </div>
        </>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleToggleRecording}
              disabled={disabled || isProcessing || !apiKey}
                      className={cn(
          "hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation relative z-10",
          isRecording && "bg-red-100 border-red-300 shadow-lg shadow-red-200/50 mic-recording",
          !apiKey && "opacity-50 cursor-not-allowed hover:scale-100",
          className
        )}
            >
              {getIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
    </div>
  )
}
