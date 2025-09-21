"use client";

import { useState } from "react";
import { Sparkles, Search, CheckCircle, MessageSquare, Upload, X, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TransformationPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  icon: string;
  isCustom?: boolean;
  requiresReferenceImage?: boolean;
  exampleImage?: string;
}

interface StyleSelectorProps {
  selectedPrompt: string;
  onPromptSelect: (promptId: string) => void;
  predefinedPrompts: TransformationPrompt[];
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  referenceImage?: File | null;
  referenceImagePreview?: string | null;
  onReferenceImageSelect?: (file: File | null, preview: string | null) => void;
}

export default function StyleSelector({
  selectedPrompt,
  onPromptSelect,
  predefinedPrompts,
  customPrompt,
  onCustomPromptChange,
  referenceImage,
  referenceImagePreview,
  onReferenceImageSelect,
}: StyleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<{url: string, name: string} | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(false);

  const getFilteredPrompts = () => {
    if (!searchTerm.trim()) {
      return predefinedPrompts;
    }
    
    const term = searchTerm.toLowerCase();
    return predefinedPrompts.filter(prompt => 
      prompt.name.toLowerCase().includes(term) ||
      prompt.description.toLowerCase().includes(term) ||
      prompt.category.toLowerCase().includes(term)
    );
  };

  const handleCustomPromptSelect = () => {
    onPromptSelect("custom");
  };

  const handleShowCustomPrompt = () => {
    setShowCustomPrompt(true);
    onPromptSelect("custom");
  };

  const isCustomSelected = selectedPrompt === "custom";
  const selectedPromptData = predefinedPrompts.find(p => p.id === selectedPrompt);
  const requiresReferenceImage = selectedPromptData?.requiresReferenceImage;

  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onReferenceImageSelect) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      onReferenceImageSelect(file, previewUrl);
    }
  };

  const handleRemoveReferenceImage = () => {
    if (onReferenceImageSelect) {
      onReferenceImageSelect(null, null);
    }
  };

  return (
    <>
    <Card className="border-ring bg-background">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          Choose Your Style
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Pick a predefined style or write your own custom transformation prompt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Custom Prompt Section */}
          {!showCustomPrompt ? (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleShowCustomPrompt}
                className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Create Custom Prompt
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Write your own transformation description
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Custom Prompt</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomPrompt(false);
                    onCustomPromptChange("");
                    if (isCustomSelected) {
                      onPromptSelect("");
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe how you want to transform your image... (e.g., 'Transform this into a watercolor painting with soft blues and greens, dreamy atmosphere, and artistic brushstrokes')"
                  value={customPrompt}
                  onChange={(e) => onCustomPromptChange(e.target.value)}
                  onClick={handleCustomPromptSelect}
                  className={`min-h-24 resize-none ${
                    isCustomSelected ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  rows={3}
                />
                {customPrompt.trim() && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom prompt ready</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          {showCustomPrompt && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or choose a preset style
                </span>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search preset styles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              aria-label="Search transformation styles"
            />
          </div>

          {/* Results Count */}
          {searchTerm && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {getFilteredPrompts().length} style{getFilteredPrompts().length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}

          {/* Preset Styles Grid */}
          {getFilteredPrompts().length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredPrompts().map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  className={`
                    group relative p-4 rounded-xl border-2 transition-all duration-200 
                    focus:outline-none focus:ring-4 focus:ring-primary/20 h-full
                    ${selectedPrompt === prompt.id 
                      ? 'border-primary bg-primary/10 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50 hover:scale-102'
                    }
                  `}
                  onClick={() => onPromptSelect(prompt.id)}
                  aria-pressed={selectedPrompt === prompt.id}
                  aria-label={`Select ${prompt.name} style: ${prompt.description}`}
                >
                  {/* Selection Indicator */}
                  {selectedPrompt === prompt.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* Style Content */}
                  <div className="space-y-3">
                    {/* Example Image */}
                    {prompt.exampleImage ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 group/image">
                        <img
                          src={prompt.exampleImage}
                          alt={`${prompt.name} example`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Icon Overlay */}
                        <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                          <span className="text-lg" role="img" aria-hidden="true">
                            {prompt.icon}
                          </span>
                        </div>
                        {/* Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({url: prompt.exampleImage!, name: prompt.name});
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200"
                          aria-label={`Preview ${prompt.name} example`}
                        >
                          <Eye className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl mb-1" role="img" aria-hidden="true">
                            {prompt.icon}
                          </div>
                          <p className="text-xs text-gray-500">Preview</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Text Content */}
                    <div className="text-center">
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                        {prompt.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {prompt.description}
                      </p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge 
                      variant="secondary"
                      className="text-xs px-2 py-1 bg-white/90 text-gray-700 shadow-sm"
                    >
                      {prompt.category}
                    </Badge>
                  </div>

                  {/* Reference Image Required Badge */}
                  {prompt.requiresReferenceImage && (
                    <div className="absolute bottom-2 right-2">
                      <Badge 
                        variant="outline"
                        className="text-xs px-2 py-1 bg-orange-50/90 text-orange-700 border-orange-200 shadow-sm"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Ref. Image
                      </Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No styles found
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Try adjusting your search terms or browse all available styles.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Selected Style Info */}
          {selectedPrompt && selectedPrompt !== "custom" && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">
                    {predefinedPrompts.find(p => p.id === selectedPrompt)?.name} Selected
                  </h4>
                  <p className="text-sm text-gray-700">
                    {predefinedPrompts.find(p => p.id === selectedPrompt)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Prompt Selected Info */}
          {isCustomSelected && customPrompt.trim() && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">
                    Custom Prompt Selected
                  </h4>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {customPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reference Image Upload Section */}
          {requiresReferenceImage && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Reference Image Required</h3>
                <Badge variant="secondary" className="text-xs">Required</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This style requires a reference image to work properly. Please upload an image that will be used as a reference for the transformation.
              </p>

              {!referenceImagePreview ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="reference-image-upload"
                      accept="image/*"
                      onChange={handleReferenceImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="reference-image-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload reference image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WebP up to 10MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src={referenceImagePreview}
                      alt="Reference image preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveReferenceImage}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      aria-label="Remove reference image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Reference image uploaded successfully</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Image Preview Modal */}
    {previewImage && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-2xl max-h-[80vh] bg-white rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{previewImage.name} - Example</h3>
            <button
              onClick={() => setPreviewImage(null)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <img
              src={previewImage.url}
              alt={`${previewImage.name} example`}
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
            />
          </div>
        </div>
        {/* Click outside to close */}
        <div 
          className="absolute inset-0 -z-10" 
          onClick={() => setPreviewImage(null)}
        />
      </div>
    )}
  </>
  );
}