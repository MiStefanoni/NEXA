import { jsonResponse, isValidEmail, sanitizeText } from "../../../lib/server-utils";

const DEFAULT_MAILGUN_API_BASE_URL = "https://api.mailgun.net";
const APPLICATION_RECIPIENT = "mifstefanoni@gmail.com";

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

async function sendViaMailgun({ name, email, category, location, website, description, source }) {
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
  body.set("to", APPLICATION_RECIPIENT);
  body.set("subject", "Nova candidatura via Nexa");
  body.set("h:Reply-To", email);
  body.set(
    "text",
    [
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
    const error = new Error(`Mailgun request failed: ${response.status} ${errorText}`);
    error.debug = { domain, apiBaseUrl, sender, recipient: APPLICATION_RECIPIENT };
    throw error;
  }
}

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
    await sendViaMailgun({ name, email, category, location, website, description, source });
    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to send application.",
        debug: error.debug || null,
      },
      { status: 500 },
    );
  }
}
