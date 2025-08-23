import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return new Response("No image provided", { status: 400 })
    }

    const { createWorker } = await import("tesseract.js")

    const worker = await createWorker("eng")

    try {
      // Convert base64 image to buffer for processing
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
      const imageBuffer = Buffer.from(base64Data, "base64")

      // Perform OCR on the image
      const {
        data: { text },
      } = await worker.recognize(imageBuffer)

      await worker.terminate()

      return Response.json({
        text: text.trim(),
        success: true,
      })
    } catch (ocrError) {
      await worker.terminate()
      throw ocrError
    }
  } catch (error) {
    console.error("OCR API error:", error)
    return new Response("OCR processing failed", { status: 500 })
  }
}
