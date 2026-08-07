import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export function getAiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

let aiClient = null;

export function getAiClient() {
  const key = getAiKey();
  if (key) {
    if (!aiClient) {
      console.log(`[Config] GEMINI_API_KEY detected (${key.substring(0, 8)}...). Initializing GoogleGenAI client.`);
      aiClient = new GoogleGenAI({ apiKey: key });
    }
    return aiClient;
  }
  return null;
}

export const DEFAULT_MODEL = 'gemini-3.6-flash';
