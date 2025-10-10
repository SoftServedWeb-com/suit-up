'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { loadImage } from "./utils";

interface GeneratedGalleryProps {
  isVisible: boolean;
  gallery: string[];
  onUseImage: (img: HTMLImageElement) => void;
  onView: (url: string) => void;
  onClearAll: () => void;
}

export const GeneratedGallery: React.FC<GeneratedGalleryProps> = ({
  isVisible,
  gallery,
  onUseImage,
  onView,
  onClearAll,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-4 bottom-24 z-40 w-72 max-w-[28vw]">
      <div className="h-full bg-white/90 backdrop-blur-xl border border-slate-300 rounded-xl shadow-2xl p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Generated Images</h3>
          <button
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            onClick={onClearAll}
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {gallery.map((url, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gen ${idx+1}`} className="w-full aspect-square object-cover" />
              <div className="p-2 flex gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs flex-1"
                  onClick={async () => {
                    try {
                      const img = await loadImage(url);
                      onUseImage(img);
                    } catch {}
                  }}
                >
                  Use
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs flex-1"
                  onClick={() => onView(url)}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500">No generations yet.</p>
              <p className="text-xs text-slate-400 mt-1">Generated images will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedGallery;


