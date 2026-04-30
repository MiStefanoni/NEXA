const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data", "professionals.json");
const DEFAULT_MAILGUN_API_BASE_URL = "https://api.mailgun.net";

function readProfessionals() {
  const file = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(file);
}

function sanitizeText(value, maxLength = 4000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function sendViaMailgun({
  professional,
  name,
  email,
  phone,
  message,
  professionalSlug,
}) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBaseUrl = process.env.MAILGUN_API_BASE_URL || DEFAULT_MAILGUN_API_BASE_URL;

  if (!apiKey || !domain) {
    throw new Error("Mailgun environment variables are not configured.");
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/v3/${domain}/messages`;
  const body = new URLSearchParams({
    from: `Nexa <no-reply@${domain}>`,
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
    throw new Error(`Mailgun request failed: ${response.status} ${errorText}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { success: false, error: "Method not allowed." });
  }

  // Future hardening:
  // add CAPTCHA verification and rate limiting before processing the request body.
  const rawBody =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  const name = sanitizeText(rawBody.name, 200);
  const email = sanitizeText(rawBody.email, 320);
  const phone = sanitizeText(rawBody.phone, 80);
  const message = sanitizeText(rawBody.message, 5000);
  const professionalSlug = sanitizeText(rawBody.professionalSlug, 120);

  if (!name || !email || !message || !professionalSlug) {
    return json(res, 400, {
      success: false,
      error: "Missing required fields: name, email, message, professionalSlug.",
    });
  }

  if (!isValidEmail(email)) {
    return json(res, 400, { success: false, error: "Invalid email." });
  }

  let professional;
  try {
    const professionals = readProfessionals();
    professional = professionals.find((item) => item.slug === professionalSlug);
  } catch (error) {
    console.error("Failed to read professionals data", error);
    return json(res, 500, { success: false, error: "Failed to load professional data." });
  }

  if (!professional || !isValidEmail(professional.email)) {
    return json(res, 404, { success: false, error: "Professional not found." });
  }

  try {
    await sendViaMailgun({
      professional,
      name,
      email,
      phone,
      message,
      professionalSlug,
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error("Contact send failed", error);
    return json(res, 500, { success: false, error: "Failed to send email." });
  }
};
