// lib/gemini.ts — Gemini AI conversational client for civic complaint extraction

import { CHILD_CATEGORIES } from "./categories";

/** Shape of a single conversation message */
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

/** Structured complaint data extracted by Gemini */
export interface ExtractedComplaint {
  title: string;
  child_id: number; // 1-42 integer from the taxonomy
  issue_type: string; // Human readable name for the UI
  severity: string;
  description: string;
  confidence: number;
  candidates?: number[]; // Top-3 alternative child_ids if confidence < 0.7
}

/** Shape returned from Gemini: either a reply or an extraction */
export interface GeminiResponse {
  reply: string;
  extracted: ExtractedComplaint | null;
}

const GEMINI_REQUEST_TIMEOUT_MS = 20000;

const CATEGORY_LIST_TEXT = Object.entries(CHILD_CATEGORIES)
  .map(([id, cat]) => `${id}: ${cat.name}`)
  .join("\n");

const SYSTEM_PROMPT = `You are JanSamadhan AI, a helpful civic complaint assistant for Delhi municipal services.
Your job: have a short, friendly conversation with the citizen to collect ALL required fields for their complaint summary, then output structured JSON.

REQUIRED FIELDS:
- title (5-10 word summary)
- child_id (Select the most appropriate ID from the category list below)
- severity (Low, Medium, High, or Critical)
- description (2-3 sentences)
- confidence (float between 0 and 1)

VALID CATEGORIES (ID: Name):
${CATEGORY_LIST_TEXT}

CIVIC FOCUS & SAFETY RULES:
1. Greet warmly. Ask for the issue.
2. If off-topic (jokes, politics, fun talk), politely steer back: "I can only help with civic infrastructure issues. What city problem can I help with today?"
3. Hard restriction: Never generate location data (wards, pincodes, etc.).

PROCESS RULES:
1. MANDATORY PHOTO: Submission requires a photo. If missing from history (check for "📷 Uploaded a photo..."), say: "I've noted the details. Please upload a photo to proceed."
2. Extraction Mode: Once all fields (title, child_id, severity, description, confidence) are known, respond ONLY with JSON:
\`\`\`json
{
  "extracted": {
    "title": "...",
    "child_id": 12,
    "issue_type": "...",
    "severity": "...",
    "description": "...",
    "confidence": 0.0,
    "candidates": [11, 15] 
  },
  "reply": "[Summary]. [If no photo: Please upload a photo to proceed], then type YES to submit."
}
\`\`\`
3. Unsure (confidence < 0.7): Include top 2 alternative IDs in "candidates".
4. Keep responses under 3 sentences. Be empathetic.`;

/**
 * Send the conversation history to Gemini and get a response.
 * Calls the Next.js API route to keep the API key server-side.
 */
export async function sendToGemini(messages: ChatMessage[], language?: string): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, language }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? "Failed to contact AI assistant");
    }

    return res.json() as Promise<GeminiResponse>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI assistant timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Export system prompt for server-side use */
export { SYSTEM_PROMPT };
