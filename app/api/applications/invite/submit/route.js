import { createPendingApplicationRecordFromInvite } from "../../../../../lib/admin-store";
import { getInviteApplicationValidationErrors } from "../../../../../lib/application-validation";
import { jsonResponse, sanitizeText } from "../../../../../lib/server-utils";

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const token = sanitizeText(rawBody.token, 500);
  const applicant = rawBody.applicant || {};
  const profile = rawBody.profile || {};
  const source = sanitizeText(rawBody.source, 120);
  const aiSessionId = sanitizeText(rawBody.aiSessionId, 120);
  const aiAccuracyConfirmed = Boolean(rawBody.aiAccuracyConfirmed);

  if (!token) {
    return jsonResponse({ success: false, error: "Token inválido." }, { status: 400 });
  }

  const validationErrors = getInviteApplicationValidationErrors({
    applicant,
    profile,
  });

  if (validationErrors.length) {
    return jsonResponse({ success: false, error: validationErrors[0], errors: validationErrors }, { status: 400 });
  }

  if (source === "ai-assisted" && (!aiSessionId || !aiAccuracyConfirmed)) {
    return jsonResponse(
      {
        success: false,
        error: "Confirme que revisou as informações geradas antes de enviar.",
      },
      { status: 400 },
    );
  }

  try {
    const record = await createPendingApplicationRecordFromInvite({
      token,
      applicant,
      profile,
      source: source === "ai-assisted" ? "ai-assisted" : "invite",
      aiSessionId: source === "ai-assisted" ? aiSessionId : "",
    });
    return jsonResponse({ success: true, record }, { status: 200 });
  } catch (error) {
    const message = error.message || "Não foi possível enviar sua candidatura.";
    const status = [
      "Este link não está mais disponível.",
      "Convite inválido.",
      "Sessão de IA inválida.",
      "O email informado não corresponde ao convite.",
      "Este slug já está em uso por outro perfil.",
      "Nome é obrigatório.",
      "Slug é obrigatório.",
      "Categoria é obrigatória.",
      "Título profissional em português é obrigatório.",
      "Resumo em português é obrigatório.",
      "Texto sobre em português é obrigatório.",
      "Email é obrigatório.",
    ].includes(message)
      ? 400
      : 500;
    return jsonResponse({ success: false, error: message }, { status });
  }
}
