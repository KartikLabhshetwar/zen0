"use client"

import { useState, useRef } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface SpeechInputProps {
  onTranscriptChange: (transcript: string) => void
  className?: string
  disabled?: boolean
}

export function SpeechInput({ onTranscriptChange, className, disabled }: SpeechInputProps) {
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
          const formData = new FormData()
          formData.append("file", audioBlob, "recording.wav")
          formData.append("model", "whisper-large-v3")
          formData.append("response_format", "text")
          // Language and prompt are set on the server side to force English

          const response = await fetch("/api/groq/audio/transcribe", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.statusText}`)
          }

          const transcript = await response.text()
          onTranscriptChange(transcript)
        } catch (error) {
          console.error("Transcription error:", error)
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
    return isRecording ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />
  }

  const getTooltip = () => {
    if (isProcessing) return "Processing audio..."
    if (isRecording) return "Recording... Click to stop"
    return "Click to start voice recording"
  }

  return (
    <div className="relative">
              {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap">
              Recording...
            </div>
          </>
        )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggleRecording}
        disabled={disabled || isProcessing}
        className={cn(
          "hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation relative z-10",
          isRecording && "bg-red-50 border-red-200",
          className
        )}
        title={getTooltip()}
      >
        {getIcon()}
      </Button>
    </div>
  )
}
