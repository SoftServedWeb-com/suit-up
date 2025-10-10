"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShirtIcon } from "lucide-react";

interface GeneratedImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  onSave?: () => Promise<void>;
  onTryOn?: () => void;
}

export function GeneratedImageModal({ isOpen, onClose, imageDataUrl, onSave, onTryOn }: GeneratedImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generated Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {imageDataUrl && (
            <div className="relative w-full overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Generated" className="w-full h-auto" />
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <div className="flex gap-2">
              {onTryOn && (
                <Button variant="secondary" onClick={onTryOn}>
                  <ShirtIcon className="h-4 w-4 mr-2" />
                  Try On
                </Button>
              )}
              {onSave && (
                <Button onClick={onSave}>Save to Library</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


