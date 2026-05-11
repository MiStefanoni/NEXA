import { cookies } from "next/headers";
import { clearAdminSessionCookie } from "../../../../lib/admin-auth";
import { jsonResponse } from "../../../../lib/server-utils";

export async function POST() {
  clearAdminSessionCookie(cookies());
  return jsonResponse({ success: true }, { status: 200 });
}
