const nodemailer = require("nodemailer");
const addressparser = require("nodemailer/lib/addressparser");

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

function parseAddressList(value) {
  return addressparser(String(value || "").trim())
    .map((entry) => ({
      name: String(entry.name || "").trim(),
      address: String(entry.address || "").trim(),
    }))
    .filter((entry) => isEmailLike(entry.address));
}

function normalizeAddress(value, fallbackName = "") {
  const [entry] = parseAddressList(value);

  if (!entry) {
    return "";
  }

  return entry.name || fallbackName ? `${entry.name || fallbackName} <${entry.address}>` : entry.address;
}

function normalizeAddressList(value) {
  return parseAddressList(value).map((entry) => (entry.name ? `${entry.name} <${entry.address}>` : entry.address));
}

function getAddressOnly(value) {
  const [entry] = parseAddressList(value);
  return entry?.address || "";
}

function safeDomain(value) {
  const address = getAddressOnly(value);
  return address.includes("@") ? address.split("@").pop() : "";
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
  const envelopeFrom = getAddressOnly(user);
  const from =
    normalizeAddress(process.env.EMAIL_FROM, DEFAULT_FROM_NAME) ||
    (envelopeFrom ? `${DEFAULT_FROM_NAME} <${envelopeFrom}>` : "");

  if (!envelopeFrom) {
    throw new Error("SMTP_USER must be a valid email address.");
  }

  if (!from) {
    throw new Error("EMAIL_FROM must be a valid email address.");
  }

  return {
    service: service || null,
    host: host || null,
    port: port || (secure ? 465 : 587),
    secure,
    user,
    pass,
    from,
    envelopeFrom,
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
  const { from, envelopeFrom } = getEmailConfig();
  const normalizedTo = normalizeAddressList(to);
  const normalizedReplyTo = normalizeAddress(replyTo);

  if (!normalizedTo.length) {
    throw new Error("Email recipient is not a valid email address.");
  }

  return transporter.sendMail({
    from,
    to: normalizedTo,
    subject,
    text,
    replyTo: normalizedReplyTo || undefined,
    envelope: {
      from: envelopeFrom,
      to: normalizedTo.map(getAddressOnly),
    },
  });
}

function getEmailDebugInfo(extra = {}) {
  let config = {};

  try {
    config = getEmailConfig();
  } catch (error) {
    return {
      provider: "nodemailer",
      configured: false,
      error: error.message,
      ...extra,
    };
  }

  return {
    provider: "nodemailer",
    configured: true,
    service: config.service,
    host: config.host ? "set" : null,
    port: config.port,
    secure: config.secure,
    fromDomain: safeDomain(config.from),
    ...extra,
  };
}

module.exports = {
  getEmailDebugInfo,
  sendEmail,
};
