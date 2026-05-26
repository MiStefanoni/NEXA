import { getApplicationInviteByToken } from "../../../../../lib/admin-store";
import { jsonResponse, sanitizeText } from "../../../../../lib/server-utils";

export async function GET(request) {
  const url = new URL(request.url);
  const token = sanitizeText(url.searchParams.get("token"), 500);

  if (!token) {
    return jsonResponse({ valid: false, error: "Token ausente." }, { status: 400 });
  }

  const invite = await getApplicationInviteByToken(token);
  if (!invite || invite.status !== "pending" || new Date(invite.expires_at).getTime() <= Date.now()) {
    return jsonResponse({ valid: false }, { status: 200 });
  }

  return jsonResponse(
    {
      valid: true,
      email: invite.email,
      name: invite.name,
      expires_at: invite.expires_at,
    },
    { status: 200 },
  );
}
