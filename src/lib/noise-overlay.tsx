'use client';

import React from 'react';
import { ColorTheme } from '@/lib/colors-switch';

interface NoiseOverlayProps {
  theme: ColorTheme;
}

export function NoiseOverlay({ theme }: NoiseOverlayProps) {
  const [noiseDataURL, setNoiseDataURL] = React.useState<string>('');

  React.useEffect(() => {
    // Generate true random noise texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const imageData = ctx.createImageData(128, 128);
    const data = imageData.data;
    
    // Generate actual noise (not patterns)
    for (let i = 0; i < data.length; i += 4) {
      // Multi-layered random noise
      const noise1 = Math.random();
      const noise2 = Math.random() * 0.5;
      const noise3 = Math.random() * 0.25;
      
      const combined = (noise1 + noise2 + noise3) / 1.75;
      
      // Only show noise above threshold
      if (combined > 0.65) {
        const alpha = Math.floor((combined - 0.65) * 255 * 3);
        data[i] = 0;     // R (black)
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = Math.min(alpha, 50); // A (capped opacity)
      } else {
        // Transparent
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    setNoiseDataURL(canvas.toDataURL());
  }, []);

  const themeColors = {
    yellow: 'rgba(158, 191, 23, 0.7)',
    pink: 'rgba(132, 0, 106, 0.8)', 
    red: 'rgba(142, 0, 0, 0.7)',
  };

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 8,
        backgroundColor: themeColors[theme],
        backgroundImage: noiseDataURL ? `url(${noiseDataURL})` : undefined,
        backgroundSize: '128px 128px',
        backgroundRepeat: 'repeat',
        mixBlendMode: 'multiply',
      }}
    />
  );
}