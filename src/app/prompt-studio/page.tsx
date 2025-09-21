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
import { PREDEFINED_PROMPTS } from "@/lib/prompt";

// Predefined prompts for image transformation


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

  // Reference image state for prompts that require it
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

  // Results and history
  const [transformationHistory, setTransformationHistory] = useState<TransformationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<TransformationRequest | null>(null);

  // Subscription error state
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Trigger for refreshing image upload history
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

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
    // Clear reference image when switching prompts
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  const handleReferenceImageSelect = (file: File | null, preview: string | null) => {
    setReferenceImage(file);
    setReferenceImagePreview(preview);
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

    const selectedPromptData = getSelectedPromptData();
    if (selectedPromptData?.requiresReferenceImage && !referenceImage) {
      toast.info("Please upload a reference image for this transformation style");
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
      
      // Add reference image if required and available
      if (selectedPromptData.requiresReferenceImage && referenceImage) {
        formData.append("referenceImage", referenceImage);
      }

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
      
      // Trigger refresh of image upload history
      setRefreshTrigger(prev => prev + 1);

      // Show result modal
      setCurrentResult(result);
      setShowResultModal(true);

      // Clear form
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedPrompt("");
      setCustomPrompt("");
      setReferenceImage(null);
      setReferenceImagePreview(null);

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
    (selectedPrompt !== "custom" || customPrompt.trim()) &&
    (!getSelectedPromptData()?.requiresReferenceImage || referenceImage);

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
              refreshTrigger={refreshTrigger}
            />

            {/* Style Selection Component */}
            <StyleSelector
              selectedPrompt={selectedPrompt}
              onPromptSelect={handlePromptSelect}
              predefinedPrompts={PREDEFINED_PROMPTS}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              referenceImage={referenceImage}
              referenceImagePreview={referenceImagePreview}
              onReferenceImageSelect={handleReferenceImageSelect}
            />

            {/* Transform Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTransform}
                disabled={!isReadyToTransform}
                size="lg"
                className={`
                  relative overflow-hidden text-white
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