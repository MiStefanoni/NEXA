import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { createReferralPartner, listReferralPartners } from "../../../../lib/admin-store";
import { isValidEmail, jsonResponse } from "../../../../lib/server-utils";
import { getSiteUrl } from "../../../../lib/site-url";

function buildReferralUrl(request, code) {
  return `${getSiteUrl(request)}/pt/apply?ref=${encodeURIComponent(code)}`;
}

function withReferralUrl(request, partner) {
  return {
    ...partner,
    applicationUrl: buildReferralUrl(request, partner.code),
  };
}

export async function GET(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const referrals = await listReferralPartners();
    return jsonResponse(
      { success: true, referrals: referrals.map((partner) => withReferralUrl(request, partner)) },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Failed to load referrals." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));

  if (!isValidEmail(rawBody.email)) {
    return jsonResponse({ success: false, error: "Email inválido." }, { status: 400 });
  }

  try {
    const referral = await createReferralPartner(rawBody);
    return jsonResponse({ success: true, referral: withReferralUrl(request, referral) }, { status: 201 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Não foi possível gerar o link." }, { status: 400 });
  }
}
