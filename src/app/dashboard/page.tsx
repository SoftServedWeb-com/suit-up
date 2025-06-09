"use client";

import { useState } from "react";
import { Sparkles, User, Shirt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/page/header";
import ImageUpload from "@/components/image-upload";
import CategorySelector from "@/components/category-selector";
import TryOnResult from "@/components/try-on-selector";
import HistoryGrid from "@/components/history-stack";

interface TryOnResult {
  id: string;
  modelImage: string;
  garmentImage: string;
  resultImage: string;
  category: string;
  createdAt: string;
}

export default function Dashboard() {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<TryOnResult[]>([]);

  const handleTryOn = async () => {
    if (!modelImage || !garmentImage || !category) {
      alert("Please upload both images and select a category");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("modelImage", modelImage);
      formData.append("garmentImage", garmentImage);
      formData.append("category", category);

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process try-on");
      }

      const data = await response.json();
      setResult(data.resultImage);

      // Add to history
      const newResult: TryOnResult = {
        id: Date.now().toString(),
        modelImage: URL.createObjectURL(modelImage),
        garmentImage: URL.createObjectURL(garmentImage),
        resultImage: data.resultImage,
        category,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [newResult, ...prev]);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process try-on. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const isReadyToGenerate = modelImage && garmentImage && category && !isProcessing;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="try-on" className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Virtual Try-On Studio</h2>
              <p className="text-muted-foreground">
                Create stunning virtual try-ons with AI-powered technology
              </p>
            </div>
            <TabsList className="glass-card">
              <TabsTrigger value="try-on" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Try-On
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="try-on" className="space-y-8">
            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageUpload
                title="Model Photo"
                description="Upload a clear photo of the person who will try on the clothes"
                file={modelImage}
                onUpload={setModelImage}
                onRemove={() => setModelImage(null)}
                type="model"
                icon={<User className="h-5 w-5 text-primary" />}
              />
              <ImageUpload
                title="Garment Photo"
                description="Upload a photo of the clothing item to virtually try on"
                file={garmentImage}
                onUpload={setGarmentImage}
                onRemove={() => setGarmentImage(null)}
                type="garment"
                icon={<Shirt className="h-5 w-5 text-primary" />}
              />
            </div>

            {/* Category Selection */}
            <div className="max-w-xl">
              <CategorySelector value={category} onChange={setCategory} />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTryOn}
                disabled={!isReadyToGenerate}
                size="lg"
                className={`
                  relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground
                  px-8 py-3 rounded-xl font-semibold transition-all duration-300
                  ${isReadyToGenerate ? 'hover:scale-105 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Try-On
                  </>
                )}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className="max-w-2xl mx-auto">
                <TryOnResult
                  resultImage={result}
                  modelImage={modelImage ? URL.createObjectURL(modelImage) : undefined}
                  garmentImage={garmentImage ? URL.createObjectURL(garmentImage) : undefined}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <HistoryGrid history={history} onDelete={handleDeleteHistory} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}