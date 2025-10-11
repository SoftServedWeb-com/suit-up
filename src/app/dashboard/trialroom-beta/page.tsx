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
  Zap,
  ArrowLeft,
  TestTube,
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
import ImprovedImageUpload from "@/components/image-upload";

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

interface BetaResponse {
  success: boolean;
  requestId: string;
  predictionId: string;
  status: string;
  resultImageUrl?: string;
  message: string;
  creditsRemaining: number;
  provider: string;
  textResponse?: string;
  type?: string;
  error?: string;
  details?: string;
}

export default function DashboardBeta() {
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
  const [garmentAnalysis, setGarmentAnalysis] = useState<
    { description: string; haveFace: boolean, wasCropped: boolean} | null
  >(null);

  // Beta-specific states
  const [betaResults, setBetaResults] = useState<BetaResponse[]>([]);
  const [allRequests, setAllRequests] = useState<TryOnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<TryOnRequest | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Subscription error state
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    const handleGarmentAnalyzed = (event: CustomEvent) => {
      setGarmentAnalysis({
        description: event.detail.description || "Garment processed",
        haveFace: event.detail.haveFace,
        wasCropped: event.detail.wasCropped
      });
    };
  
    window.addEventListener('garmentAnalyzed', handleGarmentAnalyzed as any);
    return () => {
      window.removeEventListener('garmentAnalyzed', handleGarmentAnalyzed as any);
    };
  }, []);
  // Load user's try-on history on component mount (filter for beta/gemini requests)
  useEffect(() => {
    loadTryOnHistory();
  }, []);

  // Listen for garment analysis events
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) setGarmentAnalysis(e.detail);
    };
    window.addEventListener("garmentAnalyzed", handler as EventListener);
    return () => window.removeEventListener("garmentAnalyzed", handler as EventListener);
  }, []);

  const loadTryOnHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/try-on/status-history");
      console.log("Get all Status Update :", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Get all Status Update Data :", JSON.stringify(data));
        
        // Filter for beta requests only
        const filteredRequests = data.requests.filter((request: TryOnRequest) => 
          request.category.toLowerCase().startsWith("beta:")
        );
        
        setAllRequests(filteredRequests);
      } else {
        console.error("Failed to load history:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBetaTryOn = async () => {
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

      console.log("Submitting beta try-on request...");

      const response = await fetch("/api/try-on-beta", {
        method: "POST",
        body: formData,
      });

      const data: BetaResponse = await response.json();

      if (!response.ok) {
        // Handle subscription-related errors
        if (data.type === "SUBSCRIPTION_LIMIT") {
          setSubscriptionError(data.error || "Subscription limit reached");
          return;
        }

        // Handle rate limiting errors
        if (data.type === "RATE_LIMIT" || data.type === "QUOTA_EXCEEDED") {
          const errorMessage = data.error || "Rate limit exceeded";
          const details = data.details ? `\n\n${data.details}` : "";
          toast.error("Rate Limit Exceeded", {
            description: errorMessage + details,
            duration: 8000,
          });
          return;
        }

        // Handle authentication errors
        if (data.type === "AUTH_ERROR") {
          toast.error("Configuration Error", {
            description: data.error || "Invalid key configuration",
            duration: 6000,
          });
          return;
        }

        // Handle safety filter blocks
        if (data.type === "SAFETY_FILTER") {
          toast.error("Content Blocked", {
            description: data.error || "Content was blocked by safety filters",
            duration: 8000,
          });
          return;
        }

        throw new Error(data.error || "Failed to submit beta try-on request");
      }

      console.log("Beta request completed successfully:", data);

      // Add to beta results
      setBetaResults((prev) => [data, ...prev]);

      // Show success toast with provider info
      toast.success("Virtual Try-On Complete! 🎉", {
        description: `Generated using Beta AI. Credits remaining: ${data.creditsRemaining}`,
      });

      // If we have a result image, show the result modal
      if (data.resultImageUrl) {
        const mockRequest: TryOnRequest = {
          id: data.requestId,
          predictionId: data.predictionId,
          modelImageUrl:
            selectedModelImageUrl || URL.createObjectURL(modelImage!),
          garmentImageUrl:
            selectedGarmentImageUrl || URL.createObjectURL(garmentImage!),
          category,
          status: "COMPLETED",
          resultImageUrl: data.resultImageUrl,
          creditsUsed: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentResult(mockRequest);
        setShowResultModal(true);
      }

      // Clear form
      setModelImage(null);
      setGarmentImage(null);
      setSelectedModelImageUrl(null);
      setSelectedGarmentImageUrl(null);
      setCategory("");

      // Reload history to include the new request
      loadTryOnHistory();
    } catch (error) {
      console.error("Beta try-on error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process beta try-on request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
      link.download = `trialRoomStudio_beta_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download complete! 📥");
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
          title: "My Virtual Try-On Result (Beta)",
          text: "Check out how this outfit looks on me! Generated with Beta AI.",
          url: imageUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(imageUrl);
        toast.success("Link copied to clipboard! 📋");
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard! 📋");
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
    <div className="min-h-screen bg-background">

      <main className="max-w-4xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-y-0 border-x">
        {/* Beta Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard/trialroom">  
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main Dashboard
              </Button>
            </Link>
          </div>

        </div>

        <FashionQuote />

        <Tabs defaultValue="try-on" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-serif tracking-tight text-foreground">
                Tailor Board
                {" "}
                <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
              <Zap className="h-3 w-3 mr-1" />
              Beta
            </Badge>
              </p>
              <span className="opacity-70 text-sm text-muted-foreground">
                More Advanced Trialroom
              </span>
            </div>
            <TabsList className="glass-card">
              <TabsTrigger
                value="try-on"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Beta Try-On
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Beta History ({allRequests.length})
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

            {/* Latest Beta Result Preview */}
            {completedRequests.length > 0 && (
              <Card className="border-ring bg-background">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-accent-foreground font-medium text-lg tracking-tight flex items-center gap-2">
                        Latest Trial Result
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        Generated instantly with our new beta lab
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-200/50 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-700">Ready</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                    {/* Main Result - Hero Section */}
                    <div className="lg:col-span-3 text-center">
                      <div
                        className="cursor-pointer inline-block group"
                        onClick={() => {
                          setCurrentResult(completedRequests[0]);
                          setShowResultModal(true);
                        }}>
                        <div className="relative">
                          <Image
                            width={1080}
                            height={1080}
                            src={completedRequests[0].resultImageUrl!}
                            alt="Trial Room Studio result"
                            className="w-full max-w-xs mx-auto rounded-lg border border-border group-hover:border-primary transition-all duration-200 shadow-sm group-hover:shadow-md"
                          />
                          {/* AI Badge Overlay */}
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Beta
                          </div>
                          {/* Zoom hint */}
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
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          Beta Trial Room
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
                            <Zap className="w-4 h-4" />
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
                          <div className="flex justify-between">
                            <span>Provider</span>
                            <span className="text-purple-600 font-medium">
                              Beta AI
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing</span>
                            <span className="text-green-600 font-medium">
                              Instant
                            </span>
                          </div>
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
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          onClick={() =>
                            handleDownload(completedRequests[0].resultImageUrl!)
                          }
                          disabled={isDownloading}>
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Beta Result
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
                            }>
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
                            }}>
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

            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImprovedImageUpload
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
              <ImprovedImageUpload
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
                  setGarmentAnalysis(null);
                }}
                onSelectPrevious={(imageUrl) => {
                  setSelectedGarmentImageUrl(imageUrl);
                  setGarmentImage(null);
                }}
                type="garment"
                icon={<Shirt className="h-5 w-5 text-primary" />}
              />
              {garmentAnalysis && (
                <div className="lg:col-span-2 -mt-4 text-sm text-muted-foreground">
                  <div className="p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span>Garment analysis</span>
                      <span className={
                        garmentAnalysis.haveFace
                          ? "text-red-600"
                          : "text-green-600"
                      }>
                        {garmentAnalysis.haveFace ? "Face detected" : "No face detected"}
                      </span>
                    </div>
                    <div className="mt-1 text-foreground">{garmentAnalysis.description}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Selection */}
            <div className="w-full">
              <CategorySelector value={category} onChange={setCategory} />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleBetaTryOn}
                disabled={!isReadyToGenerate}
                size="lg"
                className={`
                  relative overflow-hidden text-white
                  px-8 py-3 rounded-xl font-semibold transition-all duration-300
                  ${
                    isReadyToGenerate
                      ? "hover:scale-105 hover:shadow-lg"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating with Beta AI...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Generate Beta Try-On
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
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Beta Try-On History
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      View your virtual try-on sessions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {allRequests.length} beta sessions
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-sm bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Beta
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                    <p className="text-muted-foreground">
                      Loading your beta sessions...
                    </p>
                  </div>
                ) : allRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center mb-4">
                      <TestTube className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No beta sessions yet
                    </h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      Try your first beta virtual try-on to see
                      results here
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
                        }}>
                        {/* Mobile Layout */}
                        <div className="block md:hidden space-y-3">
                          {/* Header Row */}
                          <div className="flex items-center justify-between">
                            <Badge
                              className={getStatusColor(request.status)}
                              variant="outline">
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
                                variant="outline">
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
              <TestTube className="h-5 w-5" />
              Beta Trial Room - Beta
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
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">Trial Room Result</h4>
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Beta
                    </Badge>
                  </div>
                  <div className="relative">
                    <img
                      src={currentResult.resultImageUrl}
                      alt="Beta try-on result"
                      className="w-full max-h-[60vh] object-contain rounded-lg border mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => handleDownload(currentResult.resultImageUrl!)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare(currentResult.resultImageUrl!)}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                {/* Show category without beta prefix */}
                <p>Category: {currentResult.category.replace(/^beta:/, '')}</p>
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
