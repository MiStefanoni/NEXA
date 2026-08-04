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

CREATE INDEX IF NOT EXISTS applications_invite_id_idx ON applications (invite_id);
CREATE INDEX IF NOT EXISTS application_invites_status_expires_idx ON application_invites (status, expires_at DESC);
