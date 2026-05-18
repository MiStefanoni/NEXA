import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { createAdminDraftRecord, deleteRejectedApplicationRecords } from "../../../../lib/admin-store";
import { jsonResponse } from "../../../../lib/server-utils";

export async function POST(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const record = await createAdminDraftRecord();
    return jsonResponse({ success: true, record }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Failed to create draft." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));

  try {
    const deleted = await deleteRejectedApplicationRecords(rawBody.ids);
    return jsonResponse({ success: true, deleted }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Failed to delete applications." }, { status: 400 });
  }
}
