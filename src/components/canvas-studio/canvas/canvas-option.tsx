import React, { useState, useRef } from 'react';
import { Upload, Square, X } from 'lucide-react';

interface CanvasStartOptionsProps {
  onImageUpload: (file: File) => void;
  onBlankCanvas: (width: number, height: number) => void;
  onClose?: () => void;
  show: boolean;
}

export const CanvasStartOptions: React.FC<CanvasStartOptionsProps> = ({
  onImageUpload,
  onBlankCanvas,
  onClose,
}) => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [customWidth, setCustomWidth] = useState('800');
  const [customHeight, setCustomHeight] = useState('600');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetSizes = [
    { name: 'Square (1:1)', width: 800, height: 800 },
    { name: 'Landscape (16:9)', width: 1200, height: 675 },
    { name: 'Portrait (9:16)', width: 675, height: 1200 },
    { name: 'Standard (4:3)', width: 800, height: 600 },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleBlankCanvas = (width: number, height: number) => {
    onBlankCanvas(width, height);
  };

  const handleCustomSize = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    
    if (width > 0 && height > 0 && width <= 2400 && height <= 2400) {
      handleBlankCanvas(width, height);
    }
  };

  if (showSizeSelector) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6 max-w-2xl mx-auto">
        <div className="w-full flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Choose Canvas Size</h2>
          <button
            onClick={() => setShowSizeSelector(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Preset Sizes */}
        <div className="w-full grid grid-cols-2 gap-4">
          {presetSizes.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleBlankCanvas(preset.width, preset.height)}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <Square size={32} className="text-slate-400 group-hover:text-blue-600 mb-2" />
              <span className="font-semibold text-slate-700 group-hover:text-blue-700">
                {preset.name}
              </span>
              <span className="text-sm text-slate-500 mt-1">
                {preset.width} × {preset.height}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Size */}
        <div className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <h3 className="font-semibold text-slate-700 mb-4">Custom Size</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-2">Width (px)</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="100"
                max="2400"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-2">Height (px)</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="100"
                max="2400"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCustomSize}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Maximum size: 2400 × 2400 pixels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Get Started</h1>
        <p className="text-slate-600">Choose how you want to begin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Upload Image Option */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 min-h-[280px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={40} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Image</h2>
            <p className="text-slate-600 text-center">
              Start with an existing image and add annotations
            </p>
          </div>
        </button>

        {/* Blank Canvas Option */}
        <button
          onClick={() => setShowSizeSelector(true)}
          className="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 min-h-[280px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Square size={40} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Blank Canvas</h2>
            <p className="text-slate-600 text-center">
              Start from scratch with a blank canvas
            </p>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}