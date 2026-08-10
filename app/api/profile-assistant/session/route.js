import { getAiProfileSessionForInvite, getValidPendingInviteForAi } from "../../../../lib/admin-store";
import { jsonResponse, sanitizeText } from "../../../../lib/server-utils";

export async function GET(request) {
  const url = new URL(request.url);
  const token = sanitizeText(url.searchParams.get("token"), 500);
  const sessionId = sanitizeText(url.searchParams.get("sessionId"), 120);

  if (!token || !sessionId) {
    return jsonResponse({ success: false, error: "Sessão inválida." }, { status: 400 });
  }

  try {
    const invite = await getValidPendingInviteForAi(token);
    const session = await getAiProfileSessionForInvite({ sessionId, invite });
    return jsonResponse({ success: true, session }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Sessão não encontrada." }, { status: 400 });
  }
}
