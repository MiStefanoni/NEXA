CREATE TABLE IF NOT EXISTS application_invites (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES application_invites(id);

CREATE INDEX IF NOT EXISTS applications_invite_id_idx ON applications (invite_id);
CREATE INDEX IF NOT EXISTS application_invites_status_expires_idx ON application_invites (status, expires_at DESC);
