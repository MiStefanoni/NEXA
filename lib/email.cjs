const nodemailer = require("nodemailer");

const DEFAULT_FROM_NAME = "Nexa";

let cachedTransporter;
let cachedConfigKey;

function parseBoolean(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePort(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function getEmailConfig() {
  const service = String(process.env.SMTP_SERVICE || "").trim();
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = parsePort(process.env.SMTP_PORT);
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();

  if (!service && !host) {
    throw new Error("SMTP configuration is missing. Set SMTP_SERVICE or SMTP_HOST.");
  }

  if (!user || !pass) {
    throw new Error("SMTP credentials are not configured.");
  }

  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const from =
    String(process.env.EMAIL_FROM || "").trim() ||
    (isEmailLike(user) ? `${DEFAULT_FROM_NAME} <${user}>` : user);

  return {
    service: service || null,
    host: host || null,
    port: port || (secure ? 465 : 587),
    secure,
    user,
    pass,
    from,
  };
}

function getTransporter() {
  const config = getEmailConfig();
  const configKey = JSON.stringify(config);

  if (cachedTransporter && cachedConfigKey === configKey) {
    return cachedTransporter;
  }

  const transportOptions = {
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };

  if (config.service) {
    transportOptions.service = config.service;
  } else {
    transportOptions.host = config.host;
  }

  cachedTransporter = nodemailer.createTransport(transportOptions);
  cachedConfigKey = configKey;
  return cachedTransporter;
}

async function sendEmail({ to, subject, text, replyTo }) {
  const transporter = getTransporter();
  const { from } = getEmailConfig();

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    replyTo: replyTo || undefined,
  });
}

function getEmailDebugInfo(extra = {}) {
  const config = getEmailConfig();

  return {
    provider: "nodemailer",
    service: config.service,
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from,
    ...extra,
  };
}

module.exports = {
  getEmailDebugInfo,
  sendEmail,
};
