import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiInstance = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return aiInstance;
}
