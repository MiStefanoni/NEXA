import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "nexa_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createAdminSessionValue() {
  const payload = {
    role: "admin",
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionValue(value) {
  if (!value || !value.includes(".")) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature || "");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encoded));
    if (payload.role !== "admin" || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (_) {
    return null;
  }
}

export async function verifyAdminPassword(password) {
  const candidate = String(password || "");
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  const plain = process.env.ADMIN_PASSWORD || "";

  if (hash) {
    return bcrypt.compare(candidate, hash);
  }

  if (plain) {
    const candidateBuffer = Buffer.from(candidate);
    const plainBuffer = Buffer.from(plain);
    if (candidateBuffer.length !== plainBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuffer, plainBuffer);
  }

  throw new Error("ADMIN_PASSWORD_HASH or ADMIN_PASSWORD must be configured.");
}

export function setAdminSessionCookie(cookieStore) {
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearAdminSessionCookie(cookieStore) {
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getAdminSessionFromRequest(request) {
  return verifyAdminSessionValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function getAdminSessionFromCookies() {
  return verifyAdminSessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

export function requireAdminPageSession() {
  if (!getAdminSessionFromCookies()) {
    redirect("/admin/login");
  }
}

export function requireAdminApiSession(request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return null;
  }

  return session;
}

export function redirectIfAdminAuthenticated() {
  if (getAdminSessionFromCookies()) {
    redirect("/admin");
  }
}
