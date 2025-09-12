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
  Layers,
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

interface BytePlusResponse {
  success: boolean;
  requestId: string;
  predictionId: string;
  status: string;
  resultImageUrl?: string;
  message: string;
  creditsRemaining: number;
  provider: string;
  model?: string;
  type?: string;
  error?: string;
  details?: string;
}

export default function DashboardBytePlus() {
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

  // BytePlus-specific states
  const [byteplusResults, setByteplusResults] = useState<BytePlusResponse[]>([]);
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

  // Load user's try-on history on component mount (filter for byteplus requests)
  useEffect(() => {
    loadTryOnHistory();
  }, []);

  const loadTryOnHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/try-on/status-history");
      
      if (response.ok) {
        const data = await response.json();
        // Filter for BytePlus requests (those with predictionId starting with 'byteplus-')
        const byteplusRequests = data.requests.filter((req: TryOnRequest) => 
          req.predictionId.startsWith('byteplus-')
        );
        setAllRequests(byteplusRequests);
      } else {
        console.error("Failed to load history:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBytePlusTryOn = async () => {
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

      console.log("Submitting BytePlus try-on request...");

      const response = await fetch("/api/try-on-byteplus", {
        method: "POST",
        body: formData,
      });

      const data: BytePlusResponse = await response.json();

      if (!response.ok) {
        // Handle subscription-related errors
        if (data.type === "SUBSCRIPTION_LIMIT") {
          setSubscriptionError(data.error || "Subscription limit reached");
          return;
        }
        
        // Handle rate limiting errors
        if (data.type === "RATE_LIMIT") {
          const errorMessage = data.error || "API rate limit exceeded";
          const details = data.details ? `\n\n${data.details}` : "";
          toast.error("Rate Limit Exceeded", {
            description: errorMessage + details,
            duration: 8000,
          });
          return;
        }
        
        // Handle authentication errors
        if (data.type === "AUTH_ERROR") {
          toast.error("API Configuration Error", {
            description: data.error || "Invalid BytePlus API key configuration",
            duration: 6000,
          });
          return;
        }
        
        throw new Error(data.error || "Failed to submit BytePlus try-on request");
      }

      console.log("BytePlus request completed successfully:", data);

      // Add to BytePlus results
      setByteplusResults((prev) => [data, ...prev]);

      // Show success toast with provider info
      toast.success("Virtual Try-On Complete! 🎉", {
        description: `Generated using ${data.provider === 'byteplus' ? 'BytePlus ModelArk Seedream' : data.provider}. Credits remaining: ${data.creditsRemaining}`,
      });

      // If we have a result image, show the result modal
      if (data.resultImageUrl) {
        const mockRequest: TryOnRequest = {
          id: data.requestId,
          predictionId: data.predictionId,
          modelImageUrl: selectedModelImageUrl || URL.createObjectURL(modelImage!),
          garmentImageUrl: selectedGarmentImageUrl || URL.createObjectURL(garmentImage!),
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
      console.error("BytePlus try-on error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process BytePlus try-on request. Please try again."
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
      link.download = `trialRoomStudio_byteplus_${Date.now()}.png`;
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
          title: "My Virtual Try-On Result (Beta - BytePlus ModelArk)",
          text: "Check out how this outfit looks on me! Generated with BytePlus ModelArk Seedream.",
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
      <Header />

      {/* Floating Subscription Indicator */}
      <FloatingSubscriptionIndicator />

      <main className="max-w-4xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-y-0 border-x">
        {/* BytePlus Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <TestTube className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-serif tracking-tight text-foreground">
                BytePlus Lab
              </h1>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
              <Layers className="h-3 w-3 mr-1" />
              ModelArk Seedream
            </Badge>
          </div>
          
          <p className="text-muted-foreground max-w-2xl">
            Experience high-quality virtual try-on powered by BytePlus ModelArk's Seedream 4.0 model. 
            This experimental feature provides instant 2K resolution results with advanced image generation capabilities.
          </p>
          
          {/* BytePlus Info Alert */}
          <Alert className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <TestTube className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>Beta Feature:</strong> This uses BytePlus ModelArk Seedream 4.0 for instant 2K image generation. 
              Results may vary from our main try-on system. Your feedback helps us improve!
            </AlertDescription>
          </Alert>
        </div>

        <FashionQuote />
        
        <Tabs defaultValue="try-on" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-serif tracking-tight text-foreground">
                Seedream Tailor Board
              </p>
              <span className="opacity-70 text-sm text-muted-foreground">
                High-resolution AI-powered virtual try-on
              </span>
            </div>
            <TabsList className="glass-card">
              <TabsTrigger
                value="try-on"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                BytePlus Try-On
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                BytePlus History ({allRequests.length})
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

            {/* Latest BytePlus Result Preview */}
            {completedRequests.length > 0 && (
              <Card className="border-ring bg-background">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-accent-foreground font-medium text-lg tracking-tight flex items-center gap-2">
                        Latest Seedream Result
                        <Badge variant="secondary" className="text-xs">
                          <Layers className="h-3 w-3 mr-1" />
                          2K Resolution
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        Generated instantly with BytePlus ModelArk Seedream 4.0
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
                        }}
                      >
                        <div className="relative">
                          <Image
                            width={1080}
                            height={1080}
                            src={completedRequests[0].resultImageUrl!}
                            alt="BytePlus ModelArk virtual try-on result"
                            className="w-full max-w-xs mx-auto rounded-lg border border-border group-hover:border-primary transition-all duration-200 shadow-sm group-hover:shadow-md"
                          />
                          {/* BytePlus Badge Overlay */}
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            Seedream 4.0
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
                          BytePlus Trial Room
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
                            <p className="text-xs text-muted-foreground mt-1">You</p>
                          </div>

                          <div className="flex-1 h-px bg-border"></div>
                          <div className="text-muted-foreground">
                            <Layers className="w-4 h-4" />
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
                            <p className="text-xs text-muted-foreground mt-1">Garment</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="space-y-2">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>AI Provider</span>
                            <span className="text-orange-600 font-medium">BytePlus ModelArk</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Resolution</span>
                            <span className="text-green-600 font-medium">2K (2048x2048)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing</span>
                            <span className="text-green-600 font-medium">Instant</span>
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
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
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
                              Download Seedream Result
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
                onClick={handleBytePlusTryOn}
                disabled={!isReadyToGenerate}
                size="lg"
                className={`
                  relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white
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
                    Generating with Seedream 4.0...
                  </>
                ) : (
                  <>
                    <Layers className="mr-2 h-5 w-5" />
                    Generate BytePlus Try-On
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
                      BytePlus Try-On History
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      View your BytePlus ModelArk Seedream virtual try-on sessions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {allRequests.length} sessions
                    </Badge>
                    <Badge variant="outline" className="text-sm bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
                      <Layers className="h-3 w-3 mr-1" />
                      Seedream 4.0
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your BytePlus sessions...</p>
                  </div>
                ) : allRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center mb-4">
                      <TestTube className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No BytePlus sessions yet
                    </h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      Try your first BytePlus ModelArk virtual try-on to see results here
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
                        {/* Desktop Layout */}
                        <div className="flex items-center gap-4">
                          {/* Status & Result Preview */}
                          <div className="flex-shrink-0">
                            {request.status === "COMPLETED" &&
                            request.resultImageUrl ? (
                              <div className="relative">
                                <img
                                  src={request.resultImageUrl}
                                  alt="BytePlus Result"
                                  className="w-16 h-16 object-cover rounded-lg border border-border"
                                />
                                {/* BytePlus Badge */}
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full border-2 border-background flex items-center justify-center">
                                  <Layers className="h-3 w-3 text-white" />
                                </div>
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
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
                                <Layers className="h-3 w-3 mr-1" />
                                Seedream
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
                              <span className="text-green-600 font-medium">2K Resolution</span>
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
                              <Layers className="h-3 w-3 text-muted-foreground" />
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
              BytePlus Trial Room - Seedream 4.0
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
                    <h4 className="font-medium">Seedream 4.0 Result</h4>
                    <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
                      <Layers className="h-3 w-3 mr-1" />
                      BytePlus ModelArk
                    </Badge>
                  </div>
                  <div className="relative">
                    <img
                      src={currentResult.resultImageUrl}
                      alt="BytePlus try-on result"
                      className="w-full max-h-[60vh] object-contain rounded-lg border mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => handleDownload(currentResult.resultImageUrl!)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
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
                <p className="flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4" />
                  Generated with BytePlus ModelArk Seedream 4.0
                </p>
                <p>Category: {currentResult.category}</p>
                <p>Resolution: 2K (2048x2048)</p>
                <p>Processing: Instant generation</p>
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
