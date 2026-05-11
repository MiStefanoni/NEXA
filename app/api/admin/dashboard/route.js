import { requireAdminApiSession } from "../../../../lib/admin-auth";
import { getDashboardData } from "../../../../lib/admin-store";
import { jsonResponse } from "../../../../lib/server-utils";

export async function GET(request) {
  if (!requireAdminApiSession(request)) {
    return jsonResponse({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const data = await getDashboardData();
  return jsonResponse({ success: true, data }, { status: 200 });
}
