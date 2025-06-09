import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const modelImageFile = formData.get("modelImage") as File
    const garmentImageFile = formData.get("garmentImage") as File
    const category = formData.get("category") as string

    console.log("TRY ON :: Processing request")

    if (!modelImageFile || !garmentImageFile || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload images to Vercel Blob
    const modelImageBlob = await put(`model-${Date.now()}-${modelImageFile.name}`, modelImageFile, { 
      access: "public",
      addRandomSuffix: true, 
    })

    const garmentImageBlob = await put(`garment-${Date.now()}-${garmentImageFile.name}`, garmentImageFile, {
      access: "public",
      addRandomSuffix: true
    })

    console.log("Images uploaded:", { modelImageBlob: modelImageBlob.url, garmentImageBlob: garmentImageBlob.url })

    // Call Fashn.ai API with correct parameters
    const fashnResponse = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      body: JSON.stringify({
        model_image: modelImageBlob.url,
        garment_image: garmentImageBlob.url,
        category: category === "outerwear" ? "tops" : category, // Map outerwear to tops
        return_base64: true, // This prevents CORS issues with CDN URLs
        output_format: "jpeg" // Faster loading than PNG
      }),
      headers: {
        Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!fashnResponse.ok) {
      const errorText = await fashnResponse.text()
      console.error("Fashn.ai API error:", fashnResponse.status, errorText)
      throw new Error(`Fashn.ai API error: ${fashnResponse.status} ${errorText}`)
    }

    const fashnData = await fashnResponse.json()
    console.log("Initial Fashn response:", fashnData)

    // The API is asynchronous - we need to poll for completion
    const predictionId = fashnData.id
    if (!predictionId) {
      throw new Error("No prediction ID returned from Fashn.ai API")
    }

    // Poll for completion
    let pollAttempts = 0
    const maxPollAttempts = 30 // 3 minutes max (6 seconds per attempt)
    let resultData = null

    while (pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 6000)) // Wait 6 seconds
      pollAttempts++

      console.log(`Polling attempt ${pollAttempts}/${maxPollAttempts}`)

      const statusResponse = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
        },
      })

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status)
        continue
      }

      const statusData = await statusResponse.json()
      console.log("Status check:", statusData.status)

      if (statusData.status === "completed") {
        resultData = statusData
        break
      } else if (statusData.status === "failed") {
        throw new Error("Fashn.ai processing failed")
      }
      // Continue polling if status is "starting", "in_queue", or "processing"
    }

    if (!resultData) {
      throw new Error("Fashn.ai processing timed out")
    }

    console.log("Final result data:", resultData)

    // Extract the result image correctly from the nested structure
    let resultImageUrl = null

    if (resultData.output && resultData.output.images && resultData.output.images.length > 0) {
      const imageData = resultData.output.images[0]
      
      if (imageData.base64) {
        // Use base64 data (recommended - no CORS issues)
        resultImageUrl = `data:image/jpeg;base64,${imageData.base64}`
      } else if (imageData.url) {
        // Fallback to CDN URL
        resultImageUrl = imageData.url
      }
    }

    if (!resultImageUrl) {
      console.error("No result image found in response:", resultData)
      throw new Error("No result image returned from Fashn.ai API")
    }

    return NextResponse.json({
      success: true,
      resultImage: resultImageUrl,
      modelImage: modelImageBlob.url,
      garmentImage: garmentImageBlob.url,
      processingTime: `${pollAttempts * 6} seconds`
    })

  } catch (error) {
    console.error("Try-on API error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to process try-on request" 
    }, { status: 500 })
  }
}