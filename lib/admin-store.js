import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CATEGORY_ORDER, normalizeBoolean } from "./nexa-data";
import { buildProfileDraftFromApplication, hydrateProfileDraft, sanitizeProfileDraft } from "./admin-profile";
import { isDatabaseConfigured, query, writeTransaction } from "./nexa-db";
import { sanitizeText } from "./server-utils";
import { hashInviteToken } from "./invite-tokens";
import { PROFILE_PROMPT_VERSION } from "./ai/profile-prompt";

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);
const VALID_INVITE_STATUSES = new Set(["pending", "used", "expired", "revoked"]);
const VALID_AI_SESSION_STATUSES = new Set(["draft", "questions_pending", "ready_for_review", "submitted", "abandoned"]);
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

  if (!columns.has("ai_profile_session_id")) {
    await query("ALTER TABLE applications ADD COLUMN ai_profile_session_id TEXT REFERENCES ai_profile_sessions(id)");
  }

  if (!columns.has("publication_consent")) {
    await query("ALTER TABLE applications ADD COLUMN publication_consent INTEGER NOT NULL DEFAULT 0");
  }

  if (!columns.has("completeness_status")) {
    await query("ALTER TABLE applications ADD COLUMN completeness_status TEXT NOT NULL DEFAULT 'basic'");
    await query("UPDATE applications SET completeness_status = 'complete' WHERE published_at IS NOT NULL");
  }

  if (!columns.has("pending_profile_data")) {
    await query("ALTER TABLE applications ADD COLUMN pending_profile_data TEXT");
  }

  if (!columns.has("pending_applicant_data")) {
    await query("ALTER TABLE applications ADD COLUMN pending_applicant_data TEXT");
  }

  if (!columns.has("profile_update_status")) {
    await query("ALTER TABLE applications ADD COLUMN profile_update_status TEXT");
  }

  if (!columns.has("profile_update_source")) {
    await query("ALTER TABLE applications ADD COLUMN profile_update_source TEXT NOT NULL DEFAULT ''");
  }

  if (!columns.has("profile_update_submitted_at")) {
    await query("ALTER TABLE applications ADD COLUMN profile_update_submitted_at TEXT");
  }
}

async function ensureInviteColumns() {
  const result = await query("PRAGMA table_info(application_invites)");
  const columns = new Set(result.rows.map((row) => row.name));

  if (!columns.has("application_id")) {
    await query("ALTER TABLE application_invites ADD COLUMN application_id INTEGER REFERENCES applications(id)");
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
        CREATE TABLE IF NOT EXISTS ai_profile_sessions (
          id TEXT PRIMARY KEY,
          invite_id TEXT,
          applicant_email TEXT NOT NULL,
          initial_description TEXT NOT NULL DEFAULT '',
          extracted_facts TEXT NOT NULL DEFAULT '{}',
          conversation_data TEXT NOT NULL DEFAULT '[]',
          generated_profile TEXT NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'questions_pending', 'ready_for_review', 'submitted', 'abandoned')),
          question_round INTEGER NOT NULL DEFAULT 0,
          generation_count INTEGER NOT NULL DEFAULT 0,
          prompt_version TEXT NOT NULL DEFAULT '1.0',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
          ai_profile_session_id TEXT REFERENCES ai_profile_sessions(id),
          applicant_description TEXT NOT NULL DEFAULT '',
          admin_notes TEXT NOT NULL DEFAULT '',
          profile_name TEXT NOT NULL DEFAULT '',
          profile_slug TEXT UNIQUE,
          category_slug TEXT NOT NULL DEFAULT '',
          verified INTEGER NOT NULL DEFAULT 0,
          featured INTEGER NOT NULL DEFAULT 0,
          profile_data TEXT NOT NULL DEFAULT '{}',
          publication_consent INTEGER NOT NULL DEFAULT 0,
          completeness_status TEXT NOT NULL DEFAULT 'basic',
          pending_profile_data TEXT,
          pending_applicant_data TEXT,
          profile_update_status TEXT,
          profile_update_source TEXT NOT NULL DEFAULT '',
          profile_update_submitted_at TEXT,
          submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TEXT,
          published_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await ensureApplicationsColumns();
      await ensureInviteColumns();

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
        CREATE INDEX IF NOT EXISTS application_invites_application_id_idx ON application_invites (application_id, status, expires_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS applications_profile_update_status_idx ON applications (profile_update_status, profile_update_submitted_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS referral_partners_active_code_idx ON referral_partners (active, code);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS referral_events_partner_type_idx ON referral_events (referral_partner_id, event_type, created_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS ai_profile_sessions_invite_status_idx ON ai_profile_sessions (invite_id, status, updated_at DESC);
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

function mapAiSessionRow(row) {
  const extractedFacts = parseProfileData(row.extracted_facts);
  const conversationData = parseProfileData(row.conversation_data);
  const generatedProfile = parseProfileData(row.generated_profile);

  return {
    id: row.id,
    invite_id: row.invite_id || "",
    applicant_email: row.applicant_email || "",
    initial_description: row.initial_description || "",
    extracted_facts: extractedFacts,
    conversation_data: Array.isArray(conversationData) ? conversationData : [],
    generated_profile: generatedProfile,
    status: row.status || "draft",
    question_round: Number(row.question_round || 0),
    generation_count: Number(row.generation_count || 0),
    prompt_version: row.prompt_version || PROFILE_PROMPT_VERSION,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getValidPendingInviteForAi(token) {
  const invite = await getApplicationInviteByToken(token);
  if (!invite || invite.status !== "pending" || new Date(invite.expires_at).getTime() <= Date.now()) {
    throw new Error("Este link não está mais disponível.");
  }
  return invite;
}

export async function createAiProfileSession({ invite, initialDescription }) {
  await ensureAdminSchema();
  const result = await query(
    `
      INSERT INTO ai_profile_sessions (
        id,
        invite_id,
        applicant_email,
        initial_description,
        prompt_version
      )
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      invite.id,
      sanitizeText(invite.email, 320).toLowerCase(),
      sanitizeText(initialDescription, 4000),
      PROFILE_PROMPT_VERSION,
    ],
  );

  return mapAiSessionRow(result.rows[0]);
}

export async function getAiProfileSessionForInvite({ sessionId, invite }) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT *
      FROM ai_profile_sessions
      WHERE id = ?
        AND invite_id = ?
        AND applicant_email = ?
      LIMIT 1
    `,
    [sanitizeText(sessionId, 120), invite.id, sanitizeText(invite.email, 320).toLowerCase()],
  );

  if (!result.rows[0]) {
    throw new Error("Sessão não encontrada.");
  }

  return mapAiSessionRow(result.rows[0]);
}

export async function getAiProfileSessionById(id) {
  await ensureAdminSchema();
  const result = await query(`SELECT * FROM ai_profile_sessions WHERE id = ? LIMIT 1`, [sanitizeText(id, 120)]);
  return result.rows[0] ? mapAiSessionRow(result.rows[0]) : null;
}

export async function updateAiProfileSession(id, updates) {
  await ensureAdminSchema();
  const current = await getAiProfileSessionById(id);
  if (!current) {
    throw new Error("Sessão não encontrada.");
  }

  const nextStatus = VALID_AI_SESSION_STATUSES.has(updates.status) ? updates.status : current.status;
  const result = await query(
    `
      UPDATE ai_profile_sessions
      SET
        initial_description = ?,
        extracted_facts = ?,
        conversation_data = ?,
        generated_profile = ?,
        status = ?,
        question_round = ?,
        generation_count = ?,
        updated_at = ${CURRENT_TIMESTAMP_SQL}
      WHERE id = ?
      RETURNING *
    `,
    [
      sanitizeText(updates.initialDescription ?? current.initial_description, 4000),
      JSON.stringify(updates.extractedFacts ?? current.extracted_facts ?? {}),
      JSON.stringify(updates.conversationData ?? current.conversation_data ?? []),
      JSON.stringify(updates.generatedProfile ?? current.generated_profile ?? {}),
      nextStatus,
      Number(updates.questionRound ?? current.question_round ?? 0),
      Number(updates.generationCount ?? current.generation_count ?? 0),
      current.id,
    ],
  );

  return mapAiSessionRow(result.rows[0]);
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
    application_id: Number(row.application_id || 0) || null,
  };
}

function clearLegacyApplicationDescriptionCopies(profileData, row) {
  if (row.published_at) return profileData;

  const description = sanitizeText(row.applicant_description, 5000);
  if (!description) return profileData;

  const profile = { ...profileData };
  const legacyCopiedFields = ["short_bio_pt", "full_about_pt", "service_1_description_pt"];
  const hasLegacyDescriptionCopy = legacyCopiedFields.some(
    (key) => sanitizeText(profile[key], 5000) === description,
  );

  if (hasLegacyDescriptionCopy) {
    for (const key of legacyCopiedFields) profile[key] = "";
  }
  return profile;
}

function mapRowToRecord(row) {
  const profileData = clearLegacyApplicationDescriptionCopies(
    hydrateProfileDraft(parseProfileData(row.profile_data)),
    row,
  );
  const pendingProfileData = row.pending_profile_data ? hydrateProfileDraft(parseProfileData(row.pending_profile_data)) : null;
  const pendingApplicantData = row.pending_applicant_data ? parseProfileData(row.pending_applicant_data) : null;
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
    publicationConsent: Boolean(Number(row.publication_consent)),
    completenessStatus: row.completeness_status === "complete" ? "complete" : "basic",
    isPublished: Boolean(row.published_at),
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
    ai: {
      sessionId: row.ai_profile_session_id || "",
      assisted: row.source === "ai-assisted",
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
    profileUpdate: pendingProfileData
      ? {
          status: row.profile_update_status || "pending",
          source: row.profile_update_source || "",
          submitted_at: row.profile_update_submitted_at,
          applicant: pendingApplicantData || {},
          profile: pendingProfileData,
        }
      : null,
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

async function listPendingProfileUpdates() {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT *
      FROM applications
      WHERE profile_update_status = 'pending'
      ORDER BY profile_update_submitted_at DESC, updated_at DESC
    `,
  );

  return result.rows.map((row) => {
    const record = mapRowToRecord(row);
    return {
      ...record,
      isProfileUpdate: true,
      liveProfile: record.profile,
      applicant: { ...record.applicant, ...(record.profileUpdate?.applicant || {}) },
      profile: record.profileUpdate?.profile || record.profile,
      ai: { ...record.ai, assisted: record.profileUpdate?.source === "ai-assisted" },
    };
  });
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
      updates: [],
      invites: [],
      referrals: [],
      legacyProfilesCount: readLegacyProfiles().length,
      categoryOrder: CATEGORY_ORDER,
    };
  }

  await ensureAdminSchema();
  await expirePendingApplicationInvites();

  const [pending, approved, rejected, updates, invites, referrals] = await Promise.all([
    listApplicationsByStatus("pending"),
    listApplicationsByStatus("approved"),
    listApplicationsByStatus("rejected"),
    listPendingProfileUpdates(),
    listApplicationInvites(),
    listReferralPartners(),
  ]);

  return {
    dbConfigured: true,
    pending,
    approved,
    rejected,
    updates,
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

export async function createApplicationInvite({ email, name, token, expiresAt, createdBy, applicationId = null }) {
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
        created_by,
        application_id
      )
      VALUES (?, ?, NULLIF(?, ''), ?, 'pending', ?, NULLIF(?, ''), ?)
      RETURNING *
    `,
    [inviteId, safeEmail, safeName, tokenHash, expiresAt.toISOString(), safeCreatedBy || "admin", applicationId],
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

export async function getApplicationRecordForInvite(invite) {
  if (!invite?.application_id) return null;
  return getApplicationRecord(invite.application_id);
}

export async function createPendingApplicationRecordFromInvite({ token, applicant, profile, source = "invite", aiSessionId = "", publicationConsent = false }) {
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

    const targetApplicationId = Number(invite.application_id || 0);
    let targetApplication = null;
    if (targetApplicationId) {
      const targetResult = await db.query(`SELECT * FROM applications WHERE id = ? LIMIT 1`, [targetApplicationId]);
      targetApplication = targetResult.rows[0] || null;
      if (!targetApplication || targetApplication.status !== "approved" || !targetApplication.published_at) {
        throw new Error("Perfil não encontrado ou indisponível para atualização.");
      }
      if (sanitizedApplicant.email !== String(targetApplication.applicant_email || "").trim().toLowerCase()) {
        throw new Error("O email informado não corresponde ao perfil.");
      }
      if (targetApplication.profile_update_status === "pending") {
        throw new Error("Já existe uma atualização deste perfil aguardando análise.");
      }
    }

    const normalizedSource = source === "ai-assisted" ? "ai-assisted" : "invite";
    const safeAiSessionId = sanitizeText(aiSessionId, 120);
    if (normalizedSource === "ai-assisted") {
      const aiSessionResult = await db.query(
        `
          SELECT id
          FROM ai_profile_sessions
          WHERE id = ?
            AND invite_id = ?
            AND applicant_email = ?
            AND status = 'ready_for_review'
          LIMIT 1
        `,
        [safeAiSessionId, invite.id, sanitizedApplicant.email],
      );

      if (!aiSessionResult.rows[0]) {
        throw new Error("Sessão de IA inválida.");
      }
    }

    const baseDraft = targetApplication
      ? hydrateProfileDraft(parseProfileData(targetApplication.profile_data))
      : buildProfileDraftFromApplication({
          name: sanitizedApplicant.name,
          email: sanitizedApplicant.email,
          category: sanitizedApplicant.category,
          location: sanitizedApplicant.location,
          website: sanitizedApplicant.website,
          description: sanitizedApplicant.description,
          source: normalizedSource,
        });

    const draft = sanitizeProfileDraft({
      ...baseDraft,
      ...(profile || {}),
      name: sanitizeText(profile?.name, 200) || sanitizedApplicant.name || baseDraft.name,
      email: sanitizedApplicant.email,
      location: sanitizeText(profile?.location, 200) || sanitizedApplicant.location || baseDraft.location,
      website: sanitizeText(profile?.website, 500) || sanitizedApplicant.website || baseDraft.website,
      verified: targetApplication ? Boolean(Number(targetApplication.verified)) : false,
      featured: targetApplication ? Boolean(Number(targetApplication.featured)) : false,
      founder_professional: targetApplication ? Boolean(baseDraft.founder_professional) : false,
    });
    const validationError = validateProfileDraft(draft);

    if (validationError) {
      throw new Error(validationError);
    }

    if (targetApplication) {
      const updateResult = await db.query(
        `
          UPDATE applications
          SET pending_profile_data = ?,
              pending_applicant_data = ?,
              profile_update_status = 'pending',
              profile_update_source = ?,
              profile_update_submitted_at = ${CURRENT_TIMESTAMP_SQL},
              updated_at = ${CURRENT_TIMESTAMP_SQL}
          WHERE id = ?
          RETURNING *
        `,
        [JSON.stringify(draft), JSON.stringify(sanitizedApplicant), normalizedSource, targetApplicationId],
      );

      await db.query(
        `UPDATE application_invites SET status = 'used', used_at = ${CURRENT_TIMESTAMP_SQL} WHERE id = ?`,
        [invite.id],
      );
      if (safeAiSessionId) {
        await db.query(
          `UPDATE ai_profile_sessions SET status = 'submitted', updated_at = ${CURRENT_TIMESTAMP_SQL} WHERE id = ? AND invite_id = ?`,
          [safeAiSessionId, invite.id],
        );
      }
      return mapRowToRecord(updateResult.rows[0]);
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
            ai_profile_session_id,
            applicant_description,
            profile_name,
            profile_slug,
            category_slug,
            verified,
            featured,
            publication_consent,
            completeness_status,
            profile_data
          )
          VALUES (
            ?,
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
            NULLIF(?, ''),
            ?,
            0,
            0,
            ?,
            'complete',
            ?
          )
          RETURNING *
        `,
        [
          invite.id,
          normalizedSource,
          sanitizedApplicant.name,
          sanitizedApplicant.email,
          sanitizedApplicant.category,
          sanitizedApplicant.location,
          sanitizedApplicant.website,
          sanitizedApplicant.referralCode,
          safeAiSessionId,
          sanitizedApplicant.description,
          draft.name,
          draft.slug,
          draft.category_slug,
          toDbBoolean(publicationConsent),
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

    if (safeAiSessionId) {
      await db.query(
        `
          UPDATE ai_profile_sessions
          SET status = 'submitted',
              updated_at = ${CURRENT_TIMESTAMP_SQL}
          WHERE id = ?
            AND invite_id = ?
        `,
        [safeAiSessionId, invite.id],
      );
    }

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

export function validateProfileDraft(draft) {
  if (!draft.name) return "Nome é obrigatório.";
  if (!draft.slug) return "Slug é obrigatório.";
  if (!draft.category_slug) return "Categoria é obrigatória.";
  if (!draft.role_title_pt) return "Título profissional em português é obrigatório.";
  if (!draft.short_bio_pt) return "Resumo em português é obrigatório.";
  if (!draft.full_about_pt) return "Texto sobre em português é obrigatório.";
  if (!draft.email) return "Email é obrigatório.";
  return "";
}

export function validateCompleteProfileDraft(draft) {
  const essentialError = validatePublishProfileDraft(draft);
  if (essentialError) return essentialError;
  if (!draft.location) return "Localização é obrigatória.";
  return "";
}

export function validatePublishProfileDraft(draft) {
  const essentialError = validateProfileDraft(draft);
  if (essentialError) return essentialError;
  if (!draft.service_1_title_pt) return "Título do primeiro serviço é obrigatório.";
  if (!draft.service_1_description_pt) return "Descrição do primeiro serviço é obrigatória.";
  return "";
}

export async function saveGeneratedBasicProfile(id, profile) {
  await ensureAdminSchema();
  const current = await getApplicationRecord(id);
  if (!current) throw new Error("Registro não encontrado.");
  if (!["pending", "approved"].includes(current.status) || !current.profile.verified || current.isPublished) {
    throw new Error("A candidatura precisa estar pendente ou aprovada, verificada e ainda não publicada.");
  }

  const draft = sanitizeProfileDraft({
    ...current.profile,
    ...profile,
    name: current.profile.name || current.applicant.name,
    email: current.applicant.email,
    verified: true,
    featured: current.profile.featured,
    founder_professional: current.profile.founder_professional,
  });
  const validationError = validateProfileDraft(draft);
  if (validationError) throw new Error(validationError);

  const result = await query(
    `
      UPDATE applications
      SET profile_name = ?,
          profile_slug = NULLIF(?, ''),
          category_slug = ?,
          verified = 1,
          profile_data = ?,
          completeness_status = 'basic',
          updated_at = ${CURRENT_TIMESTAMP_SQL}
      WHERE id = ?
      RETURNING *
    `,
    [draft.name, draft.slug, draft.category_slug, JSON.stringify(draft), id],
  );
  return mapRowToRecord(result.rows[0]);
}

export async function reviewPendingProfileUpdate(id, { action, profile, applicant }) {
  await ensureAdminSchema();
  const current = await getApplicationRecord(id);
  if (!current?.profileUpdate) throw new Error("Atualização pendente não encontrada.");

  const pendingProfile = sanitizeProfileDraft({
    ...current.profileUpdate.profile,
    ...(profile || {}),
    slug: current.profile.slug,
    verified: current.profile.verified,
    featured: current.profile.featured,
    founder_professional: current.profile.founder_professional,
  });
  const pendingApplicant = {
    ...current.applicant,
    ...(current.profileUpdate.applicant || {}),
    ...(applicant || {}),
  };
  const safeApplicant = {
    name: sanitizeText(pendingApplicant.name, 200),
    email: sanitizeText(pendingApplicant.email, 320).toLowerCase(),
    category: sanitizeText(pendingApplicant.category, 200),
    location: sanitizeText(pendingApplicant.location, 200),
    website: sanitizeText(pendingApplicant.website, 500),
    referralCode: current.applicant.referralCode,
    description: sanitizeText(pendingApplicant.description, 5000),
  };

  if (action === "approve") {
    if (!current.isPublished || !current.profile.verified || !current.publicationConsent) {
      throw new Error("O perfil publicado precisa estar verificado e autorizado.");
    }
    const validationError = validateCompleteProfileDraft(pendingProfile);
    if (validationError) throw new Error(validationError);
    const result = await query(
      `
        UPDATE applications
        SET applicant_name = ?, applicant_email = ?, applicant_category = ?, applicant_location = ?,
            applicant_website = ?, applicant_description = ?, profile_name = ?, category_slug = ?,
            profile_data = ?, completeness_status = 'complete', pending_profile_data = NULL,
            pending_applicant_data = NULL, profile_update_status = NULL, profile_update_source = '',
            profile_update_submitted_at = NULL, reviewed_at = ${CURRENT_TIMESTAMP_SQL},
            updated_at = ${CURRENT_TIMESTAMP_SQL}
        WHERE id = ?
        RETURNING *
      `,
      [
        safeApplicant.name, safeApplicant.email, safeApplicant.category, safeApplicant.location,
        safeApplicant.website, safeApplicant.description, pendingProfile.name, pendingProfile.category_slug,
        JSON.stringify(pendingProfile), id,
      ],
    );
    return mapRowToRecord(result.rows[0]);
  }

  const updateStatus = action === "reject" ? "rejected" : "pending";
  const result = await query(
    `
      UPDATE applications
      SET pending_profile_data = ?, pending_applicant_data = ?, profile_update_status = ?,
          updated_at = ${CURRENT_TIMESTAMP_SQL}
      WHERE id = ?
      RETURNING *
    `,
    [JSON.stringify(pendingProfile), JSON.stringify(safeApplicant), updateStatus, id],
  );
  return mapRowToRecord(result.rows[0]);
}

export async function updateApplicationRecord(id, { adminNotes, profile, status, applicant, publicationConsent, publish = false }) {
  await ensureAdminSchema();
  const current = await getApplicationRecord(id);
  if (!current) {
    throw new Error("Registro não encontrado.");
  }
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
  const validationError = publish ? validatePublishProfileDraft(draft) : "";
  const consent = publicationConsent === undefined ? current.publicationConsent : Boolean(publicationConsent);
  const storedProfileSlug = nextStatus === "approved" ? draft.slug : "";

  if (publish && nextStatus !== "approved") {
    throw new Error("A candidatura precisa estar aprovada antes da publicação.");
  }

  if (publish && !draft.verified) {
    throw new Error("Verifique a profissional antes de publicar o perfil.");
  }

  if (publish && !consent) {
    throw new Error("A autorização para publicação do perfil é obrigatória.");
  }

  if (publish && validationError) {
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
          publication_consent = ?,
          reviewed_at = CASE WHEN ? = 'pending' THEN reviewed_at ELSE ${CURRENT_TIMESTAMP_SQL} END,
          published_at = CASE WHEN ? = 1 THEN COALESCE(published_at, ${CURRENT_TIMESTAMP_SQL}) ELSE published_at END,
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
        storedProfileSlug,
        draft.category_slug,
        toDbBoolean(draft.verified),
        toDbBoolean(draft.featured),
        JSON.stringify(draft),
        toDbBoolean(consent),
        nextStatus,
        toDbBoolean(publish),
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
        publication_consent,
        completeness_status,
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
        ?,
        'basic',
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
      toDbBoolean(application.publicationConsent),
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
          AND published_at IS NOT NULL
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
