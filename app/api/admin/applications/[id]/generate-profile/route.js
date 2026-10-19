import { requireAdminApiSession } from "../../../../../../lib/admin-auth";
import { getApplicationRecord, saveGeneratedBasicProfile } from "../../../../../../lib/admin-store";
import { generateBasicProfileFromApplication, getGeminiFriendlyError } from "../../../../../../lib/ai/gemini";
import { sanitizeProfileDraft } from "../../../../../../lib/admin-profile";
import { jsonResponse } from "../../../../../../lib/server-utils";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function supportedGeneratedFields(currentProfile, generatedProfile) {
  const draft = { ...currentProfile };
  const allowedFields = [
    "role_title_pt",
    "short_bio_pt",
    "full_about_pt",
    "client_focus_pt",
    "experience_years",
    "experience_summary_pt",
    "languages",
    "service_1_title_pt",
    "service_1_description_pt",
    "service_1_delivery",
    "service_1_engagement_pt",
    "service_2_title_pt",
    "service_2_description_pt",
    "service_2_delivery",
    "service_2_engagement_pt",
    "service_3_title_pt",
    "service_3_description_pt",
    "service_3_delivery",
    "service_3_engagement_pt",
  ];

  for (const key of allowedFields) {
    draft[key] = String(generatedProfile?.[key] || "").trim();
  }
  return sanitizeProfileDraft(draft);
}

export async function POST(request, { params }) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const id = parseId(params.id);
  if (!id) return jsonResponse({ success: false, error: "Registro inválido." }, { status: 400 });

  try {
    const application = await getApplicationRecord(id);
    if (!application) return jsonResponse({ success: false, error: "Registro não encontrado." }, { status: 404 });
    if (!["pending", "approved"].includes(application.status) || !application.profile.verified || application.isPublished) {
      return jsonResponse(
        { success: false, error: "A candidatura precisa estar pendente ou aprovada, verificada e ainda não publicada." },
        { status: 400 },
      );
    }
    if (!application.applicant.description) {
      return jsonResponse({ success: false, error: "A descrição profissional inicial é obrigatória." }, { status: 400 });
    }

    const generated = await generateBasicProfileFromApplication({ application, locale: "pt" });
    const profile = supportedGeneratedFields(application.profile, generated.profile);
    const record = await saveGeneratedBasicProfile(id, profile);
    return jsonResponse({ success: true, record }, { status: 200 });
  } catch (error) {
    console.error("Admin AI profile generation failed:", error);
    const known = [
      "A candidatura precisa estar pendente ou aprovada, verificada e ainda não publicada.",
      "A descrição profissional inicial é obrigatória.",
      "Nome é obrigatório.",
      "Slug é obrigatório.",
      "Categoria é obrigatória.",
      "Título profissional em português é obrigatório.",
      "Resumo em português é obrigatório.",
      "Texto sobre em português é obrigatório.",
      "Email é obrigatório.",
    ];
    return jsonResponse(
      { success: false, error: known.includes(error.message) ? error.message : getGeminiFriendlyError() },
      { status: known.includes(error.message) ? 400 : 503 },
    );
  }
}
