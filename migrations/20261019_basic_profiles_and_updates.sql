ALTER TABLE application_invites ADD COLUMN application_id INTEGER REFERENCES applications(id);

ALTER TABLE applications ADD COLUMN publication_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE applications ADD COLUMN completeness_status TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE applications ADD COLUMN pending_profile_data TEXT;
ALTER TABLE applications ADD COLUMN pending_applicant_data TEXT;
ALTER TABLE applications ADD COLUMN profile_update_status TEXT;
ALTER TABLE applications ADD COLUMN profile_update_source TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN profile_update_submitted_at TEXT;

UPDATE applications
SET completeness_status = 'complete'
WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS application_invites_application_id_idx
  ON application_invites (application_id, status, expires_at DESC);

CREATE INDEX IF NOT EXISTS applications_profile_update_status_idx
  ON applications (profile_update_status, profile_update_submitted_at DESC);
