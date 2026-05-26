export function getRequestOrigin(request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (!host) {
    return "";
  }

  return `${forwardedProto || "https"}://${host}`;
}

export function getSiteUrl(request) {
  const configured = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  return getRequestOrigin(request).replace(/\/$/, "");
}

