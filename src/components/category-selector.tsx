"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Palette } from "lucide-react";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  { value: "auto", label: "Auto", description: "Automatically Detect based on garment" },
  { value: "tops", label: "Tops", description: "T-shirts, shirts, blouses" },
  { value: "bottoms", label: "Bottoms", description: "Pants, jeans, shorts" },
  { value: "one-pieces", label: "One pieces", description: "Any single garment" },
];

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Clothing Category
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
          <SelectContent className="glass-card ">
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value} >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{category.label}</span>
                  <span className="text-xs text-muted-foreground">{category.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {value && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Shirt className="h-4 w-4 text-primary" />
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