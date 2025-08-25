import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const model = formData.get("model") as string || "whisper-large-v3"
    const language = formData.get("language") as string
    const prompt = formData.get("prompt") as string
    const responseFormat = formData.get("response_format") as string || "text"
    const temperature = formData.get("temperature") as string || "0"

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Get API key from environment or request headers
    const apiKey = process.env.GROQ_API_KEY || req.headers.get("Authorization")?.replace("Bearer ", "")

    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided" }, { status: 401 })
    }

    // Create form data for Groq API
    const groqFormData = new FormData()
    groqFormData.append("file", file)
    groqFormData.append("model", model)
    
    // Force English language and add prompt to ensure English transcription
    groqFormData.append("language", "en")
    groqFormData.append("prompt", "This is an English conversation. Please transcribe in English only.")
    if (responseFormat) groqFormData.append("response_format", responseFormat)
    if (temperature) groqFormData.append("temperature", temperature)

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API error:", response.status, errorText)
      return NextResponse.json(
        { error: `Groq API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    // For text format, Groq returns the text directly, not JSON
    if (responseFormat === "text") {
      const text = await response.text()
      return new Response(text, {
        headers: { "Content-Type": "text/plain" }
      })
    }

    // For other formats, parse as JSON
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Audio transcription error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
