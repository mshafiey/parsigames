import { Hono } from 'hono';
import { getCookie, deleteCookie, setCookie } from 'hono/cookie';
import type { Env } from '../types';
import { validateAlias } from '../lib/alias';
import {
  findUserByAlias,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  logConsent,
} from '../lib/db';
import { getSession, destroySession, createSession } from '../lib/session';

const SESSION_COOKIE = 'pg_session';

const users = new Hono<{ Bindings: Env }>();

async function requireSession(c: any): Promise<{ userId: string } | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;
  return getSession(c.env.SESSIONS, sessionId);
}

users.post('/signup', async (c) => {
  const body = await c.req.json<{
    alias?: string;
    githubId?: string;
    email?: string;
    consent?: boolean;
  }>().catch(() => ({} as { alias?: string; githubId?: string; email?: string; consent?: boolean }));

  if (!body.consent) {
    return c.json({ error: 'consent_required' }, 400);
  }
  if (!body.githubId && !body.email) {
    return c.json({ error: 'missing_identity' }, 400);
  }

  const aliasCheck = validateAlias(body.alias ?? '');
  if (!aliasCheck.valid) {
    return c.json({ error: aliasCheck.error }, 400);
  }

  const existingAlias = await findUserByAlias(c.env.DB, body.alias!);
  if (existingAlias) {
    return c.json({ error: 'alias_taken' }, 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  await createUser(c.env.DB, {
    id: userId,
    alias: body.alias!,
    bio: null,
    skillTags: [],
    externalLinks: [],
    authProvider: body.githubId ? 'github' : 'magic-link',
    githubId: body.githubId ?? null,
    email: body.email ?? null,
    createdAt: now,
    consentTimestamp: now,
  });

  await logConsent(c.env.DB, userId, 'signup');

  const sessionId = await createSession(c.env.SESSIONS, userId);
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.json({ ok: true });
});

users.get('/users/:alias', async (c) => {
  const user = await findUserByAlias(c.env.DB, c.req.param('alias'));
  if (!user) return c.json({ error: 'not_found' }, 404);

  return c.json({
    alias: user.alias,
    bio: user.bio,
    skillTags: user.skillTags,
    externalLinks: user.externalLinks,
    createdAt: user.createdAt,
  });
});

users.get('/me', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const user = await findUserById(c.env.DB, session.userId);
  if (!user) return c.json({ error: 'unauthorized' }, 401);

  return c.json({
    id: user.id,
    alias: user.alias,
    bio: user.bio,
    skillTags: user.skillTags,
    externalLinks: user.externalLinks,
    email: user.email,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  });
});

users.put('/me', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json<{
    bio?: string | null;
    skillTags?: string[];
    externalLinks?: { label: string; url: string }[];
  }>().catch(() => ({} as { bio?: string | null; skillTags?: string[]; externalLinks?: { label: string; url: string }[] }));

  await updateUser(c.env.DB, session.userId, {
    bio: body.bio ?? null,
    skillTags: body.skillTags ?? [],
    externalLinks: body.externalLinks ?? [],
  });

  return c.json({ ok: true });
});

users.post('/me/delete', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  await logConsent(c.env.DB, session.userId, 'delete');
  await deleteUser(c.env.DB, session.userId);

  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) await destroySession(c.env.SESSIONS, sessionId);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });

  return c.json({ ok: true });
});

export default users;
