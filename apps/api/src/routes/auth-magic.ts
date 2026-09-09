import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import type { Env } from '../types';
import { generateToken } from '../lib/token';
import { createSession } from '../lib/session';
import { findUserByEmail } from '../lib/db';
import { sendMagicLinkEmail } from '../lib/email';
import { resolveLang } from '../lib/lang';

const SESSION_COOKIE = 'pg_session';
const LANG_COOKIE = 'pg_lang';
const TOKEN_TTL_MINUTES = 15;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

const magic = new Hono<{ Bindings: Env }>();

magic.post('/magic/request', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({} as { email?: string }));
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return c.json({ error: 'invalid_email' }, 400);
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const recentCount = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM magic_link_tokens WHERE email = ? AND expires_at > ?')
    .bind(email, windowStart)
    .first<{ count: number }>();

  if (recentCount && recentCount.count >= RATE_LIMIT_MAX) {
    return c.json({ error: 'rate_limited' }, 429);
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

  await c.env.DB
    .prepare('INSERT INTO magic_link_tokens (token, email, expires_at) VALUES (?, ?, ?)')
    .bind(token, email, expiresAt)
    .run();

  const verifyUrl = new URL(`${c.env.FRONTEND_URL}/auth/magic-verify`);
  verifyUrl.searchParams.set('token', token);

  try {
    await sendMagicLinkEmail(c.env.RESEND_API_KEY, email, verifyUrl.toString());
  } catch {
    return c.json({ error: 'email_send_failed' }, 502);
  }

  return c.json({ ok: true });
});

magic.get('/magic/verify', async (c) => {
  const lang = resolveLang(getCookie(c, LANG_COOKIE));
  const token = c.req.query('token');
  if (!token) return c.redirect(`${c.env.FRONTEND_URL}/${lang}/login/?error=link_invalid`);

  const row = await c.env.DB
    .prepare('SELECT * FROM magic_link_tokens WHERE token = ?')
    .bind(token)
    .first<{ email: string; expires_at: string; consumed_at: string | null }>();

  if (!row || row.consumed_at || new Date(row.expires_at) < new Date()) {
    return c.redirect(`${c.env.FRONTEND_URL}/${lang}/login/?error=link_invalid`);
  }

  await c.env.DB
    .prepare('UPDATE magic_link_tokens SET consumed_at = ? WHERE token = ?')
    .bind(new Date().toISOString(), token)
    .run();

  const existing = await findUserByEmail(c.env.DB, row.email);

  if (!existing) {
    const url = new URL(`${c.env.FRONTEND_URL}/${lang}/signup/`);
    url.searchParams.set('email', row.email);
    return c.redirect(url.toString());
  }

  const sessionId = await createSession(c.env.SESSIONS, existing.id);
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.redirect(`${c.env.FRONTEND_URL}/${lang}/me/edit/`);
});

export default magic;
