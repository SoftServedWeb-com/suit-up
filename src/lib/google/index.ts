import { GoogleGenAI } from "@google/genai";

// Initialize Google GenAI
export const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });
  
