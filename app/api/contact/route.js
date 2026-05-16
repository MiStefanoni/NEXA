import { getProfessionals } from "../../../lib/nexa-server";
import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";
import emailUtils from "../../../lib/email.cjs";

const { getEmailDebugInfo, sendEmail } = emailUtils;

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const name = sanitizeText(rawBody.name, 200);
  const email = sanitizeText(rawBody.email, 320);
  const phone = sanitizeText(rawBody.phone, 80);
  const message = sanitizeText(rawBody.message, 5000);
  const professionalSlug = sanitizeText(rawBody.professionalSlug, 120);

  if (!name || !email || !message || !professionalSlug) {
    return jsonResponse(
      { success: false, error: "Missing required fields: name, email, message, professionalSlug." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ success: false, error: "Invalid email." }, { status: 400 });
  }

  const professional = (await getProfessionals()).find((item) => item.slug === professionalSlug);
  if (!professional || !isValidEmail(professional.email)) {
    return jsonResponse({ success: false, error: "Professional not found." }, { status: 404 });
  }

  try {
    await sendEmail({
      to: professional.email,
      subject: "Nova mensagem via Nexa",
      replyTo: email,
      text: [
        "Nova mensagem via Nexa",
        "",
        `Professional name: ${professional.name}`,
        `Professional slug: ${professionalSlug}`,
        "",
        `Nome: ${name}`,
        `Email: ${email}`,
        `Fone: ${phone || "-"}`,
        "",
        "Mensagem:",
        message,
      ].join("\n"),
    });

    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to send email.",
        debug: getEmailDebugInfo({ recipient: professional.email }),
      },
      { status: 500 },
    );
  }
}
