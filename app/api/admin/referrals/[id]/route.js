import { requireAdminApiSession } from "../../../../../lib/admin-auth";
import { updateReferralPartnerStatus } from "../../../../../lib/admin-store";
import { jsonResponse } from "../../../../../lib/server-utils";
import { getSiteUrl } from "../../../../../lib/site-url";

function withReferralUrl(request, partner) {
  return {
    ...partner,
    applicationUrl: `${getSiteUrl(request)}/pt/apply?ref=${encodeURIComponent(partner.code)}`,
  };
}

export async function PATCH(request, { params }) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));

  try {
    const referral = await updateReferralPartnerStatus(params.id, {
      active: Boolean(rawBody.active),
    });
    return jsonResponse({ success: true, referral: withReferralUrl(request, referral) }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Não foi possível atualizar o link." }, { status: 400 });
  }
}
