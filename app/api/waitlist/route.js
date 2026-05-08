import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";

const DEFAULT_MAILGUN_API_BASE_URL = "https://api.mailgun.net";
const WAITLIST_RECIPIENT = "mifstefanoni@gmail.com";

function getMailgunSender(domain) {
  if (String(domain || "").startsWith("sandbox")) {
    return `Mailgun Sandbox <postmaster@${domain}>`;
  }

  return `Nexa <no-reply@${domain}>`;
}

function getMailgunApiBaseUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate) {
    return DEFAULT_MAILGUN_API_BASE_URL;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch (_) {
    return DEFAULT_MAILGUN_API_BASE_URL;
  }

  return DEFAULT_MAILGUN_API_BASE_URL;
}

async function sendViaMailgun({ nome, email, profissao, redeSocial, website }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBaseUrl = getMailgunApiBaseUrl(process.env.MAILGUN_API_BASE_URL);
  const sender = getMailgunSender(domain);

  if (!apiKey || !domain) {
    throw new Error("Mailgun environment variables are not configured.");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v3/${domain}/messages`;
  const body = new FormData();
  body.set("from", sender);
  body.set("to", WAITLIST_RECIPIENT);
  body.set("subject", "Lista de espera Nexa");
  body.set("h:Reply-To", email);
  body.set(
    "text",
    [
      "Nova entrada na lista de espera Nexa",
      "",
      `Nome: ${nome}`,
      `E-mail: ${email}`,
      `Profissão: ${profissao}`,
      `Rede social: ${redeSocial || "-"}`,
      `Website: ${website || "-"}`,
    ].join("\n"),
  );

  const credentials = Buffer.from(`api:${apiKey}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun request failed: ${response.status} ${errorText}`);
  }
}

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
    await sendViaMailgun({ nome, email, profissao, redeSocial, website });
    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message || "Failed to send waitlist entry." },
      { status: 500 },
    );
  }
}
