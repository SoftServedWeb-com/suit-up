"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GeneratedImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  onSave?: () => Promise<void>;
}

export function GeneratedImageModal({ isOpen, onClose, imageDataUrl, onSave }: GeneratedImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generated Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {imageDataUrl && (
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Generated" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {onSave && (
              <Button onClick={onSave}>Save to Library</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


