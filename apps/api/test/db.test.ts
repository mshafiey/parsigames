import { describe, it, expect, beforeEach } from 'vitest';
import {
  findUserByGithubId,
  findUserByEmail,
  findUserByAlias,
  createUser,
  updateUser,
  deleteUser,
  logConsent,
} from '../src/lib/db';

class FakeRow {
  constructor(private data: Record<string, unknown> | null) {}
  async first() {
    return this.data;
  }
}

class FakeD1 {
  users: Record<string, unknown>[] = [];
  consentLog: Record<string, unknown>[] = [];

  prepare(sql: string) {
    const self = this;
    return {
      bind(...args: unknown[]) {
        return {
          async run() {
            if (sql.startsWith('INSERT INTO users')) {
              self.users.push({
                id: args[0], alias: args[1], bio: args[2], skill_tags: args[3],
                external_links: args[4], auth_provider: args[5], github_id: args[6],
                email: args[7], created_at: args[8], consent_timestamp: args[9],
              });
            } else if (sql.startsWith('INSERT INTO consent_log')) {
              self.consentLog.push({ id: args[0], user_id: args[1], action: args[2], timestamp: args[3] });
            } else if (sql.startsWith('UPDATE users')) {
              const row = self.users.find((u) => u.id === args[args.length - 1]);
              if (row) {
                row.bio = args[0];
                row.skill_tags = args[1];
                row.external_links = args[2];
              }
            } else if (sql.startsWith('DELETE FROM users')) {
              self.users = self.users.filter((u) => u.id !== args[0]);
            }
            return { success: true };
          },
          first() {
            if (sql.includes('github_id = ?')) {
              return Promise.resolve(self.users.find((u) => u.github_id === args[0]) ?? null);
            }
            if (sql.includes('email = ?')) {
              return Promise.resolve(self.users.find((u) => u.email === args[0]) ?? null);
            }
            if (sql.includes('alias = ?')) {
              return Promise.resolve(self.users.find((u) => u.alias === args[0]) ?? null);
            }
            if (sql.includes('id = ?')) {
              return Promise.resolve(self.users.find((u) => u.id === args[0]) ?? null);
            }
            return Promise.resolve(null);
          },
        };
      },
    };
  }
}

describe('db helpers', () => {
  let db: FakeD1;

  beforeEach(() => {
    db = new FakeD1();
  });

  it('createUser then findUserByAlias returns the created user', async () => {
    await createUser(db as any, {
      id: 'u1', alias: 'nima', bio: null, skillTags: [], externalLinks: [],
      authProvider: 'github', githubId: 'gh1', email: null,
      createdAt: '2026-01-01T00:00:00Z', consentTimestamp: '2026-01-01T00:00:00Z',
    });
    const found = await findUserByAlias(db as any, 'nima');
    expect(found?.id).toBe('u1');
    expect(found?.authProvider).toBe('github');
  });

  it('findUserByGithubId returns null when no match', async () => {
    const found = await findUserByGithubId(db as any, 'nonexistent');
    expect(found).toBeNull();
  });

  it('findUserByEmail returns the matching user', async () => {
    await createUser(db as any, {
      id: 'u2', alias: 'sara', bio: null, skillTags: [], externalLinks: [],
      authProvider: 'magic-link', githubId: null, email: 'sara@example.com',
      createdAt: '2026-01-01T00:00:00Z', consentTimestamp: '2026-01-01T00:00:00Z',
    });
    const found = await findUserByEmail(db as any, 'sara@example.com');
    expect(found?.id).toBe('u2');
  });

  it('updateUser changes bio and skillTags', async () => {
    await createUser(db as any, {
      id: 'u3', alias: 'lila', bio: null, skillTags: [], externalLinks: [],
      authProvider: 'magic-link', githubId: null, email: 'lila@example.com',
      createdAt: '2026-01-01T00:00:00Z', consentTimestamp: '2026-01-01T00:00:00Z',
    });
    await updateUser(db as any, 'u3', { bio: 'hello', skillTags: ['programming'], externalLinks: [] });
    const found = await findUserByAlias(db as any, 'lila');
    expect(found?.bio).toBe('hello');
    expect(found?.skillTags).toEqual(['programming']);
  });

  it('deleteUser removes the row', async () => {
    await createUser(db as any, {
      id: 'u4', alias: 'kian', bio: null, skillTags: [], externalLinks: [],
      authProvider: 'magic-link', githubId: null, email: 'kian@example.com',
      createdAt: '2026-01-01T00:00:00Z', consentTimestamp: '2026-01-01T00:00:00Z',
    });
    await deleteUser(db as any, 'u4');
    const found = await findUserByAlias(db as any, 'kian');
    expect(found).toBeNull();
  });

  it('logConsent records an entry', async () => {
    await logConsent(db as any, 'u5', 'signup');
    expect(db.consentLog).toHaveLength(1);
    expect(db.consentLog[0].action).toBe('signup');
  });
});
