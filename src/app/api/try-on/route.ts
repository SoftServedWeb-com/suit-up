import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const modelImageFile = formData.get("modelImage") as File
    const garmentImageFile = formData.get("garmentImage") as File
    const category = formData.get("category") as string

    if (!modelImageFile || !garmentImageFile || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload images to Vercel Blob
    const modelImageBlob = await put(`model-${Date.now()}-${modelImageFile.name}`, modelImageFile, { access: "public" })

    const garmentImageBlob = await put(`garment-${Date.now()}-${garmentImageFile.name}`, garmentImageFile, {
      access: "public",
    })

    // Call Fashn.ai API
    const fashnResponse = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      body: JSON.stringify({
        model_image: modelImageBlob.url,
        garment_image: garmentImageBlob.url,
        category: category,
      }),
      headers: {
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!fashnResponse.ok) {
      throw new Error(`Fashn.ai API error: ${fashnResponse.statusText}`)
    }

    const fashnData = await fashnResponse.json()

    // The API response structure may vary - adjust based on actual response
    const resultImageUrl = fashnData.output_url || fashnData.result_image || fashnData.image_url

    return NextResponse.json({
      success: true,
      resultImage: resultImageUrl,
      modelImage: modelImageBlob.url,
      garmentImage: garmentImageBlob.url,
    })
  } catch (error) {
    console.error("Try-on API error:", error)
    return NextResponse.json({ error: "Failed to process try-on request" }, { status: 500 })
  }
}
