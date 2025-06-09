"use client";

import { History, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TryOnResult {
  id: string;
  modelImage: string;
  garmentImage: string;
  resultImage: string;
  category: string;
  createdAt: string;
}

interface HistoryGridProps {
  history: TryOnResult[];
  onDelete?: (id: string) => void;
}

export default function HistoryGrid({ history, onDelete }: HistoryGridProps) {
  const handleDownload = (resultImage: string, id: string) => {
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `try-on-result-${id}.jpg`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      tops: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      bottoms: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      dresses: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      outerwear: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  if (history.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Try-On History
          </CardTitle>
          <CardDescription>Your previous virtual try-on sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No try-ons yet</h3>
            <p className="text-muted-foreground">
              Start by creating your first virtual try-on session!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Try-On History
          <Badge variant="secondary" className="ml-auto">
            {history.length}
          </Badge>
        </CardTitle>
        <CardDescription>Your previous virtual try-on sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Main Result Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={item.resultImage}
                      alt="Try-on result"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(item.resultImage, item.id)}
                          className="bg-white/90 hover:bg-white text-gray-900"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(item.id)}
                            className="bg-destructive/90 hover:bg-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Section */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    
                    {/* Input Images */}
                    <div className="flex gap-2">
                      <img
                        src={item.modelImage}
                        alt="Model"
                        className="w-12 h-12 object-cover rounded border-2 border-border"
                      />
                      <img
                        src={item.garmentImage}
                        alt="Garment"
                        className="w-12 h-12 object-cover rounded border-2 border-border"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}