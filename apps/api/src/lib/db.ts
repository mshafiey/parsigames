import type { User } from '../types';

function rowToUser(row: any): User {
  return {
    id: row.id,
    alias: row.alias,
    bio: row.bio,
    skillTags: JSON.parse(row.skill_tags),
    externalLinks: JSON.parse(row.external_links),
    authProvider: row.auth_provider,
    githubId: row.github_id,
    email: row.email,
    createdAt: row.created_at,
    consentTimestamp: row.consent_timestamp,
  };
}

export async function findUserByGithubId(db: D1Database, githubId: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE github_id = ?').bind(githubId).first();
  return row ? rowToUser(row) : null;
}

export async function findUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  return row ? rowToUser(row) : null;
}

export async function findUserByAlias(db: D1Database, alias: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE alias = ?').bind(alias).first();
  return row ? rowToUser(row) : null;
}

export async function findUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return row ? rowToUser(row) : null;
}

export async function createUser(db: D1Database, user: User): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users
        (id, alias, bio, skill_tags, external_links, auth_provider, github_id, email, created_at, consent_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      user.id, user.alias, user.bio, JSON.stringify(user.skillTags), JSON.stringify(user.externalLinks),
      user.authProvider, user.githubId, user.email, user.createdAt, user.consentTimestamp
    )
    .run();
}

export async function updateUser(
  db: D1Database,
  id: string,
  fields: { bio: string | null; skillTags: string[]; externalLinks: { label: string; url: string }[] }
): Promise<void> {
  await db
    .prepare('UPDATE users SET bio = ?, skill_tags = ?, external_links = ? WHERE id = ?')
    .bind(fields.bio, JSON.stringify(fields.skillTags), JSON.stringify(fields.externalLinks), id)
    .run();
}

export async function deleteUser(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
}

export async function logConsent(db: D1Database, userId: string, action: 'signup' | 'delete'): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO consent_log (id, user_id, action, timestamp) VALUES (?, ?, ?, ?)')
    .bind(id, userId, action, new Date().toISOString())
    .run();
}
