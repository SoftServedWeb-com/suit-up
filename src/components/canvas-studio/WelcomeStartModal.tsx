'use client'

import React from "react";
import { Upload, Square, X, Maximize2 } from "lucide-react";

type PresetSize = {
  name: string;
  width: number;
  height: number;
  isFullscreen?: boolean;
};

interface WelcomeStartModalProps {
  isOpen: boolean;
  showSizeSelector: boolean;
  onOpenSizeSelector: () => void;
  onCloseSizeSelector: () => void;
  onClickUpload: () => void;
  presetSizes: PresetSize[];
  customWidth: string;
  customHeight: string;
  setCustomWidth: (value: string) => void;
  setCustomHeight: (value: string) => void;
  onCreateCustomSize: () => void;
  onSelectPreset: (width: number, height: number) => void;
}

export const WelcomeStartModal: React.FC<WelcomeStartModalProps> = ({
  isOpen,
  showSizeSelector,
  onOpenSizeSelector,
  onCloseSizeSelector,
  onClickUpload,
  presetSizes,
  customWidth,
  customHeight,
  setCustomWidth,
  setCustomHeight,
  onCreateCustomSize,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  if (showSizeSelector) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <button
            onClick={onCloseSizeSelector}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>

          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Choose Canvas Size</h2>
              <p className="text-slate-600">Select a preset or create your own custom size</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetSizes.filter(p => !p.isFullscreen).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onSelectPreset(preset.width, preset.height)}
                    className="group flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    <Square size={28} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                    <span className="font-semibold text-slate-700 text-sm mb-1">{preset.name}</span>
                    <span className="text-xs text-slate-500">{preset.width} × {preset.height}</span>
                  </button>
                ))}
              </div>

              {presetSizes.filter(p => p.isFullscreen).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onSelectPreset(preset.width, preset.height)}
                  className="group w-full flex items-center justify-between p-5 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl hover:border-purple-500 hover:from-purple-100 hover:to-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Maximize2 size={24} className="text-purple-600" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800 text-base">{preset.name}</span>
                      <span className="block text-xs text-slate-600 mt-0.5">Maximum available workspace</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{preset.width} × {preset.height}px</span>
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-700 text-lg mb-4 flex items-center gap-2">
                <Square size={18} />
                Custom Size
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    min="100"
                    max="2400"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={onCreateCustomSize}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Maximum size: 2400 × 2400 pixels</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Get Started</h2>
            <p className="text-lg text-slate-600">How would you like to begin?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={onClickUpload}
              className="group relative flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 min-h-[240px]"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={36} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Image</h3>
              <p className="text-slate-600 text-center text-sm">Start with an existing image</p>
            </button>

            <button
              onClick={onOpenSizeSelector}
              className="group relative flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 min-h-[240px]"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Square size={36} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Blank Canvas</h3>
              <p className="text-slate-600 text-center text-sm">Start from scratch</p>
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">💡 Use drawing tools to sketch, then transform with AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStartModal;


