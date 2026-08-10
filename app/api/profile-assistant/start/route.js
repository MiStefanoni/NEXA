import { createInviteApplicationDraft, getCategoryFieldsFromSlug, hydrateProfileDraft, sanitizeProfileDraft } from "../../../../lib/admin-profile";
import {
  createAiProfileSession,
  getValidPendingInviteForAi,
  updateAiProfileSession,
} from "../../../../lib/admin-store";
import { extractProfileFacts, generateProfileDraft, getGeminiFriendlyError } from "../../../../lib/ai/gemini";
import { FOLLOW_UP_LIMITS } from "../../../../lib/ai/profile-schemas";
import { jsonResponse, sanitizeText } from "../../../../lib/server-utils";

async function validateTurnstileIfConfigured(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  return Boolean(result.success);
}

function buildSafeProfile(invite, generated) {
  const base = createInviteApplicationDraft({ name: invite.name || "", email: invite.email || "" });
  const profile = sanitizeProfileDraft({
    ...base.profile,
    ...(generated?.profile || {}),
    name: sanitizeText(generated?.profile?.name || base.profile.name, 200),
    email: invite.email,
    verified: false,
    featured: false,
    founder_professional: false,
  });
  const category = getCategoryFieldsFromSlug(profile.category_slug);

  return {
    applicant: {
      ...base.applicant,
      ...(generated?.applicant || {}),
      name: sanitizeText(generated?.applicant?.name || base.applicant.name, 200),
      email: invite.email,
      category: category.category_pt || sanitizeText(generated?.applicant?.category, 200),
      location: sanitizeText(generated?.applicant?.location || profile.location, 200),
      website: sanitizeText(generated?.applicant?.website || profile.website, 500),
      description: sanitizeText(generated?.applicant?.description || profile.short_bio_pt, 5000),
    },
    profile: hydrateProfileDraft({
      ...profile,
      ...category,
      verified: false,
      featured: false,
      founder_professional: false,
    }),
    admin_notes: "",
  };
}

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const token = sanitizeText(rawBody.token, 500);
  const locale = sanitizeText(rawBody.locale, 20) || "pt";
  const initialDescription = sanitizeText(rawBody.initialDescription, FOLLOW_UP_LIMITS.maxInitialDescriptionLength);
  const turnstileToken = sanitizeText(rawBody.turnstileToken, 5000);

  if (!token || !initialDescription) {
    return jsonResponse({ success: false, error: "Token e descrição são obrigatórios." }, { status: 400 });
  }

  let session;
  try {
    const invite = await getValidPendingInviteForAi(token);
    const turnstileValid = await validateTurnstileIfConfigured(turnstileToken);
    if (!turnstileValid) {
      return jsonResponse({ success: false, error: "Não foi possível validar a proteção de segurança." }, { status: 400 });
    }

    session = await createAiProfileSession({ invite, initialDescription });
    const facts = await extractProfileFacts({ initialDescription, locale });
    const questions = (facts.follow_up_questions || []).slice(0, FOLLOW_UP_LIMITS.maxQuestionsPerRound);

    if (questions.length) {
      const updated = await updateAiProfileSession(session.id, {
        extractedFacts: facts,
        status: "questions_pending",
        questionRound: 1,
      });
      return jsonResponse({ success: true, state: "questions_pending", session: updated, questions }, { status: 200 });
    }

    const generated = await generateProfileDraft({
      invite,
      facts,
      conversation: [],
      currentDraft: {},
      locale,
    });
    const record = buildSafeProfile(invite, generated);
    const updated = await updateAiProfileSession(session.id, {
      extractedFacts: facts,
      generatedProfile: record,
      status: "ready_for_review",
      generationCount: 1,
    });
    return jsonResponse({ success: true, state: "ready_for_review", session: updated, record }, { status: 200 });
  } catch (error) {
    if (session?.id) {
      await updateAiProfileSession(session.id, { status: "draft" }).catch(() => {});
    }
    const inviteErrors = ["Este link não está mais disponível.", "Convite inválido."];
    return jsonResponse(
      { success: false, error: inviteErrors.includes(error.message) ? error.message : getGeminiFriendlyError(), sessionId: session?.id || "" },
      { status: inviteErrors.includes(error.message) ? 400 : 503 },
    );
  }
}
