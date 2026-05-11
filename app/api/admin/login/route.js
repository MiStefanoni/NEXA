import { cookies } from "next/headers";
import { setAdminSessionCookie, verifyAdminPassword } from "../../../../lib/admin-auth";
import { jsonResponse, sanitizeText } from "../../../../lib/server-utils";

export async function POST(request) {
  const rawBody = await request.json().catch(() => ({}));
  const password = sanitizeText(rawBody.password, 200);

  if (!password) {
    return jsonResponse({ success: false, error: "Senha é obrigatória." }, { status: 400 });
  }

  try {
    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return jsonResponse({ success: false, error: "Senha inválida." }, { status: 401 });
    }

    setAdminSessionCookie(cookies());
    return jsonResponse({ success: true }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Falha de autenticação." }, { status: 500 });
  }
}
