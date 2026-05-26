import { CATEGORY_META } from "./nexa-data";
import { sanitizeText } from "./server-utils";

const CATEGORY_TITLE_TO_SLUG = Object.entries(CATEGORY_META).reduce((accumulator, [slug, value]) => {
  accumulator.set(String(value.pt.title || "").toLowerCase(), slug);
  accumulator.set(String(value.en.title || "").toLowerCase(), slug);
  return accumulator;
}, new Map());

export const PROFILE_FIELD_DEFAULTS = {
  name: "",
  slug: "",
  category_slug: "",
  category_pt: "",
  category_en: "",
  role_title_pt: "",
  role_title_en: "",
  short_bio_pt: "",
  short_bio_en: "",
  full_about_pt: "",
  full_about_en: "",
  location: "",
  remote_or_local: "Local",
  languages: "",
  profile_type_pt: "",
  profile_type_en: "",
  verified: false,
  featured: false,
  founder_professional: false,
  service_1_title_pt: "",
  service_1_title_en: "",
  service_1_description_pt: "",
  service_1_description_en: "",
  service_1_delivery: "Local",
  service_1_engagement_pt: "",
  service_1_engagement_en: "",
  service_2_title_pt: "",
  service_2_title_en: "",
  service_2_description_pt: "",
  service_2_description_en: "",
  service_2_delivery: "Local",
  service_2_engagement_pt: "",
  service_2_engagement_en: "",
  service_3_title_pt: "",
  service_3_title_en: "",
  service_3_description_pt: "",
  service_3_description_en: "",
  service_3_delivery: "Local",
  service_3_engagement_pt: "",
  service_3_engagement_en: "",
  experience_years: "",
  client_focus_pt: "",
  client_focus_en: "",
  projects_delivered: "",
  experience_summary_pt: "",
  experience_summary_en: "",
  portfolio_1_title_pt: "",
  portfolio_1_title_en: "",
  portfolio_1_description_pt: "",
  portfolio_1_description_en: "",
  portfolio_1_url: "",
  portfolio_2_title_pt: "",
  portfolio_2_title_en: "",
  portfolio_2_description_pt: "",
  portfolio_2_description_en: "",
  portfolio_2_url: "",
  portfolio_3_title_pt: "",
  portfolio_3_title_en: "",
  portfolio_3_description_pt: "",
  portfolio_3_description_en: "",
  portfolio_3_url: "",
  email: "",
  website: "",
  website_label: "",
  social_link: "",
  social_label: "",
  safety_note_pt: "",
  safety_note_en: "",
  profile_image: "",
};

export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function buildProfileSlugFromName(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return slugify(parts.join("-"));
}

export function getCategorySlugFromLabel(value) {
  return CATEGORY_TITLE_TO_SLUG.get(String(value || "").trim().toLowerCase()) || "";
}

export function getCategoryFieldsFromSlug(slug) {
  const meta = CATEGORY_META[slug];
  return {
    category_pt: meta?.pt?.title || "",
    category_en: meta?.en?.title || "",
  };
}

export function normalizeBooleanInput(value) {
  return value === true || String(value).toLowerCase() === "true" || value === "on";
}

export function buildProfileDraftFromApplication(application) {
  const categorySlug = getCategorySlugFromLabel(application.category) || "";
  const categoryFields = getCategoryFieldsFromSlug(categorySlug);
  const name = sanitizeText(application.name, 200);
  const description = sanitizeText(application.description, 5000);
  const website = sanitizeText(application.website, 500);

  return {
    ...PROFILE_FIELD_DEFAULTS,
    ...categoryFields,
    name,
    slug: buildProfileSlugFromName(name),
    category_slug: categorySlug,
    short_bio_pt: description,
    full_about_pt: description,
    location: sanitizeText(application.location, 200),
    profile_type_pt: "Profissional independente",
    remote_or_local: String(application.location || "").toLowerCase().includes("remote") ? "Remote" : "Local",
    service_1_title_pt: sanitizeText(application.category, 200),
    service_1_description_pt: description,
    service_1_engagement_pt: "Por projeto",
    service_2_engagement_pt: "Por projeto",
    service_3_engagement_pt: "Por projeto",
    email: sanitizeText(application.email, 320),
    website,
    website_label: website.replace(/^https?:\/\//, ""),
    safety_note_pt:
      "A Nexa não oferece mensagens diretas abertas. O contato com clientes acontece por caminhos estruturados para apoiar mais clareza, profissionalismo e segurança nas interações.",
  };
}

export function createInviteApplicationDraft({ name = "", email = "" } = {}) {
  const safeName = sanitizeText(name, 200);
  const safeEmail = sanitizeText(email, 320);

  return {
    applicant: {
      name: safeName,
      email: safeEmail,
      category: "",
      location: "",
      website: "",
      description: "",
    },
    profile: hydrateProfileDraft({
      name: safeName,
      slug: buildProfileSlugFromName(safeName),
      email: safeEmail,
    }),
    admin_notes: "",
  };
}

export function hydrateProfileDraft(value) {
  return {
    ...PROFILE_FIELD_DEFAULTS,
    ...(value || {}),
    verified: normalizeBooleanInput(value?.verified),
    featured: normalizeBooleanInput(value?.featured),
    founder_professional: normalizeBooleanInput(value?.founder_professional),
  };
}

export function sanitizeProfileDraft(raw) {
  const draft = hydrateProfileDraft(raw);
  const output = {};

  for (const [key, defaultValue] of Object.entries(PROFILE_FIELD_DEFAULTS)) {
    if (typeof defaultValue === "boolean") {
      output[key] = normalizeBooleanInput(draft[key]);
      continue;
    }

    const maxLength =
      key === "profile_image"
        ? 2_000_000
        : key.endsWith("_url")
          ? 2000
        : key.includes("description") || key.includes("about") || key.includes("note")
          ? 5000
          : 500;

    output[key] = sanitizeText(draft[key], maxLength);
  }

  const categorySlug = sanitizeText(draft.category_slug, 120);
  const normalizedSlug =
    sanitizeText(draft.slug || buildProfileSlugFromName(draft.name), 120) || buildProfileSlugFromName(draft.name);
  const categoryFields = getCategoryFieldsFromSlug(categorySlug);

  output.slug = normalizedSlug;
  output.category_slug = categorySlug;
  output.category_pt = categoryFields.category_pt || output.category_pt;
  output.category_en = categoryFields.category_en || output.category_en;
  output.verified = normalizeBooleanInput(draft.verified);
  output.featured = normalizeBooleanInput(draft.featured);
  output.founder_professional = normalizeBooleanInput(draft.founder_professional);

  return output;
}
