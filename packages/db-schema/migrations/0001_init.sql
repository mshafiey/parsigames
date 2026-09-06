CREATE TABLE users (
  id TEXT PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL,
  bio TEXT,
  skill_tags TEXT NOT NULL DEFAULT '[]',
  external_links TEXT NOT NULL DEFAULT '[]',
  auth_provider TEXT NOT NULL,
  github_id TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL,
  consent_timestamp TEXT NOT NULL,
  data_retention_flag TEXT
);

CREATE TABLE consent_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE magic_link_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens(email);
