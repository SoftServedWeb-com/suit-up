'use client'

import React from "react";
import { Lasso } from "lucide-react";

interface MaskPromptBarProps {
  isActive: boolean;
  maskStrokesCount: number;
  maskPrompt: string;
  setMaskPrompt: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onCancel: () => void;
  isApiAvailable: boolean;
}

export const MaskPromptBar: React.FC<MaskPromptBarProps> = ({
  isActive,
  maskStrokesCount,
  maskPrompt,
  setMaskPrompt,
  onSubmit,
  onClear,
  onCancel,
  isApiAvailable,
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-[13vh] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Lasso size={16} />
            <span className="font-medium">
              {maskStrokesCount > 0 ? "Edit Selected Area" : "Paint to Select Area"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={maskPrompt}
              onChange={(e) => setMaskPrompt(e.target.value)}
              placeholder={
                maskStrokesCount > 0
                  ? "Describe how to change the selected area..."
                  : "First paint an area to select, then describe changes..."
              }
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={maskStrokesCount === 0}
              autoFocus
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  maskStrokesCount > 0 &&
                  maskPrompt.trim()
                ) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />

            <div className="flex items-center gap-2">
              {maskStrokesCount > 0 && (
                <button
                  onClick={onClear}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  Clear
                </button>
              )}

              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaskPromptBar;


