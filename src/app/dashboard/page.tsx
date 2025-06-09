"use client"

import { useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { Upload, Sparkles, Download, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface TryOnResult {
  id: string
  modelImage: string
  garmentImage: string
  resultImage: string
  category: string
  createdAt: string
}

export default function Dashboard() {
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [category, setCategory] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [history, setHistory] = useState<TryOnResult[]>([])

  const handleImageUpload = (file: File, type: "model" | "garment") => {
    if (type === "model") {
      setModelImage(file)
    } else {
      setGarmentImage(file)
    }
  }

  const handleTryOn = async () => {
    if (!modelImage || !garmentImage || !category) {
      alert("Please upload both images and select a category")
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("modelImage", modelImage)
      formData.append("garmentImage", garmentImage)
      formData.append("category", category)

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process try-on")
      }

      const data = await response.json()
      setResult(data.resultImage)

      // Add to history
      const newResult: TryOnResult = {
        id: Date.now().toString(),
        modelImage: URL.createObjectURL(modelImage),
        garmentImage: URL.createObjectURL(garmentImage),
        resultImage: data.resultImage,
        category,
        createdAt: new Date().toISOString(),
      }
      setHistory((prev) => [newResult, ...prev])
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to process try-on. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const ImageUploadCard = ({
    title,
    description,
    file,
    onUpload,
    type,
  }: {
    title: string
    description: string
    file: File | null
    onUpload: (file: File) => void
    type: "model" | "garment"
  }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
          {file ? (
            <div className="space-y-4">
              <img
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-cover"
              />
              <p className="text-sm text-gray-600">{file.name}</p>
              <Button variant="outline" onClick={() => document.getElementById(`${type}-upload`)?.click()}>
                Change Image
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <Button variant="outline" onClick={() => document.getElementById(`${type}-upload`)?.click()}>
                  Upload Image
                </Button>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
              </div>
            </div>
          )}
          <input
            id={`${type}-upload`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Fashion Try-On</h1>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="try-on" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="try-on">Try-On</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="try-on" className="space-y-6">
            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadCard
                title="Model Image"
                description="Upload a photo of the person who will try on the clothes"
                file={modelImage}
                onUpload={(file) => handleImageUpload(file, "model")}
                type="model"
              />
              <ImageUploadCard
                title="Garment Image"
                description="Upload a photo of the clothing item to try on"
                file={garmentImage}
                onUpload={(file) => handleImageUpload(file, "garment")}
                type="garment"
              />
            </div>

            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Clothing Category</CardTitle>
                <CardDescription>Select the type of clothing item</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tops">Tops</SelectItem>
                    <SelectItem value="bottoms">Bottoms</SelectItem>
                    <SelectItem value="dresses">Dresses</SelectItem>
                    <SelectItem value="outerwear">Outerwear</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Try-On Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTryOn}
                disabled={!modelImage || !garmentImage || !category || isProcessing}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Try-On
                  </>
                )}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Try-On Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={result || "/placeholder.svg"}
                        alt="Try-on result"
                        className="max-h-96 rounded-lg shadow-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = result
                          link.download = "try-on-result.jpg"
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Try-On History
                </CardTitle>
                <CardDescription>Your previous try-on sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No try-on history yet. Start by creating your first try-on!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <Badge variant="secondary">{item.category}</Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <img
                              src={item.resultImage || "/placeholder.svg"}
                              alt="Try-on result"
                              className="w-full h-48 object-cover rounded-md"
                            />
                            <div className="flex gap-2">
                              <img
                                src={item.modelImage || "/placeholder.svg"}
                                alt="Model"
                                className="w-12 h-12 object-cover rounded border"
                              />
                              <img
                                src={item.garmentImage || "/placeholder.svg"}
                                alt="Garment"
                                className="w-12 h-12 object-cover rounded border"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
