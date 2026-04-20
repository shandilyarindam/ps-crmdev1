// app/api/chat/route.ts — Server-side Gemini proxy (keeps API key safe)

import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/gemini";
import type { ChatMessage, GeminiResponse, ExtractedComplaint } from "@/lib/gemini";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ??
  process.env.GOOGLE_API_KEY ??
  process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL ?? "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.0-flash";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://jansamadhan.perkkk.dev",
  "https://api.jansamadhan.perkkk.dev",
]);

interface GeminiApiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiCandidate {
  content: { parts: { text: string }[] };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; status?: string; code?: number };
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function withCors(req: NextRequest, init?: ResponseInit): ResponseInit {
  const origin = req.headers.get("origin");
  return {
    ...init,
    headers: {
      ...getCorsHeaders(origin),
      ...(init?.headers ?? {}),
    },
  };
}

function toConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function sanitizeExtracted(value: unknown): ExtractedComplaint | null {
  if (!value || typeof value !== "object") return null;

  const v = value as Record<string, unknown>;
  const title = typeof v.title === "string" ? v.title.trim() : "";
  const issueType = typeof v.issue_type === "string" ? v.issue_type.trim() : "";
  const severity = typeof v.severity === "string" ? v.severity.trim() : "";
  const description = typeof v.description === "string" ? v.description.trim() : "";
  const childId = typeof v.child_id === "number" ? Math.floor(v.child_id) : parseInt(String(v.child_id), 10);

  if (!title || !issueType || !severity || !description || isNaN(childId)) return null;

  let candidates: number[] | undefined;
  if (Array.isArray(v.candidates)) {
    candidates = v.candidates
      .map((c) => (typeof c === "number" ? Math.floor(c) : parseInt(String(c), 10)))
      .filter((c) => !isNaN(c));
  }

  return {
    title,
    child_id: childId,
    issue_type: issueType,
    severity,
    description,
    confidence: toConfidence(v.confidence),
    candidates: candidates?.length ? candidates : undefined,
  };
}

/**
 * POST /api/chat
 * Accepts conversation messages and proxies them to Google Gemini.
 * Returns a structured GeminiResponse (reply + optional extracted complaint).
 */
export async function POST(req: NextRequest): Promise<NextResponse<GeminiResponse | { error: string }>> {
  // ── Rate limiting ──
  const rlKey = rateLimitKey(req, "chat");
  const rl = checkRateLimit(rlKey, RATE_LIMITS.chat);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { ...withCors(req, { status: 429 }), headers: { ...getCorsHeaders(req.headers.get("origin")), "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured (set GEMINI_API_KEY or GOOGLE_API_KEY)" },
      withCors(req, { status: 500 }),
    );
  }

  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, withCors(req, { status: 403 }));
  }

  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      withCors(req, { status: 400 }),
    );
  }

  const messages = body.messages as ChatMessage[];
  const language = body.language as string | undefined;

  // Map ISO codes to explicit language names so Gemini doesn't misinterpret them
  const LANGUAGE_NAMES: Record<string, string> = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "bn-IN": "Bengali",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "pa-IN": "Punjabi",
  };

  const languageName = language ? (LANGUAGE_NAMES[language] ?? language) : null;

  // Build Gemini API contents: system instruction + conversation history
  const systemPrompt = languageName && languageName !== "English"
    ? `${SYSTEM_PROMPT}\n\nCRITICAL INSTRUCTION: You MUST strictly reply in ${languageName}. All your conversational responses AND the 'reply' field in your JSON output MUST be written entirely in ${languageName}. Do NOT reply in English unless the user explicitly asks for it.`
    : SYSTEM_PROMPT;

  const contents: GeminiApiContent[] = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I am JanSamadhan AI, ready to help Delhi citizens report civic issues in the requested language." }] },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.text }],
    })),
  ];

  try {
    const models = [GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL].filter(
      (v, i, arr) => Boolean(v) && arr.indexOf(v) === i,
    );

    let data: GeminiApiResponse | null = null;
    let quotaFailure = false;

    for (const model of models) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { 
              temperature: 0.2, 
              maxOutputTokens: 2048,
              topK: 40,
              topP: 0.95
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        },
      );

      data = (await geminiRes.json()) as GeminiApiResponse;

      if (!data.error) {
        quotaFailure = false;
        break;
      }

      const isQuota =
        data.error.code === 429 ||
        data.error.status === "RESOURCE_EXHAUSTED" ||
        /quota|resource_exhausted/i.test(data.error.message);

      const isNotFound =
        data.error.code === 404 ||
        data.error.status === "NOT_FOUND" ||
        /not found|unsupported/i.test(data.error.message);

      if (isQuota) {
        quotaFailure = true;
        continue;
      }

      if (isNotFound) {
        // Model ID may be unavailable for this API version/project; try next model.
        continue;
      }

      return NextResponse.json({ error: data.error.message }, withCors(req, { status: 502 }));
    }

    if (!data || data.error) {
      const status = quotaFailure ? 429 : 502;
      const message = quotaFailure
        ? "Gemini quota exhausted. Please retry shortly or switch to a billed Gemini project."
        : (data?.error?.message ?? "Gemini request failed");
      return NextResponse.json({ error: message }, withCors(req, { status }));
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json({ error: "Empty response from Gemini" }, withCors(req, { status: 502 }));
    }

    // Try to parse extracted complaint JSON from code block
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch) {
      let jsonStr = jsonMatch[1].trim();
      
      // Attempt to repair truncated JSON (count open/close braces)
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        jsonStr += "}".repeat(openBraces - closeBraces);
      }

      try {
        const parsed = JSON.parse(jsonStr) as { extracted?: unknown; reply?: unknown };
        const extracted = sanitizeExtracted(parsed.extracted);
        const reply = typeof parsed.reply === "string" && parsed.reply.trim()
          ? parsed.reply
          : "I've noted the details of your complaint. Please review the summary and type YES to submit.";

        return NextResponse.json({
          reply,
          extracted,
        }, withCors(req));
      } catch (parseError) {
        console.error("[Gemini] JSON Parse Error:", parseError, "Raw context:", jsonStr.slice(0, 100));
        // If it looks like JSON but failed parsing, don't show the raw code to the user.
        // Return a conversational fallback.
        return NextResponse.json({ 
          reply: "I've summarized your issue! Please look at the summary above and type YES if everything is correct.",
          extracted: null 
        }, withCors(req));
      }
    }

    // Plain conversational reply (ensure we don't return raw JSON blocks here either)
    const cleanReply = rawText.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*\}/g, "").trim();
    return NextResponse.json({ 
      reply: cleanReply || "I'm here to help. Could you tell me more about the civic issue you're facing?", 
      extracted: null 
    }, withCors(req));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return NextResponse.json({ error: message }, withCors(req, { status: 502 }));
  }
}

export async function OPTIONS(req: NextRequest): Promise<Response> {
  const origin = req.headers.get("origin");

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, withCors(req, { status: 403 }));
  }

  return new Response(null, withCors(req, { status: 204 }));
}
