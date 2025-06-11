"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Palette, Info, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  { 
    value: "auto", 
    label: "Auto", 
    description: "Automatically detect based on garment",
    icon: <Zap className="h-4 w-4 text-blue-500" />
  },
  { 
    value: "tops", 
    label: "Tops", 
    description: "T-shirts, shirts, blouses",
    icon: <Shirt className="h-4 w-4 text-green-500" />
  },
  { 
    value: "bottoms", 
    label: "Bottoms", 
    description: "Pants, jeans, shorts",
    icon: <Shirt className="h-4 w-4 text-orange-500" />
  },
  { 
    value: "one-pieces", 
    label: "One-Pieces", 
    description: "Dresses, jumpsuits, full outfits",
    icon: <Shirt className="h-4 w-4 text-purple-500" />
  },
];

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const getInfoContent = () => {
    return (
      <div className="space-y-4 text-sm p-3 glass-card">
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Category Guide
          </h4>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <strong className="text-blue-700 dark:text-blue-300">Auto (Recommended)</strong>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Automatically determines the garment category for you.
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• <strong>Flat-lay/Ghost mannequin:</strong> Detection is automatic</li>
              <li>• <strong>Full-body shots:</strong> Swaps entire outfit</li>
              <li>• <strong>Focused shots:</strong> Detects tops or bottoms automatically</li>
            </ul>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="h-4 w-4 text-green-500" />
              <strong className="text-green-700 dark:text-green-300">Tops</strong>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Upper body garments: shirts, t-shirts, blouses, sweaters, jackets
            </p>
          </div>

          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="h-4 w-4 text-orange-500" />
              <strong className="text-orange-700 dark:text-orange-300">Bottoms</strong>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Lower body garments: pants, jeans, shorts, skirts, leggings
            </p>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="h-4 w-4 text-purple-500" />
              <strong className="text-purple-700 dark:text-purple-300">One-Pieces</strong>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Single-piece or full-body garments: dresses, jumpsuits, rompers, coveralls
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            When to Use Manual Selection
          </h4>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• <strong>Multiple items in image:</strong> Choose specific garment to apply</li>
            <li>• <strong>Complex garments:</strong> When auto-detection is uncertain</li>
            <li>• <strong>Specific requirements:</strong> When you need precise control</li>
            <li>• <strong>Mixed styles:</strong> Images with both tops and bottoms visible</li>
          </ul>
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Pro Tip:</strong> Start with "Auto" for most cases. Only use manual selection when the automatic detection doesn't work as expected.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Clothing Category
          </div>
          
          {/* Info Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              >
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-96 max-h-96 overflow-y-auto glass-card border-border/50" 
              side="bottom"
              align="end"
            >
              {getInfoContent()}
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardDescription>
          Select the type of clothing item to ensure optimal results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full hover:border-primary/50 focus:border-primary">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-3">
                  {category.icon}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{category.label}</span>
                    <span className="text-xs text-muted-foreground">{category.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {value && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              {categories.find(cat => cat.value === value)?.icon}
              <span className="text-foreground font-medium">
                {categories.find(cat => cat.value === value)?.label} selected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {categories.find(cat => cat.value === value)?.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}