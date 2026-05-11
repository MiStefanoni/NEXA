import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { createAdminDraftRecord } from "../../../../lib/admin-store";
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
