import { createInviteApplicationDraft, getCategoryFieldsFromSlug, hydrateProfileDraft, sanitizeProfileDraft } from "../../../../lib/admin-profile";
import {
  getAiProfileSessionForInvite,
  getValidPendingInviteForAi,
  updateAiProfileSession,
} from "../../../../lib/admin-store";
import { generateProfileDraft, getGeminiFriendlyError } from "../../../../lib/ai/gemini";
import { FOLLOW_UP_LIMITS } from "../../../../lib/ai/profile-schemas";
import { jsonResponse, sanitizeText } from "../../../../lib/server-utils";

function buildSafeProfile(invite, generated) {
  const base = createInviteApplicationDraft({ name: invite.name || "", email: invite.email || "" });
  const profile = sanitizeProfileDraft({
    ...base.profile,
    ...(generated?.profile || {}),
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
    profile: hydrateProfileDraft({ ...profile, ...category, verified: false, featured: false, founder_professional: false }),
    admin_notes: "",
  };
}

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const token = sanitizeText(rawBody.token, 500);
  const sessionId = sanitizeText(rawBody.sessionId, 120);
  const locale = sanitizeText(rawBody.locale, 20) || "pt";

  if (!token || !sessionId) {
    return jsonResponse({ success: false, error: "Sessão inválida." }, { status: 400 });
  }

  try {
    const invite = await getValidPendingInviteForAi(token);
    const session = await getAiProfileSessionForInvite({ sessionId, invite });
    if (session.generation_count >= FOLLOW_UP_LIMITS.maxGenerations) {
      return jsonResponse({ success: false, error: "Limite de versões atingido." }, { status: 400 });
    }

    const generated = await generateProfileDraft({
      invite,
      facts: session.extracted_facts,
      conversation: session.conversation_data,
      currentDraft: session.generated_profile,
      locale,
    });
    const record = buildSafeProfile(invite, generated);
    const updated = await updateAiProfileSession(session.id, {
      generatedProfile: record,
      status: "ready_for_review",
      generationCount: session.generation_count + 1,
    });

    return jsonResponse({ success: true, state: "ready_for_review", session: updated, record }, { status: 200 });
  } catch (error) {
    const inviteErrors = ["Este link não está mais disponível.", "Convite inválido.", "Sessão não encontrada."];
    return jsonResponse(
      { success: false, error: inviteErrors.includes(error.message) ? error.message : getGeminiFriendlyError() },
      { status: inviteErrors.includes(error.message) ? 400 : 503 },
    );
  }
}
