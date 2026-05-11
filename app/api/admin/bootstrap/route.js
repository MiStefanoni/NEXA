import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { importLegacyProfiles, isAdminDatabaseConfigured } from "../../../../lib/admin-store";
import { jsonResponse } from "../../../../lib/server-utils";

export async function POST(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!isAdminDatabaseConfigured()) {
    return jsonResponse({ success: false, error: "DATABASE_URL is not configured." }, { status: 400 });
  }

  try {
    const imported = await importLegacyProfiles();
    return jsonResponse({ success: true, imported }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || "Bootstrap failed." }, { status: 500 });
  }
}
