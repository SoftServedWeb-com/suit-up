'use client'

import React from "react";
import { Upload, Square, Undo, Redo, Trash2, Download, Zap } from "lucide-react";

interface MainActionsToolbarProps {
  isVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isGenerating: boolean;
  isImageLoaded: boolean;
  isMaskActive: boolean;
  hasMaskSelection: boolean;
  maskPrompt: string;
  onClickUpload: () => void;
  onClickNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onGenerate: () => void;
}

export const MainActionsToolbar: React.FC<MainActionsToolbarProps> = ({
  isVisible,
  canUndo,
  canRedo,
  isGenerating,
  isImageLoaded,
  isMaskActive,
  hasMaskSelection,
  maskPrompt,
  onClickUpload,
  onClickNew,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  onGenerate,
}) => {
  if (!isVisible) return null;

  const isGenerateDisabled = !isImageLoaded || isGenerating || (isMaskActive && ( !hasMaskSelection || !maskPrompt.trim()))

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-3">
        <div className="flex gap-3 items-center justify-center">
          <button
            onClick={onClickUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-lg"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={onClickNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg"
          >
            <Square size={16} />
            <span className="hidden sm:inline">New</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo || isGenerating}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo || isGenerating}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              <Redo size={16} />
            </button>
          </div>

          <button
            onClick={onClear}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={onDownload}
            disabled={!isImageLoaded || isGenerating}
            className="flex items-center gap-2 px-3 py-2.5 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-green-700 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <Download size={16} />
          </button>

          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl p-[1px] shadow-xl">
            <button
              onClick={onGenerate}
              disabled={isGenerateDisabled}
              className="w-full font-bold py-2.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-blue-600 whitespace-nowrap text-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  {isMaskActive ? "Edit Mask" : "Edit"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainActionsToolbar;


