import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";
import emailUtils from "../../../lib/email.cjs";

const WAITLIST_RECIPIENT = process.env.WAITLIST_RECIPIENT || "mifstefanoni@gmail.com";
const { sendEmail } = emailUtils;

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const nome = sanitizeText(rawBody.nome, 200);
  const email = sanitizeText(rawBody.email, 320);
  const profissao = sanitizeText(rawBody.profissao, 200);
  const redeSocial = sanitizeText(rawBody.redeSocial, 200);
  const website = sanitizeText(rawBody.website, 500);

  if (!nome || !email || !profissao) {
    return jsonResponse(
      { success: false, error: "Missing required fields: nome, email, profissao." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ success: false, error: "Invalid email." }, { status: 400 });
  }

  try {
    await sendEmail({
      to: WAITLIST_RECIPIENT,
      subject: "Lista de espera Nexa",
      replyTo: email,
      text: [
        "Nova entrada na lista de espera Nexa",
        "",
        `Nome: ${nome}`,
        `E-mail: ${email}`,
        `Profissão: ${profissao}`,
        `Rede social: ${redeSocial || "-"}`,
        `Website: ${website || "-"}`,
      ].join("\n"),
    });

    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message || "Failed to send waitlist entry." },
      { status: 500 },
    );
  }
}
