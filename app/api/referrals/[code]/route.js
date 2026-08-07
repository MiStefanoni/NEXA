import { findReferralPartnerByCode, normalizeReferralCode, recordReferralEvent } from "../../../../lib/admin-store";
import { jsonResponse } from "../../../../lib/server-utils";

export async function GET(_request, { params }) {
  const code = normalizeReferralCode(params.code);

  if (!code) {
    return jsonResponse({ valid: false }, { status: 200 });
  }

  try {
    const referral = await findReferralPartnerByCode(code, { activeOnly: true });

    if (!referral) {
      return jsonResponse({ valid: false }, { status: 200 });
    }

    await recordReferralEvent({
      referralPartnerId: referral.id,
      referralCode: referral.code,
      eventType: "link_visit",
    }).catch(() => {});

    return jsonResponse(
      {
        valid: true,
        name: referral.name,
        code: referral.code,
      },
      { status: 200 },
    );
  } catch (_error) {
    return jsonResponse({ valid: false }, { status: 200 });
  }
}
