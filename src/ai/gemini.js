import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { localReply } from "./fallbackBrain.js";
import { warn, error } from "../utils/logger.js";

let client = null;

function getClient() {
  if (!env.enableGemini || !env.geminiApiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

export async function generateReply({ prompt, fallbackPayload }) {
  const ai = getClient();

  if (!ai) {
    warn("Gemini disabled or API key missing, using local fallback");
    return localReply(fallbackPayload);
  }

  try {
    const res = await ai.models.generateContent({
      model: env.geminiModel,
      contents: prompt
    });
    return res.text || localReply(fallbackPayload);
  } catch (err) {
    error("Gemini failed, using local fallback", String(err?.message || err));
    return localReply(fallbackPayload);
  }
}
