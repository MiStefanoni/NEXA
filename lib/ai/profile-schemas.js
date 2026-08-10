import { z } from "zod";

export const FOLLOW_UP_LIMITS = {
  maxQuestionsPerRound: 5,
  maxQuestionRounds: 3,
  maxGenerations: 2,
  maxInitialDescriptionLength: 4000,
  maxAnswerLength: 2000,
};

const nullableString = z.string().nullable().optional().default("");

export const followUpQuestionSchema = z.object({
  id: z.string().min(1).max(80),
  question: z.string().min(1).max(500),
  type: z.enum(["text", "single_choice", "multi_choice"]).default("text"),
  required: z.boolean().default(false),
  options: z.array(z.string().max(120)).max(8).default([]),
});

export const extractedFactsSchema = z.object({
  profession: nullableString,
  suggested_category_slug: nullableString,
  experience_years: nullableString,
  location: nullableString,
  delivery_modes: z.array(z.string().max(80)).max(3).default([]),
  languages: z.array(z.string().max(80)).max(8).default([]),
  client_focus: nullableString,
  credentials: z.array(z.string().max(200)).max(8).default([]),
  services: z.array(z.string().max(200)).max(6).default([]),
  portfolio_facts: z.array(z.string().max(300)).max(6).default([]),
  website: nullableString,
  social_links: z.array(z.string().max(500)).max(4).default([]),
  missing_fields: z.array(z.string().max(120)).max(12).default([]),
  follow_up_questions: z.array(followUpQuestionSchema).max(FOLLOW_UP_LIMITS.maxQuestionsPerRound).default([]),
});

export const generatedProfileSchema = z.object({
  applicant: z.object({
    name: z.string().max(200).default(""),
    email: z.string().max(320).default(""),
    category: z.string().max(200).default(""),
    location: z.string().max(200).default(""),
    website: z.string().max(500).default(""),
    description: z.string().max(5000).default(""),
  }),
  profile: z.object({
    name: z.string().max(200).default(""),
    slug: z.string().max(120).default(""),
    category_slug: z.string().max(120).default(""),
    category_pt: z.string().max(200).default(""),
    role_title_pt: z.string().max(500).default(""),
    short_bio_pt: z.string().max(5000).default(""),
    full_about_pt: z.string().max(5000).default(""),
    location: z.string().max(200).default(""),
    remote_or_local: z.enum(["Remote", "Local", "Remote and Local"]).default("Local"),
    languages: z.string().max(500).default(""),
    profile_type_pt: z.string().max(500).default("Profissional independente"),
    service_1_title_pt: z.string().max(500).default(""),
    service_1_description_pt: z.string().max(5000).default(""),
    service_1_delivery: z.enum(["Remote", "Local", "Remote and Local"]).default("Local"),
    service_1_engagement_pt: z.string().max(500).default("Por projeto"),
    service_2_title_pt: z.string().max(500).default(""),
    service_2_description_pt: z.string().max(5000).default(""),
    service_2_delivery: z.enum(["Remote", "Local", "Remote and Local"]).default("Local"),
    service_2_engagement_pt: z.string().max(500).default(""),
    service_3_title_pt: z.string().max(500).default(""),
    service_3_description_pt: z.string().max(5000).default(""),
    service_3_delivery: z.enum(["Remote", "Local", "Remote and Local"]).default("Local"),
    service_3_engagement_pt: z.string().max(500).default(""),
    experience_years: z.string().max(120).default(""),
    client_focus_pt: z.string().max(500).default(""),
    experience_summary_pt: z.string().max(5000).default(""),
    portfolio_1_title_pt: z.string().max(500).default(""),
    portfolio_1_description_pt: z.string().max(5000).default(""),
    portfolio_1_url: z.string().max(2000).default(""),
    portfolio_2_title_pt: z.string().max(500).default(""),
    portfolio_2_description_pt: z.string().max(5000).default(""),
    portfolio_2_url: z.string().max(2000).default(""),
    portfolio_3_title_pt: z.string().max(500).default(""),
    portfolio_3_description_pt: z.string().max(5000).default(""),
    portfolio_3_url: z.string().max(2000).default(""),
    email: z.string().max(320).default(""),
    website: z.string().max(500).default(""),
    website_label: z.string().max(500).default(""),
    social_link: z.string().max(500).default(""),
    social_label: z.string().max(120).default(""),
    verified: z.literal(false).default(false),
    featured: z.literal(false).default(false),
    founder_professional: z.literal(false).default(false),
  }),
});

export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    profession: { type: "string" },
    suggested_category_slug: { type: "string" },
    experience_years: { type: "string" },
    location: { type: "string" },
    delivery_modes: { type: "array", items: { type: "string" } },
    languages: { type: "array", items: { type: "string" } },
    client_focus: { type: "string" },
    credentials: { type: "array", items: { type: "string" } },
    services: { type: "array", items: { type: "string" } },
    portfolio_facts: { type: "array", items: { type: "string" } },
    website: { type: "string" },
    social_links: { type: "array", items: { type: "string" } },
    missing_fields: { type: "array", items: { type: "string" } },
    follow_up_questions: {
      type: "array",
      maxItems: FOLLOW_UP_LIMITS.maxQuestionsPerRound,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          type: { type: "string", enum: ["text", "single_choice", "multi_choice"] },
          required: { type: "boolean" },
          options: { type: "array", items: { type: "string" } },
        },
        required: ["id", "question", "type", "required", "options"],
      },
    },
  },
  required: [
    "profession",
    "suggested_category_slug",
    "experience_years",
    "location",
    "delivery_modes",
    "languages",
    "client_focus",
    "credentials",
    "services",
    "portfolio_facts",
    "website",
    "social_links",
    "missing_fields",
    "follow_up_questions",
  ],
};

const profileProperties = Object.fromEntries(
  Object.entries(generatedProfileSchema.shape.profile.shape).map(([key, schema]) => {
    if (key === "verified" || key === "featured" || key === "founder_professional") {
      return [key, { type: "boolean", enum: [false] }];
    }
    if (key.endsWith("_delivery") || key === "remote_or_local") {
      return [key, { type: "string", enum: ["Remote", "Local", "Remote and Local"] }];
    }
    return [key, { type: "string" }];
  }),
);

export const generatedProfileJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    applicant: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        category: { type: "string" },
        location: { type: "string" },
        website: { type: "string" },
        description: { type: "string" },
      },
      required: ["name", "email", "category", "location", "website", "description"],
    },
    profile: {
      type: "object",
      additionalProperties: false,
      properties: profileProperties,
      required: Object.keys(profileProperties),
    },
  },
  required: ["applicant", "profile"],
};
