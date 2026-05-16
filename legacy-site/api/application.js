const { sendEmail, getEmailDebugInfo } = require("../../lib/email.cjs");

const APPLICATION_RECIPIENT = process.env.APPLICATION_RECIPIENT || "mifstefanoni@gmail.com";

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

    return json(res, 200, { success: true });
  } catch (error) {
    console.error("Application send failed", error);
    return json(res, 500, {
      success: false,
      error: error.message || "Failed to send application.",
      debug: getEmailDebugInfo({ recipient: APPLICATION_RECIPIENT }),
    });
  }
};
