import fs from "fs";
import path from "path";
import { normalizeBoolean } from "./nexa-data";

export function getProfessionals() {
  const dataPath = path.join(process.cwd(), "data", "professionals.json");
  const file = fs.readFileSync(dataPath, "utf8");
  const profiles = JSON.parse(file);

  return profiles.map((profile) => ({
    ...profile,
    verified: normalizeBoolean(profile.verified),
    featured: normalizeBoolean(profile.featured),
  }));
}
