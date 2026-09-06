export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  FRONTEND_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
}

export interface User {
  id: string;
  alias: string;
  bio: string | null;
  skillTags: string[];
  externalLinks: { label: string; url: string }[];
  authProvider: 'github' | 'magic-link';
  githubId: string | null;
  email: string | null;
  createdAt: string;
  consentTimestamp: string;
}
