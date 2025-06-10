"use client";

import { useState, useEffect } from "react";
import { Sparkles, User, Shirt, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/image-upload";
import CategorySelector from "@/components/category-selector";
import TryOnResult from "@/components/try-on-selector";
import Header from "@/components/page/header";

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
  const [category, setCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Processing states
  const [processingRequests, setProcessingRequests] = useState<ProcessingRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TryOnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's try-on history on component mount
  useEffect(() => {
    loadTryOnHistory();
  }, []);

  const loadTryOnHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/try-on/status-history",
        // {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     userId: "12345", // Replace with actual user ID
        //   }),

        // }
      );
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

  const handleTryOn = async () => {
    if (!modelImage || !garmentImage || !category) {
      alert("Please upload both images and select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("modelImage", modelImage);
      formData.append("garmentImage", garmentImage);
      formData.append("category", category);

      console.log("Get Request Data :", JSON.stringify(formData)); 

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit try-on request");
      }

      const data = await response.json();
      console.log("Get Request Data : ", JSON.stringify(data)); 

      
      // Add to processing queue
      const newProcessingRequest: ProcessingRequest = {
        requestId: data.requestId,
        status: "submitted",
        startTime: Date.now()
      };
      
      setProcessingRequests(prev => [...prev, newProcessingRequest]);
      
      // Start polling for this request
      startPolling(data.requestId);
      
      // Clear form
      setModelImage(null);
      setGarmentImage(null);
      setCategory("");

      // Reload history to include the new request
      loadTryOnHistory();

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit try-on request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (requestId: string) => {
    
    console.log("Request ID : ", requestId)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/try-on/status?requestId=${requestId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log("Polling status:", data.status);
          
          // Update processing request status
          setProcessingRequests(prev => 
            prev.map(req => 
              req.requestId === requestId 
                ? { ...req, status: data.status }
                : req
            )
          );

          // If completed or failed, stop polling and update results
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            clearInterval(pollInterval);
            
            // Remove from processing queue
            setProcessingRequests(prev => 
              prev.filter(req => req.requestId !== requestId)
            );
            
            // Reload history to get updated data
            loadTryOnHistory();
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
      // Remove from processing queue if still there
      setProcessingRequests(prev => 
        prev.filter(req => req.requestId !== requestId)
      );
    }, 180000);
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

  const completedRequests = allRequests.filter(req => req.status === "COMPLETED");
  const isReadyToGenerate = modelImage && garmentImage && category && !isSubmitting;

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
                History ({allRequests.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="try-on" className="space-y-8">
            {/* Processing Queue */}
            {processingRequests.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    Processing Requests
                  </CardTitle>
                  <CardDescription>
                    Your try-on requests are being processed by AI. This usually takes 20-40 seconds.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {processingRequests.map((req) => (
                      <div key={req.requestId} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(req.status)}
                          <span className="font-medium">
                            {req.status === "submitted" ? "Submitted to AI" : 
                             req.status === "PENDING" ? "In Queue" : 
                             req.status === "PROCESSING" ? "Generating..." : req.status}
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
            {/* <Button onClick={()=>startPolling("cmbq18c5e00013udo1s6e1dxw")}> Start polling</Button> */}
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

            {/* Latest Completed Result */}
            {completedRequests.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <TryOnResult
                  resultImage={completedRequests[0].resultImageUrl!}
                  modelImage={completedRequests[0].modelImageUrl}
                  garmentImage={completedRequests[0].garmentImageUrl}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Try-On History
                  <Badge variant="secondary" className="ml-auto">
                    {allRequests.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Your virtual try-on sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-muted-foreground mx-auto animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your try-on history...</p>
                  </div>
                ) : allRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No try-ons yet</h3>
                    <p className="text-muted-foreground">
                      Start by creating your first virtual try-on session!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-0">
                          <div className="relative">
                            {request.status === "COMPLETED" && request.resultImageUrl ? (
                              <img
                                src={request.resultImageUrl}
                                alt="Try-on result"
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-48 bg-muted flex items-center justify-center">
                                {getStatusIcon(request.status)}
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {request.status}
                                </span>
                              </div>
                            )}
                            
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <img
                                  src={request.modelImageUrl}
                                  alt="Model"
                                  className="w-12 h-12 object-cover rounded border-2 border-border"
                                />
                                <img
                                  src={request.garmentImageUrl}
                                  alt="Garment"
                                  className="w-12 h-12 object-cover rounded border-2 border-border"
                                />
                              </div>
                              
                              {request.processingTime && (
                                <p className="text-xs text-muted-foreground">
                                  Processed in {request.processingTime}s
                                </p>
                              )}

                              {request.errorMessage && (
                                <p className="text-xs text-red-500">
                                  Error: {request.errorMessage}
                                </p>
                              )}
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
      </main>
    </div>
  );
}