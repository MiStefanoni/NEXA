import { GoogleGenAI } from "@google/genai";
import { NEXA_PROFILE_SYSTEM_INSTRUCTION } from "./profile-prompt";
import {
  extractedFactsSchema,
  extractionJsonSchema,
  generatedProfileJsonSchema,
  generatedProfileSchema,
} from "./profile-schemas";

const GEMINI_TIMEOUT_MS = 30_000;

let aiClient;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

function getGeminiModel() {
  const model = String(process.env.GEMINI_PROFILE_MODEL || "").trim();
  if (!model) {
    throw new Error("GEMINI_PROFILE_MODEL is not configured.");
  }
  return model;
}

function parseGeminiJson(response) {
  const text = typeof response.text === "function" ? response.text() : response.text;
  const payload = JSON.parse(String(text || "{}"));
  return payload;
}

async function withTimeout(promise) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Gemini request timed out.")), GEMINI_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateStructured({ contents, schema, zodSchema }) {
  const response = await withTimeout(
    getGeminiClient().models.generateContent({
      model: getGeminiModel(),
      contents,
      config: {
        systemInstruction: NEXA_PROFILE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    }),
  );

  return zodSchema.parse(parseGeminiJson(response));
}

export async function extractProfileFacts({ initialDescription, locale = "pt" }) {
  return generateStructured({
    schema: extractionJsonSchema,
    zodSchema: extractedFactsSchema,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Stage 1: Extract only explicitly stated facts from this applicant description.",
              "Return empty strings or empty arrays for missing or uncertain information.",
              "Ask up to 5 useful follow-up questions if important facts are missing.",
              `Locale: ${locale}. Generate questions in Brazilian Portuguese for v1.`,
              "",
              "Allowed suggested_category_slug values:",
              "- saude-bem-estar-cuidado",
              "- servicos-profissionais-negocios",
              "- home-and-family-care",
              "- educacao-desenvolvimento-consultoria",
              "",
              "Applicant description:",
              initialDescription,
            ].join("\n"),
          },
        ],
      },
    ],
  });
}

export async function generateProfileDraft({ invite, facts, conversation, currentDraft, locale = "pt" }) {
  return generateStructured({
    schema: generatedProfileJsonSchema,
    zodSchema: generatedProfileSchema,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Stage 2: Write a Nexa professional profile draft in Brazilian Portuguese.",
              "Use only extracted facts and applicant-confirmed answers.",
              "Leave fields empty when information is not available.",
              "Never invent credentials, years, projects, languages, locations, services, clients, awards, or results.",
              "verified, featured, and founder_professional must be false.",
              `Locale: ${locale}.`,
              "",
              "Invitation:",
              JSON.stringify({ name: invite?.name || "", email: invite?.email || "" }),
              "",
              "Extracted facts:",
              JSON.stringify(facts || {}),
              "",
              "Follow-up answers:",
              JSON.stringify(conversation || []),
              "",
              "Current draft context:",
              JSON.stringify(currentDraft || {}),
            ].join("\n"),
          },
        ],
      },
    ],
  });
}

export function getGeminiFriendlyError() {
  return "Não foi possível utilizar o assistente neste momento. Você pode tentar novamente ou continuar preenchendo seu perfil manualmente.";
}
