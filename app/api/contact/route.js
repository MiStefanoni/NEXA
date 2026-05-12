import { getProfessionals } from "../../../lib/nexa-server";
import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";

const DEFAULT_MAILGUN_API_BASE_URL = "https://api.mailgun.net";

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

async function sendViaMailgun({ professional, name, email, phone, message, professionalSlug }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBaseUrl = getMailgunApiBaseUrl(process.env.MAILGUN_API_BASE_URL);
  const sender = getMailgunSender(domain);

  if (!apiKey || !domain) {
    throw new Error("Mailgun environment variables are not configured.");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v3/${domain}/messages`;
  const body = new URLSearchParams({
    from: sender,
    to: professional.email,
    subject: "Nova mensagem via Nexa",
    "h:Reply-To": email,
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

  const credentials = Buffer.from(`api:${apiKey}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Mailgun request failed: ${response.status} ${errorText}`);
    error.debug = { domain, apiBaseUrl, sender, recipient: professional.email };
    throw error;
  }
}

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
    await sendViaMailgun({ professional, name, email, phone, message, professionalSlug });
    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to send email.",
        debug: error.debug || null,
      },
      { status: 500 },
    );
  }
}
