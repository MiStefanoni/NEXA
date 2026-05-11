import fs from "fs";
import path from "path";
import { CATEGORY_ORDER, normalizeBoolean } from "./nexa-data";
import { buildProfileDraftFromApplication, hydrateProfileDraft, sanitizeProfileDraft } from "./admin-profile";
import { isDatabaseConfigured, query } from "./nexa-db";
import { sanitizeText } from "./server-utils";

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

let schemaPromise;

function readLegacyProfiles() {
  const dataPath = path.join(process.cwd(), "data", "professionals.json");
  const file = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(file).map((profile) => ({
    ...profile,
    verified: normalizeBoolean(profile.verified),
    featured: normalizeBoolean(profile.featured),
  }));
}

function mergeProfiles(primary, fallback) {
  const seen = new Set(primary.map((profile) => profile.slug));
  return [...primary, ...fallback.filter((profile) => !seen.has(profile.slug))];
}

export function isAdminDatabaseConfigured() {
  return isDatabaseConfigured();
}

export async function ensureAdminSchema() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS applications (
          id BIGSERIAL PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          source TEXT NOT NULL DEFAULT '',
          applicant_name TEXT NOT NULL DEFAULT '',
          applicant_email TEXT NOT NULL DEFAULT '',
          applicant_category TEXT NOT NULL DEFAULT '',
          applicant_location TEXT NOT NULL DEFAULT '',
          applicant_website TEXT NOT NULL DEFAULT '',
          applicant_description TEXT NOT NULL DEFAULT '',
          admin_notes TEXT NOT NULL DEFAULT '',
          profile_name TEXT NOT NULL DEFAULT '',
          profile_slug TEXT UNIQUE,
          category_slug TEXT NOT NULL DEFAULT '',
          verified BOOLEAN NOT NULL DEFAULT FALSE,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ,
          published_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status, updated_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS applications_category_slug_idx ON applications (category_slug);
      `);
    })();
  }

  await schemaPromise;
  return true;
}

function mapRowToRecord(row) {
  const profileData = hydrateProfileDraft(row.profile_data || {});
  return {
    id: Number(row.id),
    status: row.status,
    source: row.source,
    admin_notes: row.admin_notes || "",
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    applicant: {
      name: row.applicant_name,
      email: row.applicant_email,
      category: row.applicant_category,
      location: row.applicant_location,
      website: row.applicant_website,
      description: row.applicant_description,
    },
    profile: {
      ...profileData,
      name: row.profile_name || profileData.name,
      slug: row.profile_slug || profileData.slug,
      category_slug: row.category_slug || profileData.category_slug,
      verified: Boolean(row.verified),
      featured: Boolean(row.featured),
    },
  };
}

function mapRecordToPublicProfile(record) {
  return {
    ...record.profile,
    verified: Boolean(record.profile.verified),
    featured: Boolean(record.profile.featured),
  };
}

async function listApplicationsByStatus(status) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT *
      FROM applications
      WHERE status = $1
      ORDER BY updated_at DESC, submitted_at DESC
    `,
    [status],
  );

  return result.rows.map(mapRowToRecord);
}

export async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      dbConfigured: false,
      pending: [],
      approved: [],
      rejected: [],
      legacyProfilesCount: readLegacyProfiles().length,
      categoryOrder: CATEGORY_ORDER,
    };
  }

  await ensureAdminSchema();

  const [pending, approved, rejected] = await Promise.all([
    listApplicationsByStatus("pending"),
    listApplicationsByStatus("approved"),
    listApplicationsByStatus("rejected"),
  ]);

  return {
    dbConfigured: true,
    pending,
    approved,
    rejected,
    legacyProfilesCount: readLegacyProfiles().length,
    categoryOrder: CATEGORY_ORDER,
  };
}

export async function getApplicationRecord(id) {
  await ensureAdminSchema();
  const result = await query(`SELECT * FROM applications WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] ? mapRowToRecord(result.rows[0]) : null;
}

export async function createAdminDraftRecord() {
  await ensureAdminSchema();
  const draft = hydrateProfileDraft({});
  const result = await query(
    `
      INSERT INTO applications (
        status,
        source,
        profile_name,
        profile_slug,
        category_slug,
        verified,
        featured,
        profile_data
      )
      VALUES ('pending', 'admin', '', NULL, '', FALSE, FALSE, $1::jsonb)
      RETURNING *
    `,
    [JSON.stringify(draft)],
  );

  return mapRowToRecord(result.rows[0]);
}

function validateProfileDraft(draft) {
  if (!draft.name) return "Nome é obrigatório.";
  if (!draft.slug) return "Slug é obrigatório.";
  if (!draft.category_slug) return "Categoria é obrigatória.";
  if (!draft.role_title_pt) return "Título profissional em português é obrigatório.";
  if (!draft.short_bio_pt) return "Resumo em português é obrigatório.";
  if (!draft.full_about_pt) return "Texto sobre em português é obrigatório.";
  if (!draft.email) return "Email é obrigatório.";
  return "";
}

export async function updateApplicationRecord(id, { adminNotes, profile, status, applicant }) {
  await ensureAdminSchema();
  const draft = sanitizeProfileDraft(profile);
  const notes = sanitizeText(adminNotes, 5000);
  const nextStatus = VALID_STATUSES.has(status) ? status : "pending";
  const sanitizedApplicant = {
    name: sanitizeText(applicant?.name, 200),
    email: sanitizeText(applicant?.email, 320),
    category: sanitizeText(applicant?.category, 200),
    location: sanitizeText(applicant?.location, 200),
    website: sanitizeText(applicant?.website, 500),
    description: sanitizeText(applicant?.description, 5000),
  };
  const validationError = validateProfileDraft(draft);

  if (validationError && nextStatus === "approved") {
    throw new Error(validationError);
  }

  let result;
  try {
    result = await query(
      `
        UPDATE applications
        SET
          status = $2,
          applicant_name = $3,
          applicant_email = $4,
          applicant_category = $5,
          applicant_location = $6,
          applicant_website = $7,
          applicant_description = $8,
          admin_notes = $9,
          profile_name = $10,
          profile_slug = NULLIF($11, ''),
          category_slug = $12,
          verified = $13,
          featured = $14,
          profile_data = $15::jsonb,
          reviewed_at = CASE WHEN $2 = 'pending' THEN reviewed_at ELSE NOW() END,
          published_at = CASE WHEN $2 = 'approved' THEN COALESCE(published_at, NOW()) ELSE NULL END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        nextStatus,
        sanitizedApplicant.name,
        sanitizedApplicant.email,
        sanitizedApplicant.category,
        sanitizedApplicant.location,
        sanitizedApplicant.website,
        sanitizedApplicant.description,
        notes,
        draft.name,
        draft.slug,
        draft.category_slug,
        Boolean(draft.verified),
        Boolean(draft.featured),
        JSON.stringify(draft),
      ],
    );
  } catch (error) {
    if (error?.code === "23505") {
      throw new Error("Este slug já está em uso por outro perfil.");
    }
    throw error;
  }

  if (!result.rows[0]) {
    throw new Error("Registro não encontrado.");
  }

  return mapRowToRecord(result.rows[0]);
}

export async function createPendingApplicationRecord(application) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureAdminSchema();
  const draft = buildProfileDraftFromApplication(application);
  const result = await query(
    `
      INSERT INTO applications (
        status,
        source,
        applicant_name,
        applicant_email,
        applicant_category,
        applicant_location,
        applicant_website,
        applicant_description,
        profile_name,
        profile_slug,
        category_slug,
        verified,
        featured,
        profile_data
      )
      VALUES (
        'pending',
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        NULL,
        $9,
        FALSE,
        FALSE,
        $10::jsonb
      )
      RETURNING *
    `,
    [
      sanitizeText(application.source, 120),
      sanitizeText(application.name, 200),
      sanitizeText(application.email, 320),
      sanitizeText(application.category, 200),
      sanitizeText(application.location, 200),
      sanitizeText(application.website, 500),
      sanitizeText(application.description, 5000),
      draft.name,
      draft.category_slug,
      JSON.stringify(draft),
    ],
  );

  return mapRowToRecord(result.rows[0]);
}

export async function getApprovedProfiles() {
  if (!isDatabaseConfigured()) {
    return readLegacyProfiles();
  }

  await ensureAdminSchema();

  try {
    const result = await query(
      `
        SELECT *
        FROM applications
        WHERE status = 'approved'
        ORDER BY featured DESC, profile_name ASC, id ASC
      `,
    );

    const approvedProfiles = result.rows.map((row) => mapRecordToPublicProfile(mapRowToRecord(row)));
    return mergeProfiles(approvedProfiles, readLegacyProfiles());
  } catch (_) {
    return readLegacyProfiles();
  }
}

export async function importLegacyProfiles() {
  await ensureAdminSchema();
  const profiles = readLegacyProfiles();

  for (const profile of profiles) {
    const sanitized = sanitizeProfileDraft(profile);
    await query(
      `
        INSERT INTO applications (
          status,
          source,
          applicant_name,
          applicant_email,
          applicant_category,
          applicant_location,
          applicant_website,
          applicant_description,
          admin_notes,
          profile_name,
          profile_slug,
          category_slug,
          verified,
          featured,
          reviewed_at,
          published_at,
          profile_data
        )
        VALUES (
          'approved',
          'legacy-import',
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'Imported from legacy professionals.json',
          $1,
          NULLIF($7, ''),
          $8,
          $9,
          $10,
          NOW(),
          NOW(),
          $11::jsonb
        )
        ON CONFLICT (profile_slug)
        DO UPDATE SET
          status = 'approved',
          source = 'legacy-import',
          applicant_name = EXCLUDED.applicant_name,
          applicant_email = EXCLUDED.applicant_email,
          applicant_category = EXCLUDED.applicant_category,
          applicant_location = EXCLUDED.applicant_location,
          applicant_website = EXCLUDED.applicant_website,
          applicant_description = EXCLUDED.applicant_description,
          admin_notes = 'Imported from legacy professionals.json',
          profile_name = EXCLUDED.profile_name,
          category_slug = EXCLUDED.category_slug,
          verified = EXCLUDED.verified,
          featured = EXCLUDED.featured,
          reviewed_at = NOW(),
          published_at = NOW(),
          profile_data = EXCLUDED.profile_data,
          updated_at = NOW()
      `,
      [
        sanitized.name,
        sanitized.email,
        sanitized.category_pt,
        sanitized.location,
        sanitized.website,
        sanitized.full_about_pt || sanitized.short_bio_pt,
        sanitized.slug,
        sanitized.category_slug,
        Boolean(sanitized.verified),
        Boolean(sanitized.featured),
        JSON.stringify(sanitized),
      ],
    );
  }

  return profiles.length;
}
