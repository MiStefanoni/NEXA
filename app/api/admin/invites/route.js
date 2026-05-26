import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { createApplicationInvite, revokeApplicationInvite } from "../../../../lib/admin-store";
import { generateInviteToken } from "../../../../lib/invite-tokens";
import { getSiteUrl } from "../../../../lib/site-url";
import { isValidEmail, jsonResponse, sanitizeText } from "../../../../lib/server-utils";
import emailUtils from "../../../../lib/email.cjs";

const { sendEmail } = emailUtils;

function parseExpiresInDays(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isInteger(parsed)) {
    return 7;
  }

  return Math.min(Math.max(parsed, 1), 30);
}

export async function POST(request) {
  const session = requireAdminApiSession(request);
  if (!session) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const email = sanitizeText(rawBody.email, 320).toLowerCase();
  const name = sanitizeText(rawBody.name, 200);
  const expiresInDays = parseExpiresInDays(rawBody.expiresInDays);

  if (!email) {
    return jsonResponse({ success: false, error: "Email é obrigatório." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ success: false, error: "Email inválido." }, { status: 400 });
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  try {
    const invite = await createApplicationInvite({
      email,
      name,
      token,
      expiresAt,
      createdBy: session.role || "admin",
    });

    const siteUrl = getSiteUrl(request);
    const inviteLink = `${siteUrl}/pt/apply/invite?token=${encodeURIComponent(token)}`;

    try {
      await sendEmail({
        to: email,
        subject: "Convite para preencher seu perfil na Nexa",
        text: [
          `Olá${name ? `, ${name}` : ""}.`,
          "",
          "Você recebeu um convite para preencher seu perfil profissional na Nexa.",
          "Use o link abaixo para completar sua candidatura:",
          inviteLink,
          "",
          `Este link expira em ${new Date(invite.expires_at).toLocaleString("pt-BR")}.`,
          "O link é pessoal e pode ser usado apenas uma vez.",
        ].join("\n"),
      });
    } catch (emailError) {
      await revokeApplicationInvite(invite.id);
      throw new Error(emailError.message || "Não foi possível enviar o email de convite.");
    }

    return jsonResponse({ success: true, inviteId: invite.id }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Falha ao criar convite." }, { status: 500 });
  }
}
