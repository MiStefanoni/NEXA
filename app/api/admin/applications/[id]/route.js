import { requireAdminApiSession } from "../../../../../lib/admin-auth";
import { getApplicationRecord, updateApplicationRecord } from "../../../../../lib/admin-store";
import { jsonResponse } from "../../../../../lib/server-utils";

function parseId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export async function GET(request, { params }) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const id = parseId(params.id);
  if (!id) {
    return jsonResponse({ success: false, error: "Invalid application id." }, { status: 400 });
  }

  const record = await getApplicationRecord(id);
  if (!record) {
    return jsonResponse({ success: false, error: "Application not found." }, { status: 404 });
  }

  return jsonResponse({ success: true, record }, { status: 200 });
}

export async function PATCH(request, { params }) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const id = parseId(params.id);
  if (!id) {
    return jsonResponse({ success: false, error: "Invalid application id." }, { status: 400 });
  }

  const rawBody = await request.json().catch(() => ({}));

  try {
    const record = await updateApplicationRecord(id, {
      adminNotes: rawBody.admin_notes,
      profile: rawBody.profile,
      applicant: rawBody.applicant,
      status: rawBody.status,
    });
    return jsonResponse({ success: true, record }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Failed to update application." }, { status: 400 });
  }
}
