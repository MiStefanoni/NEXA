import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CATEGORY_ORDER, normalizeBoolean } from "./nexa-data";
import { buildProfileDraftFromApplication, hydrateProfileDraft, sanitizeProfileDraft } from "./admin-profile";
import { isDatabaseConfigured, query, writeTransaction } from "./nexa-db";
import { sanitizeText } from "./server-utils";
import { hashInviteToken } from "./invite-tokens";

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);
const VALID_INVITE_STATUSES = new Set(["pending", "used", "expired", "revoked"]);
const VALID_REFERRAL_EVENT_TYPES = new Set([
  "link_visit",
  "application_submitted",
  "application_approved",
  "profile_published",
]);
const CURRENT_TIMESTAMP_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

let schemaPromise;

function readLegacyProfiles() {
  const dataPath = path.join(process.cwd(), "data", "professionals.json");
  const file = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(file).map((profile) => ({
    ...profile,
    verified: normalizeBoolean(profile.verified),
    featured: normalizeBoolean(profile.featured),
    founder_professional: normalizeBoolean(profile.founder_professional),
  }));
}

export function isAdminDatabaseConfigured() {
  return isDatabaseConfigured();
}

function toDbBoolean(value) {
  return value ? 1 : 0;
}

function parseProfileData(value) {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (_) {
    return {};
  }
}

function isUniqueConstraintError(error) {
  const message = String(error?.message || "");
  return error?.code === "SQLITE_CONSTRAINT_UNIQUE" || message.includes("UNIQUE constraint failed");
}

export function normalizeReferralCode(value) {
  return sanitizeText(value, 120)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
}

async function ensureApplicationsColumns() {
  const result = await query("PRAGMA table_info(applications)");
  const columns = new Set(result.rows.map((row) => row.name));

  if (!columns.has("invite_id")) {
    await query("ALTER TABLE applications ADD COLUMN invite_id TEXT REFERENCES application_invites(id)");
  }

  if (!columns.has("applicant_referral_code")) {
    await query("ALTER TABLE applications ADD COLUMN applicant_referral_code TEXT NOT NULL DEFAULT ''");
  }

  if (!columns.has("referral_partner_id")) {
    await query("ALTER TABLE applications ADD COLUMN referral_partner_id TEXT REFERENCES referral_partners(id)");
  }

  if (!columns.has("referral_code")) {
    await query("ALTER TABLE applications ADD COLUMN referral_code TEXT NOT NULL DEFAULT ''");
  }

  if (!columns.has("referral_name")) {
    await query("ALTER TABLE applications ADD COLUMN referral_name TEXT NOT NULL DEFAULT ''");
  }
}

function mapReferralPartnerRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    code: row.code || "",
    active: Boolean(Number(row.active)),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function ensureAdminSchema() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS application_invites (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT,
          token_hash TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS referral_partners (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS referral_events (
          id TEXT PRIMARY KEY,
          referral_partner_id TEXT REFERENCES referral_partners(id),
          referral_code TEXT NOT NULL DEFAULT '',
          event_type TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invite_id TEXT REFERENCES application_invites(id),
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          source TEXT NOT NULL DEFAULT '',
          applicant_name TEXT NOT NULL DEFAULT '',
          applicant_email TEXT NOT NULL DEFAULT '',
          applicant_category TEXT NOT NULL DEFAULT '',
          applicant_location TEXT NOT NULL DEFAULT '',
          applicant_website TEXT NOT NULL DEFAULT '',
          applicant_referral_code TEXT NOT NULL DEFAULT '',
          referral_partner_id TEXT REFERENCES referral_partners(id),
          referral_code TEXT NOT NULL DEFAULT '',
          referral_name TEXT NOT NULL DEFAULT '',
          applicant_description TEXT NOT NULL DEFAULT '',
          admin_notes TEXT NOT NULL DEFAULT '',
          profile_name TEXT NOT NULL DEFAULT '',
          profile_slug TEXT UNIQUE,
          category_slug TEXT NOT NULL DEFAULT '',
          verified INTEGER NOT NULL DEFAULT 0,
          featured INTEGER NOT NULL DEFAULT 0,
          profile_data TEXT NOT NULL DEFAULT '{}',
          submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TEXT,
          published_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await ensureApplicationsColumns();

      await query(`
        CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status, updated_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS applications_category_slug_idx ON applications (category_slug);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS applications_invite_id_idx ON applications (invite_id);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS application_invites_status_expires_idx ON application_invites (status, expires_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS referral_partners_active_code_idx ON referral_partners (active, code);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS referral_events_partner_type_idx ON referral_events (referral_partner_id, event_type, created_at DESC);
      `);
    })();
  }

  await schemaPromise;
  return true;
}

export async function createReferralPartner({ name, email, code }) {
  await ensureAdminSchema();
  const safeName = sanitizeText(name, 200);
  const safeEmail = sanitizeText(email, 320).toLowerCase();
  const normalizedCode = normalizeReferralCode(code);

  if (!safeName) {
    throw new Error("Nome é obrigatório.");
  }

  if (!safeEmail) {
    throw new Error("Email é obrigatório.");
  }

  if (!normalizedCode) {
    throw new Error("Código é obrigatório.");
  }

  try {
    const result = await query(
      `
        INSERT INTO referral_partners (
          id,
          name,
          email,
          code,
          active
        )
        VALUES (?, ?, ?, ?, 1)
        RETURNING *
      `,
      [crypto.randomUUID(), safeName, safeEmail, normalizedCode],
    );

    return mapReferralPartnerRow(result.rows[0]);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("Este código já está em uso.");
    }
    throw error;
  }
}

export async function listReferralPartners() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureAdminSchema();
  const result = await query(
    `
      SELECT *
      FROM referral_partners
      ORDER BY created_at DESC
    `,
  );

  return result.rows.map(mapReferralPartnerRow);
}

export async function updateReferralPartnerStatus(id, { active }) {
  await ensureAdminSchema();
  const safeId = sanitizeText(id, 120);

  if (!safeId) {
    throw new Error("Referral inválido.");
  }

  const result = await query(
    `
      UPDATE referral_partners
      SET active = ?,
          updated_at = ${CURRENT_TIMESTAMP_SQL}
      WHERE id = ?
      RETURNING *
    `,
    [toDbBoolean(active), safeId],
  );

  if (!result.rows[0]) {
    throw new Error("Link de indicação não encontrado.");
  }

  return mapReferralPartnerRow(result.rows[0]);
}

export async function findReferralPartnerByCode(code, { activeOnly = false } = {}) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureAdminSchema();
  const normalizedCode = normalizeReferralCode(code);

  if (!normalizedCode) {
    return null;
  }

  const result = await query(
    `
      SELECT *
      FROM referral_partners
      WHERE code = ?
        ${activeOnly ? "AND active = 1" : ""}
      LIMIT 1
    `,
    [normalizedCode],
  );

  return result.rows[0] ? mapReferralPartnerRow(result.rows[0]) : null;
}

export async function recordReferralEvent({ referralPartnerId, referralCode, eventType }) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!VALID_REFERRAL_EVENT_TYPES.has(eventType)) {
    return null;
  }

  await ensureAdminSchema();
  await query(
    `
      INSERT INTO referral_events (
        id,
        referral_partner_id,
        referral_code,
        event_type
      )
      VALUES (?, NULLIF(?, ''), ?, ?)
    `,
    [
      crypto.randomUUID(),
      sanitizeText(referralPartnerId, 120),
      normalizeReferralCode(referralCode),
      eventType,
    ],
  );

  return true;
}

function mapInviteRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || "",
    status: row.status,
    expires_at: row.expires_at,
    used_at: row.used_at,
    created_at: row.created_at,
    created_by: row.created_by || "",
  };
}

function mapRowToRecord(row) {
  const profileData = hydrateProfileDraft(parseProfileData(row.profile_data));
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
      referralCode: row.applicant_referral_code || "",
      description: row.applicant_description,
    },
    referral: {
      partnerId: row.referral_partner_id || "",
      code: row.referral_code || "",
      name: row.referral_name || "",
    },
    profile: {
      ...profileData,
      name: row.profile_name || profileData.name,
      slug: row.profile_slug || profileData.slug,
      category_slug: row.category_slug || profileData.category_slug,
      verified: Boolean(Number(row.verified)),
      featured: Boolean(Number(row.featured)),
      founder_professional: Boolean(profileData.founder_professional),
    },
  };
}

function mapRecordToPublicProfile(record) {
  return {
    ...record.profile,
    verified: Boolean(record.profile.verified),
    featured: Boolean(record.profile.featured),
    founder_professional: Boolean(record.profile.founder_professional),
  };
}

async function listApplicationsByStatus(status) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT *
      FROM applications
      WHERE status = ?
      ORDER BY updated_at DESC, submitted_at DESC
    `,
    [status],
  );

  return result.rows.map(mapRowToRecord);
}

async function expirePendingApplicationInvites() {
  await ensureAdminSchema();
  await query(
    `
      UPDATE application_invites
      SET status = 'expired'
      WHERE status = 'pending'
        AND expires_at <= ${CURRENT_TIMESTAMP_SQL}
    `,
  );
}

export async function listApplicationInvites() {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureAdminSchema();
  await expirePendingApplicationInvites();
  const result = await query(
    `
      SELECT *
      FROM application_invites
      ORDER BY created_at DESC
    `,
  );

  return result.rows.map(mapInviteRow);
}

export async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      dbConfigured: false,
      pending: [],
      approved: [],
      rejected: [],
      invites: [],
      referrals: [],
      legacyProfilesCount: readLegacyProfiles().length,
      categoryOrder: CATEGORY_ORDER,
    };
  }

  await ensureAdminSchema();
  await expirePendingApplicationInvites();

  const [pending, approved, rejected, invites, referrals] = await Promise.all([
    listApplicationsByStatus("pending"),
    listApplicationsByStatus("approved"),
    listApplicationsByStatus("rejected"),
    listApplicationInvites(),
    listReferralPartners(),
  ]);

  return {
    dbConfigured: true,
    pending,
    approved,
    rejected,
    invites,
    referrals,
    legacyProfilesCount: readLegacyProfiles().length,
    categoryOrder: CATEGORY_ORDER,
  };
}

export async function getApplicationRecord(id) {
  await ensureAdminSchema();
  const result = await query(`SELECT * FROM applications WHERE id = ? LIMIT 1`, [id]);
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
      VALUES ('pending', 'admin', '', NULL, '', 0, 0, ?)
      RETURNING *
    `,
    [JSON.stringify(draft)],
  );

  return mapRowToRecord(result.rows[0]);
}

export async function createApplicationInvite({ email, name, token, expiresAt, createdBy }) {
  if (!isDatabaseConfigured()) {
    throw new Error("Turso database is not configured.");
  }
  await ensureAdminSchema();
  const safeEmail = sanitizeText(email, 320).toLowerCase();
  const safeName = sanitizeText(name, 200);
  const safeCreatedBy = sanitizeText(createdBy, 200);
  const inviteId = crypto.randomUUID();
  const tokenHash = hashInviteToken(token);

  if (!safeEmail) {
    throw new Error("Email é obrigatório.");
  }

  const result = await query(
    `
      INSERT INTO application_invites (
        id,
        email,
        name,
        token_hash,
        status,
        expires_at,
        created_by
      )
      VALUES (?, ?, NULLIF(?, ''), ?, 'pending', ?, NULLIF(?, ''))
      RETURNING *
    `,
    [inviteId, safeEmail, safeName, tokenHash, expiresAt.toISOString(), safeCreatedBy || "admin"],
  );

  return mapInviteRow(result.rows[0]);
}

export async function revokeApplicationInvite(id) {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureAdminSchema();
  const result = await query(
    `
      UPDATE application_invites
      SET status = 'revoked'
      WHERE id = ?
        AND status = 'pending'
      RETURNING *
    `,
    [id],
  );

  return result.rows[0] ? mapInviteRow(result.rows[0]) : null;
}

export async function getApplicationInviteByToken(token) {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureAdminSchema();
  await expirePendingApplicationInvites();
  const tokenHash = hashInviteToken(token);
  const result = await query(
    `
      SELECT *
      FROM application_invites
      WHERE token_hash = ?
      LIMIT 1
    `,
    [tokenHash],
  );

  return result.rows[0] ? mapInviteRow(result.rows[0]) : null;
}

export async function createPendingApplicationRecordFromInvite({ token, applicant, profile }) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureAdminSchema();
  await expirePendingApplicationInvites();

  return writeTransaction(async (db) => {
    const inviteResult = await db.query(
      `
        SELECT *
        FROM application_invites
        WHERE token_hash = ?
        LIMIT 1
      `,
      [hashInviteToken(token)],
    );

    const invite = inviteResult.rows[0];

    if (!invite) {
      throw new Error("Convite inválido.");
    }

    if (!VALID_INVITE_STATUSES.has(invite.status) || invite.status !== "pending") {
      throw new Error("Este link não está mais disponível.");
    }

    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      await db.query(
        `
          UPDATE application_invites
          SET status = 'expired'
          WHERE id = ?
        `,
        [invite.id],
      );
      throw new Error("Este link não está mais disponível.");
    }

    const sanitizedApplicant = {
      name: sanitizeText(applicant?.name, 200),
      email: sanitizeText(applicant?.email, 320).toLowerCase(),
      category: sanitizeText(applicant?.category, 200),
      location: sanitizeText(applicant?.location, 200),
      website: sanitizeText(applicant?.website, 500),
      referralCode: sanitizeText(applicant?.referralCode, 120),
      description: sanitizeText(applicant?.description, 5000),
    };

    // This ties the submission to the invited address and prevents casual forwarding.
    // Stronger protection would require email OTP or an authenticated invite flow.
    if (sanitizedApplicant.email !== String(invite.email || "").trim().toLowerCase()) {
      throw new Error("O email informado não corresponde ao convite.");
    }

    const baseDraft = buildProfileDraftFromApplication({
      name: sanitizedApplicant.name,
      email: sanitizedApplicant.email,
      category: sanitizedApplicant.category,
      location: sanitizedApplicant.location,
      website: sanitizedApplicant.website,
      description: sanitizedApplicant.description,
      source: "invite",
    });

    const draft = sanitizeProfileDraft({
      ...baseDraft,
      ...(profile || {}),
      name: sanitizeText(profile?.name, 200) || sanitizedApplicant.name || baseDraft.name,
      email: sanitizedApplicant.email,
      location: sanitizeText(profile?.location, 200) || sanitizedApplicant.location || baseDraft.location,
      website: sanitizeText(profile?.website, 500) || sanitizedApplicant.website || baseDraft.website,
    });
    const validationError = validateProfileDraft(draft);

    if (validationError) {
      throw new Error(validationError);
    }

    let insertResult;
    try {
      insertResult = await db.query(
        `
          INSERT INTO applications (
            invite_id,
            status,
            source,
            applicant_name,
            applicant_email,
            applicant_category,
            applicant_location,
            applicant_website,
            applicant_referral_code,
            applicant_description,
            profile_name,
            profile_slug,
            category_slug,
            verified,
            featured,
            profile_data
          )
          VALUES (
            ?,
            'pending',
            'invite',
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            NULLIF(?, ''),
            ?,
            0,
            0,
            ?
          )
          RETURNING *
        `,
        [
          invite.id,
          sanitizedApplicant.name,
          sanitizedApplicant.email,
          sanitizedApplicant.category,
          sanitizedApplicant.location,
          sanitizedApplicant.website,
          sanitizedApplicant.referralCode,
          sanitizedApplicant.description,
          draft.name,
          draft.slug,
          draft.category_slug,
          JSON.stringify(draft),
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Este slug já está em uso por outro perfil.");
      }
      throw error;
    }

    await db.query(
      `
        UPDATE application_invites
        SET status = 'used',
            used_at = ${CURRENT_TIMESTAMP_SQL}
        WHERE id = ?
      `,
      [invite.id],
    );

    return mapRowToRecord(insertResult.rows[0]);
  });
}

export async function deleteRejectedApplicationRecords(ids) {
  await ensureAdminSchema();

  const validIds = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  if (!validIds.length) {
    return 0;
  }

  const result = await query(
    `
      DELETE FROM applications
      WHERE status = 'rejected'
        AND id IN (${validIds.map(() => "?").join(", ")})
    `,
    validIds,
  );

  return Number(result.rowCount || 0);
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
    referralCode: sanitizeText(applicant?.referralCode, 120),
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
          status = ?,
          applicant_name = ?,
          applicant_email = ?,
          applicant_category = ?,
          applicant_location = ?,
          applicant_website = ?,
          applicant_referral_code = ?,
          applicant_description = ?,
          admin_notes = ?,
          profile_name = ?,
          profile_slug = NULLIF(?, ''),
          category_slug = ?,
          verified = ?,
          featured = ?,
          profile_data = ?,
          reviewed_at = CASE WHEN ? = 'pending' THEN reviewed_at ELSE ${CURRENT_TIMESTAMP_SQL} END,
          published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, ${CURRENT_TIMESTAMP_SQL}) ELSE NULL END,
          updated_at = ${CURRENT_TIMESTAMP_SQL}
        WHERE id = ?
        RETURNING *
      `,
      [
        nextStatus,
        sanitizedApplicant.name,
        sanitizedApplicant.email,
        sanitizedApplicant.category,
        sanitizedApplicant.location,
        sanitizedApplicant.website,
        sanitizedApplicant.referralCode,
        sanitizedApplicant.description,
        notes,
        draft.name,
        draft.slug,
        draft.category_slug,
        toDbBoolean(draft.verified),
        toDbBoolean(draft.featured),
        JSON.stringify(draft),
        nextStatus,
        nextStatus,
        id,
      ],
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
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
  const submittedReferralCode = normalizeReferralCode(application.referralCode);
  const referralPartner = submittedReferralCode
    ? await findReferralPartnerByCode(submittedReferralCode, { activeOnly: true })
    : null;
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
        applicant_referral_code,
        referral_partner_id,
        referral_code,
        referral_name,
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
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        NULLIF(?, ''),
        ?,
        ?,
        ?,
        ?,
        NULL,
        ?,
        0,
        0,
        ?
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
      submittedReferralCode,
      referralPartner?.id || "",
      referralPartner?.code || "",
      referralPartner?.name || "",
      sanitizeText(application.description, 5000),
      draft.name,
      draft.category_slug,
      JSON.stringify(draft),
    ],
  );

  if (referralPartner) {
    await recordReferralEvent({
      referralPartnerId: referralPartner.id,
      referralCode: referralPartner.code,
      eventType: "application_submitted",
    }).catch(() => {});
  }

  return mapRowToRecord(result.rows[0]);
}

export async function getApprovedProfiles() {
  if (!isDatabaseConfigured()) {
    return [];
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

    return result.rows.map((row) => mapRecordToPublicProfile(mapRowToRecord(row)));
  } catch (_) {
    return [];
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
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'Imported from legacy professionals.json',
          ?,
          NULLIF(?, ''),
          ?,
          ?,
          ?,
          ${CURRENT_TIMESTAMP_SQL},
          ${CURRENT_TIMESTAMP_SQL},
          ?
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
          reviewed_at = ${CURRENT_TIMESTAMP_SQL},
          published_at = ${CURRENT_TIMESTAMP_SQL},
          profile_data = EXCLUDED.profile_data,
          updated_at = ${CURRENT_TIMESTAMP_SQL}
      `,
      [
        sanitized.name,
        sanitized.email,
        sanitized.category_pt,
        sanitized.location,
        sanitized.website,
        sanitized.full_about_pt || sanitized.short_bio_pt,
        sanitized.name,
        sanitized.slug,
        sanitized.category_slug,
        toDbBoolean(sanitized.verified),
        toDbBoolean(sanitized.featured),
        JSON.stringify(sanitized),
      ],
    );
  }

  return profiles.length;
}
