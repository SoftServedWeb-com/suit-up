"use client";

import { useState } from "react";
import { Sparkles, Search, CheckCircle, MessageSquare } from "lucide-react";
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
}

interface StyleSelectorProps {
  selectedPrompt: string;
  onPromptSelect: (promptId: string) => void;
  predefinedPrompts: TransformationPrompt[];
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
}

export default function StyleSelector({
  selectedPrompt,
  onPromptSelect,
  predefinedPrompts,
  customPrompt,
  onCustomPromptChange,
}: StyleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  const isCustomSelected = selectedPrompt === "custom";

  return (
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Custom Prompt</h3>
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

          {/* Divider */}
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
                    group relative p-6 rounded-xl border-2 transition-all duration-200 
                    focus:outline-none focus:ring-4 focus:ring-primary/20
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
                  <div className="text-center space-y-3">
                    <div className="text-3xl mb-2" role="img" aria-hidden="true">
                      {prompt.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                        {prompt.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {prompt.description}
                      </p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant="secondary"
                      className="text-xs px-2 py-1 bg-white/80 text-gray-700"
                    >
                      {prompt.category}
                    </Badge>
                  </div>
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
        </div>
      </CardContent>
    </Card>
  );
}