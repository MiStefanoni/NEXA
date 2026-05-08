const DEFAULT_MAILGUN_API_BASE_URL = "https://api.mailgun.net";
const APPLICATION_RECIPIENT = "mifstefanoni@gmail.com";

function getMailgunSender(domain) {
  if (String(domain || "").startsWith("sandbox")) {
    return `Mailgun Sandbox <postmaster@${domain}>`;
  }

  return `Nexa <no-reply@${domain}>`;
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
    // Ignore invalid custom values and fall back to the Mailgun default.
  }

  return DEFAULT_MAILGUN_API_BASE_URL;
}

async function sendViaMailgun({ name, email, category, location, website, description, source }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBaseUrl = getMailgunApiBaseUrl(process.env.MAILGUN_API_BASE_URL);
  const sender = getMailgunSender(domain);

  console.log("ronaldo")
  console.log(apiKey)

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
    error.debug = {
      domain,
      apiBaseUrl,
      sender,
      recipient: APPLICATION_RECIPIENT,
    };
    throw error;
  }
}

module.exports = async function handler(req, res) {


  console.log("TEST")
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
  const category = sanitizeText(rawBody.category, 200);
  const location = sanitizeText(rawBody.location, 200);
  const website = sanitizeText(rawBody.website, 500);
  const description = sanitizeText(rawBody.description, 5000);
  const source = sanitizeText(rawBody.source, 120);

  if (!name || !email || !category || !description) {
    return json(res, 400, {
      success: false,
      error: "Missing required fields: name, email, category, description.",
    });
  }

  if (!isValidEmail(email)) {
    return json(res, 400, { success: false, error: "Invalid email." });
  }

  try {
    await sendViaMailgun({
      name,
      email,
      category,
      location,
      website,
      description,
      source,
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error("Application send failed", error);
    return json(res, 500, {
      success: false,
      error: error.message || "Failed to send application.",
      debug: error.debug || null,
    });
  }
};
