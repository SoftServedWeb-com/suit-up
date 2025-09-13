"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  User,
  Shirt,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ZoomIn,
  Download,
  Share,
  AlertTriangle,
  TestTube,
  Zap,
  Layers,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageUpload from "@/components/image-upload";
import CategorySelector from "@/components/category-selector";
import Header from "@/components/page/header";
import FloatingSubscriptionIndicator from "@/components/subscription-data";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import FashionQuote from "@/components/fashion-quote";

interface TryOnRequest {
  id: string;
  predictionId: string;
  modelImageUrl: string;
  garmentImageUrl: string;
  category: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  resultImageUrl?: string;
  errorMessage?: string;
  processingTime?: number;
  creditsUsed?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingRequest {
  requestId: string;
  status: string;
  startTime: number;
}

export default function Dashboard() {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [selectedModelImageUrl, setSelectedModelImageUrl] = useState<
    string | null
  >(null);
  const [selectedGarmentImageUrl, setSelectedGarmentImageUrl] = useState<
    string | null
  >(null);
  const [category, setCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Processing states
  const [processingRequests, setProcessingRequests] = useState<
    ProcessingRequest[]
  >([]);
  const [allRequests, setAllRequests] = useState<TryOnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<TryOnRequest | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Subscription error state
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null
  );

  // Load user's try-on history on component mount
  useEffect(() => {
    loadTryOnHistory();
  }, []);

  const loadTryOnHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/try-on/status-history");
      console.log("Get all Status Update :", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Get all Status Update Data :", JSON.stringify(data));
        setAllRequests(data.requests);
      } else {
        console.error("Failed to load history:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert URL to File object for API

  const handleTryOn = async () => {
    const hasModelImage = modelImage || selectedModelImageUrl;
    const hasGarmentImage = garmentImage || selectedGarmentImageUrl;

    if (!hasModelImage || !hasGarmentImage || !category) {
      toast.info("Please upload both images and select a category");
      return;
    }

    setIsSubmitting(true);
    setSubscriptionError(null);

    try {
      const formData = new FormData();

      // Handle model image (file or URL)
      if (modelImage) {
        formData.append("modelImage", modelImage);
      } else if (selectedModelImageUrl) {
        formData.append("previousModelImage", selectedModelImageUrl);
      }

      // Handle garment image (file or URL)
      if (garmentImage) {
        formData.append("garmentImage", garmentImage);
      } else if (selectedGarmentImageUrl) {
        formData.append("previousGarmentImage", selectedGarmentImageUrl);
      }

      formData.append("category", category);

      console.log("Submitting try-on request...");

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle subscription-related errors
        if (data.type === "SUBSCRIPTION_LIMIT") {
          setSubscriptionError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to submit try-on request");
      }

      console.log("Request submitted successfully:", data);

      // Add to processing queue
      const newProcessingRequest: ProcessingRequest = {
        requestId: data.requestId,
        status: "submitted",
        startTime: Date.now(),
      };

      setProcessingRequests((prev) => [...prev, newProcessingRequest]);

      // Start polling for this request
      startPolling(data.requestId);

      // Clear form
      setModelImage(null);
      setGarmentImage(null);
      setSelectedModelImageUrl(null);
      setSelectedGarmentImageUrl(null);
      setCategory("");

      // Reload history to include the new request
      loadTryOnHistory();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit try-on request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (requestId: string) => {
    console.log("Request ID : ", requestId);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/try-on/status?requestId=${requestId}`
        );

        if (response.ok) {
          const data = await response.json();

          console.log("Polling status:", data.status);

          // Update processing request status
          setProcessingRequests((prev) =>
            prev.map((req) =>
              req.requestId === requestId
                ? { ...req, status: data.status }
                : req
            )
          );

          // If completed or failed, stop polling and update results
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            clearInterval(pollInterval);

            // Remove from processing queue
            setProcessingRequests((prev) =>
              prev.filter((req) => req.requestId !== requestId)
            );

            // Reload history to get updated data
            await loadTryOnHistory();

            // Show result modal if completed successfully
            if (data.status === "COMPLETED" && data.resultImageUrl) {
              const completedRequest = await getRequestById(requestId);
              if (completedRequest) {
                setCurrentResult(completedRequest);
                setShowResultModal(true);
              }
            }
          }
        } else {
          console.error("Status check failed:", response.statusText);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 3 minutes (safety measure)
    setTimeout(() => {
      clearInterval(pollInterval);
      setProcessingRequests((prev) =>
        prev.filter((req) => req.requestId !== requestId)
      );
    }, 180000);
  };

  const getRequestById = async (
    requestId: string
  ): Promise<TryOnRequest | null> => {
    try {
      const response = await fetch(`/api/try-on/status?requestId=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        // Find the request in our local state or reconstruct it
        const request = allRequests.find((req) => req.id === requestId);
        if (request && data.resultImageUrl) {
          return {
            ...request,
            status: "COMPLETED",
            resultImageUrl: data.resultImageUrl,
            processingTime: data.processingTime,
          };
        }
      }
    } catch (error) {
      console.error("Error getting request:", error);
    }
    return null;
  };

  const handleDownload = async (imageUrl: string) => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `trialRoomStudio_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Download failed", {
        description: "Failed to download the image. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Virtual Try-On Result",
          text: "Check out how this outfit looks on me!",
          url: imageUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(imageUrl);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
      case "submitted":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "PROCESSING":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const completedRequests = allRequests.filter(
    (req) => req.status === "COMPLETED"
  );
  const hasModelInput = modelImage || selectedModelImageUrl;
  const hasGarmentInput = garmentImage || selectedGarmentImageUrl;
  const isReadyToGenerate =
    hasModelInput && hasGarmentInput && category && !isSubmitting;

  return (
    <div className="min-h-screen  bg-background">
      <Header />

      {/* Floating Subscription Indicator */}
      <FloatingSubscriptionIndicator />

      <main className="max-w-4xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-y-0 border-x">
        <FashionQuote />
        
        {/* Creative Studios Section */}
        <div className="mb-8">
          <h2 className="text-xl font-serif tracking-tight text-foreground mb-4 flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Creative Studios
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Explore AI-powered creative tools for virtual try-on and image transformation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prompt Studio - New Feature */}
            <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-pink-600" />
                      <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                        Prompt Studio
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">
                        NEW
                      </Badge>
                    </div>
                    <p className="text-sm text-pink-700 dark:text-pink-300 mb-4">
                      Transform your images with AI-powered style prompts. Choose from vintage, artistic, professional styles and more.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-pink-600 mb-4">
                      <span className="bg-pink-100 px-2 py-1 rounded">Style Transfer</span>
                      <span className="bg-pink-100 px-2 py-1 rounded">8 Presets</span>
                      <span className="bg-pink-100 px-2 py-1 rounded">Instant</span>
                    </div>
                  </div>
                </div>
                <Link href="/prompt-studio">
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-300 text-pink-700 hover:bg-pink-100 dark:border-pink-600 dark:text-pink-300 dark:hover:bg-pink-900/20"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Try Prompt Studio
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                        Google Gemini AI
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                      Instant image generation with Gemini 2.5 Flash Image Preview. Multi-image input support.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-purple-600 mb-4">
                      <span className="bg-purple-100 px-2 py-1 rounded">Instant Results</span>
                      <span className="bg-purple-100 px-2 py-1 rounded">Multi-Modal</span>
                      <span className="bg-purple-100 px-2 py-1 rounded">Try-On</span>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard-beta">
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Try Gemini Lab
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-orange-600" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                        BytePlus ModelArk
                      </h3>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                      High-resolution 2K image generation with Seedream 4.0. Advanced image-to-image capabilities.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-orange-600 mb-4">
                      <span className="bg-orange-100 px-2 py-1 rounded">2K Resolution</span>
                      <span className="bg-orange-100 px-2 py-1 rounded">Image-to-Image</span>
                      <span className="bg-orange-100 px-2 py-1 rounded">Try-On</span>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard-byteplus">
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Try BytePlus Lab
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </div>
        
        <Tabs defaultValue="try-on" className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="">
              <p className="text-2xl font-serif tracking-tight text-foreground">
                Tailor Board
              </p>
              <span className="opacity-70 text-sm text-muted-foreground">
                Create and manage your styles
              </span>
            </div>
            <TabsList className="glass-card ">
              <TabsTrigger
                value="try-on"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Try-On
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                History ({allRequests.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="try-on" className="space-y-8">
            {/* Subscription Error Alert */}
            {subscriptionError && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {subscriptionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Latest Result Preview (Top Section) */}
            {completedRequests.length > 0 && !processingRequests.length && (
              <Card className="border-ring bg-background">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-accent-foreground font-medium text-lg tracking-tight ">
                        Recent Trial
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        Click image to view full size
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-200/50 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-700">Ready</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center  ">
                    {/* Main Result - Hero Section */}
                    <div className="lg:col-span-3 text-center">
                      <div
                        className="cursor-pointer inline-block group"
                        onClick={() => {
                          setCurrentResult(completedRequests[0]);
                          setShowResultModal(true);
                        }}
                      >
                        <div className="relative">
                          <Image
                            width={1080}
                            height={1080}
                            src={completedRequests[0].resultImageUrl!}
                            alt="Virtual try-on result"
                            className="w-full max-w-xs mx-auto rounded-lg border border-border group-hover:border-primary transition-all duration-200 shadow-sm group-hover:shadow-md"
                          />
                          {/* Subtle zoom hint */}
                          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ZoomIn className="h-3 w-3 text-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Side Panel - Inputs & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Virtual Trial */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">
                          Virtual Trial Room
                        </h3>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <Image
                              width={1080}
                              height={1080}
                              src={completedRequests[0].modelImageUrl}
                              alt="Original"
                              className="w-22 h-22 object-cover rounded-md border border-border"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              You
                            </p>
                          </div>

                          <div className="flex-1 h-px bg-border"></div>
                          <div className="text-muted-foreground">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 h-px bg-border"></div>

                          <div className="text-center">
                            <Image
                              width={1080}
                              height={1080}
                              src={completedRequests[0].garmentImageUrl}
                              alt="Garment"
                              className="w-22 h-22 object-cover rounded-md border border-border"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Garment
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="space-y-2">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {completedRequests[0].processingTime && (
                            <div className="flex justify-between">
                              <span>Processing time</span>
                              <span>
                                {completedRequests[0].processingTime}s
                              </span>
                            </div>
                          )}
                          {completedRequests[0].creditsUsed && (
                            <div className="flex justify-between">
                              <span>Credits used</span>
                              <span>{completedRequests[0].creditsUsed}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="space-y-3">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            handleDownload(completedRequests[0].resultImageUrl!)
                          }
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Result
                            </>
                          )}
                        </Button>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              handleShare(completedRequests[0].resultImageUrl!)
                            }
                          >
                            <Share className="h-4 w-4 mr-1" />
                            Share
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setCurrentResult(completedRequests[0]);
                              setShowResultModal(true);
                            }}
                          >
                            <ZoomIn className="h-4 w-4 mr-1" />
                            Enlarge
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Processing Queue */}
            {processingRequests.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    Processing Requests
                  </CardTitle>
                  <CardDescription>
                    Your fit is being tailored. This usually
                    takes 20-40 seconds.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {processingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="flex items-center justify-between p-3 bg-primary/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(req.status)}
                          <span className="font-medium">
                            {req.status === "submitted"
                              ? "Tailoring your fit..."
                              : req.status === "PENDING"
                              ? "Waiting for the fit..."
                              : req.status === "PROCESSING"
                              ? "Find the fit..."
                              : req.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor((Date.now() - req.startTime) / 1000)}s
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageUpload
                title="Model Photo"
                description="Upload a clear photo of the person who will try on the clothes"
                file={modelImage}
                onUpload={(file) => {
                  setModelImage(file);
                  setSelectedModelImageUrl(null);
                }}
                onRemove={() => {
                  setModelImage(null);
                  setSelectedModelImageUrl(null);
                }}
                onSelectPrevious={(imageUrl) => {
                  setSelectedModelImageUrl(imageUrl);
                  setModelImage(null);
                }}
                type="model"
                icon={<User className="h-5 w-5 text-primary" />}
              />
              <ImageUpload
                title="Garment Photo"
                description="Upload a photo of the clothing item to virtually try on"
                file={garmentImage}
                onUpload={(file) => {
                  setGarmentImage(file);
                  setSelectedGarmentImageUrl(null);
                }}
                onRemove={() => {
                  setGarmentImage(null);
                  setSelectedGarmentImageUrl(null);
                }}
                onSelectPrevious={(imageUrl) => {
                  setSelectedGarmentImageUrl(imageUrl);
                  setGarmentImage(null);
                }}
                type="garment"
                icon={<Shirt className="h-5 w-5 text-primary" />}
              />
            </div>

            {/* Category Selection */}
            <div className="w-full">
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
                  ${
                    isReadyToGenerate
                      ? "hover:scale-105 hover:shadow-lg"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Try-On
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">
                      Try-On History
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      View and manage your virtual try-on sessions
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {allRequests.length} sessions
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                    <p className="text-muted-foreground">
                      Loading your sessions...
                    </p>
                  </div>
                ) : allRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No sessions yet
                    </h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      Create your first virtual try-on to see your results here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (
                            request.status === "COMPLETED" &&
                            request.resultImageUrl
                          ) {
                            setCurrentResult(request);
                            setShowResultModal(true);
                          }
                        }}
                      >
                        {/* Mobile Layout */}
                        <div className="block md:hidden space-y-3">
                          {/* Header Row */}
                          <div className="flex items-center justify-between">
                            <Badge
                              className={getStatusColor(request.status)}
                              variant="outline"
                            >
                              {request.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          {/* Images Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={request.modelImageUrl}
                                alt="You"
                                className="w-12 h-12 object-cover rounded border border-border"
                              />
                              <span className="text-muted-foreground">+</span>
                              <img
                                src={request.garmentImageUrl}
                                alt="Item"
                                className="w-12 h-12 object-cover rounded border border-border"
                              />
                            </div>

                            {request.status === "COMPLETED" &&
                            request.resultImageUrl ? (
                              <div className="relative">
                                <img
                                  src={request.resultImageUrl}
                                  alt="Result"
                                  className="w-16 h-16 object-cover rounded-lg border border-border"
                                />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                {getStatusIcon(request.status)}
                              </div>
                            )}
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-3">
                              {request.processingTime && (
                                <span>{request.processingTime}s</span>
                              )}
                              {request.creditsUsed && (
                                <span>{request.creditsUsed} credits</span>
                              )}
                            </div>
                            {request.status === "COMPLETED" &&
                              request.resultImageUrl && (
                                <ZoomIn className="h-4 w-4 group-hover:text-primary transition-colors" />
                              )}
                          </div>

                          {request.errorMessage && (
                            <p className="text-sm text-destructive">
                              {request.errorMessage}
                            </p>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-center gap-4">
                          {/* Status & Result Preview */}
                          <div className="flex-shrink-0">
                            {request.status === "COMPLETED" &&
                            request.resultImageUrl ? (
                              <div className="relative">
                                <img
                                  src={request.resultImageUrl}
                                  alt="Result"
                                  className="w-16 h-16 object-cover rounded-lg border border-border"
                                />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                {getStatusIcon(request.status)}
                              </div>
                            )}
                          </div>

                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={getStatusColor(request.status)}
                                variant="outline"
                              >
                                {request.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {request.processingTime && (
                                <span>{request.processingTime}s</span>
                              )}
                              {request.creditsUsed && (
                                <span>{request.creditsUsed} credits</span>
                              )}
                            </div>

                            {request.errorMessage && (
                              <p className="text-sm text-destructive mt-1 truncate">
                                {request.errorMessage}
                              </p>
                            )}
                          </div>

                          {/* Input Images Preview */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <img
                                src={request.modelImageUrl}
                                alt="You"
                                className="w-8 h-8 object-cover rounded border border-border"
                              />
                              <span className="text-muted-foreground text-xs">
                                +
                              </span>
                              <img
                                src={request.garmentImageUrl}
                                alt="Item"
                                className="w-8 h-8 object-cover rounded border border-border"
                              />
                            </div>
                          </div>

                          {/* Action Indicator */}
                          <div className="flex-shrink-0">
                            {request.status === "COMPLETED" &&
                            request.resultImageUrl ? (
                              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                <ZoomIn className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="w-4 h-4"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-medium font-serif text-primary">
              Trial Room
            </DialogTitle>
          </DialogHeader>
          {currentResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Original Images */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Original Model</h4>
                    <img
                      src={currentResult.modelImageUrl}
                      alt="Original model"
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Garment</h4>
                    <img
                      src={currentResult.garmentImageUrl}
                      alt="Garment"
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  </div>
                </div>

                {/* Result */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Final Result</h4>
                  <img
                    src={currentResult.resultImageUrl}
                    alt="Try-on result"
                    className="w-full max-h-[60vh] object-contain rounded-lg border mx-auto"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => handleDownload(currentResult.resultImageUrl!)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare(currentResult.resultImageUrl!)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Category: {currentResult.category}</p>
                {currentResult.processingTime && (
                  <p>Processing time: {currentResult.processingTime} seconds</p>
                )}
                {currentResult.creditsUsed && (
                  <p>Credits used: {currentResult.creditsUsed}</p>
                )}
                <p>
                  Created: {new Date(currentResult.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
