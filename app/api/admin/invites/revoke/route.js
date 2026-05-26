import { requireAdminApiSession } from "../../../../../lib/admin-auth";
import { revokeApplicationInvite } from "../../../../../lib/admin-store";
import { jsonResponse, sanitizeText } from "../../../../../lib/server-utils";

export async function POST(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const inviteId = sanitizeText(rawBody.inviteId, 120);

  if (!inviteId) {
    return jsonResponse({ success: false, error: "Invite id is required." }, { status: 400 });
  }

  try {
    const invite = await revokeApplicationInvite(inviteId);
    if (!invite) {
      return jsonResponse({ success: false, error: "Invite not found or cannot be revoked." }, { status: 404 });
    }

    return jsonResponse({ success: true, invite }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Failed to revoke invite." }, { status: 400 });
  }
}
