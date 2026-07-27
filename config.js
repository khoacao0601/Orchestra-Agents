import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

let aiClient = null;
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

export function getAiClient() {
  if (!aiClient && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });
  }
  return aiClient;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';
