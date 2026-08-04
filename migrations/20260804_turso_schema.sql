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

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS applications_category_slug_idx ON applications (category_slug);
CREATE INDEX IF NOT EXISTS applications_invite_id_idx ON applications (invite_id);
CREATE INDEX IF NOT EXISTS application_invites_status_expires_idx ON application_invites (status, expires_at DESC);
