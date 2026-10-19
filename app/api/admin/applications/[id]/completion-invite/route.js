import { requireAdminApiSession } from "../../../../../../lib/admin-auth";
import { createApplicationInvite, getApplicationRecord } from "../../../../../../lib/admin-store";
import { generateInviteToken } from "../../../../../../lib/invite-tokens";
import { getSiteUrl } from "../../../../../../lib/site-url";
import { jsonResponse } from "../../../../../../lib/server-utils";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function POST(request, { params }) {
  const session = requireAdminApiSession(request);
  if (!session) return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });

  const id = parseId(params.id);
  if (!id) return jsonResponse({ success: false, error: "Registro inválido." }, { status: 400 });

  try {
    const application = await getApplicationRecord(id);
    if (!application || application.status !== "approved" || !application.isPublished) {
      return jsonResponse({ success: false, error: "Publique o perfil antes de gerar o link de conclusão." }, { status: 400 });
    }
    if (application.profileUpdate?.status === "pending") {
      return jsonResponse({ success: false, error: "Já existe uma atualização aguardando análise." }, { status: 400 });
    }

    const token = generateInviteToken();
    const invite = await createApplicationInvite({
      email: application.applicant.email,
      name: application.applicant.name || application.profile.name,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: session.role || "admin",
      applicationId: application.id,
    });
    const inviteLink = `${getSiteUrl(request)}/pt/apply/invite?token=${encodeURIComponent(token)}`;
    return jsonResponse({ success: true, inviteId: invite.id, inviteLink }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Não foi possível gerar o link." }, { status: 500 });
  }
}
