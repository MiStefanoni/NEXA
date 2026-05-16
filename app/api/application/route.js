import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";
import { createPendingApplicationRecord } from "../../../lib/admin-store";
import emailUtils from "../../../lib/email.cjs";

const APPLICATION_RECIPIENT =
  process.env.APPLICATION_RECIPIENT || "mifstefanoni@gmail.com";
const { getEmailDebugInfo, sendEmail } = emailUtils;

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const name = sanitizeText(rawBody.name, 200);
  const email = sanitizeText(rawBody.email, 320);
  const category = sanitizeText(rawBody.category, 200);
  const location = sanitizeText(rawBody.location, 200);
  const website = sanitizeText(rawBody.website, 500);
  const description = sanitizeText(rawBody.description, 5000);
  const source = sanitizeText(rawBody.source, 120);

  if (!name || !email || !category || !description) {
    return jsonResponse(
      { success: false, error: "Missing required fields: name, email, category, description." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ success: false, error: "Invalid email." }, { status: 400 });
  }

  try {
    await createPendingApplicationRecord({ name, email, category, location, website, description, source });
    await sendEmail({
      to: APPLICATION_RECIPIENT,
      subject: "Nova candidatura via Nexa",
      replyTo: email,
      text: [
        "Nova candidatura via Nexa",
        "",
        `Nome: ${name}`,
        `Email: ${email}`,
        `Categoria: ${category}`,
        `Localização: ${location || "-"}`,
        `Website: ${website || "-"}`,
        `Origem: ${source || "-"}`,
        "",
        "Descrição:",
        description,
      ].join("\n"),
    });

    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to send application.",
        debug: getEmailDebugInfo({ recipient: APPLICATION_RECIPIENT }),
      },
      { status: 500 },
    );
  }
}
