import { unstable_noStore as noStore } from "next/cache";
import { getApprovedProfiles } from "./admin-store";

export async function getProfessionals() {
  noStore();
  return getApprovedProfiles();
}
