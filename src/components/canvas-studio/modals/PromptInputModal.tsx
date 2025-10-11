import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, materialFile?: File | null) => void;
  title?: string;
  placeholder?: string;
  initialValue?: string;
}

export const PromptInputModal: React.FC<PromptInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Enter Prompt",
  placeholder = "Describe what you want to generate...",
  initialValue = "",
}) => {
  const [prompt, setPrompt] = useState(initialValue);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialMode, setMaterialMode] = useState<"text" | "upload">("text");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validText = materialMode === "text" && materialDesc.trim().length > 0;
    const validUpload = materialMode === "upload" && !!materialFile;
    if (!validText && !validUpload) return;

    const parts: string[] = [];
    parts.push(`Gender: ${gender}.`);
    if (materialMode === "text") {
      parts.push(`Material: ${materialDesc.trim()}.`);
    } else if (materialMode === "upload") {
      parts.push("Use the uploaded material reference as the fabric/texture cue.");
    }

    if (showCustomPrompt && prompt.trim()) {
      parts.push(prompt.trim());
    }
    console.log("[PromptInputModal] Combined prompt:", parts.join(" "), materialMode, materialDesc, materialFile);
    const combined = parts.join(" ");
    console.log("[PromptInputModal] Combined prompt:", combined);
    onSubmit(combined, materialMode === "upload" ? materialFile : null);
    setMaterialDesc("");
    setMaterialFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[13vh] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Gender Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-700 min-w-20">Gender</span>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                />
                Male
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                />
                Female
              </label>
            </div>

            {/* Material mode */}
            <div className="space-y-2">
              <span className="text-sm text-slate-700">Material</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMaterialMode("text")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    materialMode === "text"
                      ? "bg-primary text-white"
                      : "bg-accent/10 text-slate-600 hover:bg-accent/20"
                  }`}
                >
                  Describe
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialMode("upload")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    materialMode === "upload"
                      ? "bg-primary text-white"
                      : "bg-accent/10 text-slate-600 hover:bg-accent/20"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {materialMode === "text" ? (
              <div className="flex items-start gap-4">
                <span className="text-sm text-slate-700 min-w-20 mt-2">Describe</span>
                <textarea
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  placeholder="Describe fabric type, color, pattern, texture..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[72px]"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-700 min-w-20">Reference</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {materialFile && (
                  <span className="text-xs text-slate-500">{materialFile.name}</span>
                )}
              </div>
            )}

            {/* Custom prompt toggle and actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-700 underline"
                onClick={() => setShowCustomPrompt((v) => !v)}
              >
                {showCustomPrompt ? "Hide custom prompt" : "Add custom prompt"}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !(
                      (materialMode === "text" && materialDesc.trim().length > 0) ||
                      (materialMode === "upload" && !!materialFile)
                    )
                  }
                >
                  Generate
                </Button>
              </div>
            </div>

            {showCustomPrompt && (
              <div className="flex items-start gap-4">
                <span className="text-sm text-slate-700 min-w-20 mt-2">Custom</span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[72px]"
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
