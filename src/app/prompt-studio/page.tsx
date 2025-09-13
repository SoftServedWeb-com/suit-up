"use client";

import { useState, useEffect } from "react";
import { Wand2, ArrowLeft, Palette, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/page/header";
import FloatingSubscriptionIndicator from "@/components/subscription-data";
import { toast } from "sonner";
import Link from "next/link";

// Import our new components
import {
  ImageUpload,
  StyleSelector,
  ResultModal,
  HistoryGallery,
  type TransformationPrompt,
  type TransformationRequest,
} from "@/components/prompt-studio";

// Predefined prompts for image transformation
const PREDEFINED_PROMPTS: TransformationPrompt[] = [
  {
    id: "vintage-style",
    name: "Vintage Style",
    description: "Transform into a vintage aesthetic with warm tones and classic styling",
    prompt: "Transform this image into a vintage style with warm sepia tones, soft lighting, and classic aesthetic. Add subtle film grain and enhance the nostalgic atmosphere while maintaining the subject's features and pose.",
    category: "Style",
    icon: "🎞️"
  },
  {
    id: "artistic-portrait",
    name: "Artistic Portrait",
    description: "Convert to an artistic painted portrait style",
    prompt: "Transform this image into an artistic painted portrait with oil painting techniques, soft brushstrokes, and enhanced colors. Maintain realistic proportions while adding artistic flair and depth.",
    category: "Art",
    icon: "🎨"
  },
  {
    id: "professional-headshot",
    name: "Professional Headshot",
    description: "Enhance for professional photography look",
    prompt: "Transform this image into a professional headshot with perfect lighting, enhanced skin tone, professional background, and polished appearance suitable for business profiles.",
    category: "Professional",
    icon: "💼"
  },
  {
    id: "fashion-editorial",
    name: "Fashion Editorial",
    description: "High-fashion magazine style transformation",
    prompt: "Transform this image into a high-fashion editorial style with dramatic lighting, enhanced contrast, professional makeup look, and magazine-quality aesthetic.",
    category: "Fashion",
    icon: "👗"
  },
  {
    id: "cinematic-look",
    name: "Cinematic Look",
    description: "Movie-style cinematic transformation",
    prompt: "Transform this image with cinematic color grading, dramatic lighting, film-like quality, and movie poster aesthetic. Enhance mood and atmosphere while maintaining natural appearance.",
    category: "Cinematic",
    icon: "🎬"
  },
  {
    id: "black-white-classic",
    name: "Classic B&W",
    description: "Elegant black and white transformation",
    prompt: "Transform this image into an elegant black and white photograph with perfect contrast, dramatic shadows, and classic monochrome aesthetic. Enhance texture and depth.",
    category: "Classic",
    icon: "⚫"
  },
  {
    id: "soft-glow",
    name: "Soft Glow",
    description: "Dreamy soft glow effect",
    prompt: "Transform this image with a soft, dreamy glow effect, enhanced skin smoothing, warm lighting, and ethereal atmosphere. Create a romantic, gentle appearance.",
    category: "Beauty",
    icon: "✨"
  },
  {
    id: "urban-street",
    name: "Urban Street",
    description: "Modern urban street photography style",
    prompt: "Transform this image into urban street photography style with enhanced contrast, city vibes, modern aesthetic, and contemporary street fashion look.",
    category: "Urban",
    icon: "🏙️"
  }
];

interface TransformationResponse {
  success: boolean;
  requestId: string;
  status: string;
  resultImageUrl?: string;
  message?: string;
  creditsRemaining?: number;
  provider: string;
}

export default function PromptStudio() {
  // Image and prompt state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results and history
  const [transformationHistory, setTransformationHistory] = useState<TransformationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<TransformationRequest | null>(null);

  // Subscription error state
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Load transformation history on component mount
  useEffect(() => {
    loadTransformationHistory();
  }, []);

  const loadTransformationHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/prompt-transform/history");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.transformations) {
          setTransformationHistory(data.transformations);
        }
      } else {
        console.error("Failed to load transformation history:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (file: File | null, preview: string | null) => {
      setSelectedImage(file);
    setImagePreview(preview);
  };

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
  };

  const getSelectedPromptData = () => {
    if (selectedPrompt === "custom") {
      return {
        id: "custom",
        name: "Custom Prompt",
        description: "User-defined transformation",
        prompt: customPrompt,
        category: "Custom",
        icon: "💭",
        isCustom: true
      };
    }
    return PREDEFINED_PROMPTS.find(p => p.id === selectedPrompt);
  };

  const handleTransform = async () => {
    if (!selectedImage || !selectedPrompt) {
      toast.info("Please upload an image and select a transformation style");
      return;
    }

    if (selectedPrompt === "custom" && !customPrompt.trim()) {
      toast.info("Please enter a custom prompt or select a preset style");
      return;
    }

    setIsSubmitting(true);
    setSubscriptionError(null);

    try {
      const selectedPromptData = getSelectedPromptData();
      if (!selectedPromptData) {
        throw new Error("Invalid prompt selected");
      }

      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("prompt", selectedPromptData.prompt);
      formData.append("promptName", selectedPromptData.name);
      formData.append("promptId", selectedPromptData.id);

      console.log("Submitting transformation request...");

      const response = await fetch("/api/prompt-transform", {
        method: "POST",
        body: formData,
      });

      const data: TransformationResponse = await response.json();

      if (!response.ok) {
        // Handle subscription-related errors
        if (data.message?.includes("credit") || data.message?.includes("subscription")) {
          setSubscriptionError(data.message || "Subscription limit reached");
          return;
        }
        throw new Error(data.message || "Failed to transform image");
      }

      console.log("Transformation completed successfully:", data);

      // Show success message
      toast.success("Image transformation completed!");

      // Create result from API response
      const result: TransformationRequest = {
        id: data.requestId,
        originalImageUrl: imagePreview!,
        resultImageUrl: data.resultImageUrl,
        promptUsed: selectedPromptData.prompt, 
        promptName: selectedPromptData.name,
        status: "COMPLETED",
        processingTime: 15, // Could be added to API response
        creditsUsed: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Reload history to get the latest data from the server
      await loadTransformationHistory();

      // Show result modal
      setCurrentResult(result);
      setShowResultModal(true);

      // Clear form
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedPrompt("");
      setCustomPrompt("");

    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to transform image. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultClick = (transformation: TransformationRequest) => {
    setCurrentResult(transformation);
    setShowResultModal(true);
  };

  const isReadyToTransform = selectedImage && selectedPrompt && !isSubmitting && 
    (selectedPrompt !== "custom" || customPrompt.trim());

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Floating Subscription Indicator */}
      <FloatingSubscriptionIndicator />

      <main className="max-w-6xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-y-0 border-x">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <Wand2 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-serif tracking-tight text-foreground">
                  Prompt Studio
                </h1>
                <p className="text-muted-foreground">
                  Transform your images with AI-powered style prompts
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="transform" className="space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className="glass-card">
              <TabsTrigger
                value="transform"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Palette className="h-4 w-4 mr-2" />
                Transform
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Camera className="h-4 w-4 mr-2" />
                Gallery ({transformationHistory.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transform" className="space-y-8">
            {/* Subscription Error Alert */}
            {subscriptionError && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {subscriptionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Image Upload Component */}
            <ImageUpload
              selectedImage={selectedImage}
              imagePreview={imagePreview}
              onImageSelect={handleImageSelect}
            />

            {/* Style Selection Component */}
            <StyleSelector
              selectedPrompt={selectedPrompt}
              onPromptSelect={handlePromptSelect}
              predefinedPrompts={PREDEFINED_PROMPTS}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
            />

            {/* Transform Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTransform}
                disabled={!isReadyToTransform}
                size="lg"
                className={`
                  relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white
                  px-8 py-3 rounded-xl font-semibold transition-all duration-300
                  ${
                    isReadyToTransform
                      ? "hover:scale-105 hover:shadow-lg"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Transforming...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Transform Image
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryGallery
              transformationHistory={transformationHistory}
              isLoading={isLoading}
              onResultClick={handleResultClick}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={currentResult}
      />
    </div>
  );
}