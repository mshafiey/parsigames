import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import type { Env } from '../types';
import { findUserByGithubId } from '../lib/db';
import { createSession } from '../lib/session';
import { generateToken } from '../lib/token';

const SESSION_COOKIE = 'pg_session';
const STATE_COOKIE = 'pg_oauth_state';

const auth = new Hono<{ Bindings: Env }>();

auth.get('/github/start', (c) => {
  const state = generateToken();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
  });

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', c.env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${new URL(c.req.url).origin}/auth/github/callback`);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);

  return c.redirect(url.toString());
});

auth.get('/github/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const expectedState = getCookie(c, STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_failed`);
  }

  let githubUser: { id: number; login: string };

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'parsigames',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!userResponse.ok) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    githubUser = (await userResponse.json()) as { id: number; login: string };
  } catch {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const githubId = String(githubUser.id);

  const existing = await findUserByGithubId(c.env.DB, githubId);

  if (!existing) {
    const url = new URL(`${c.env.FRONTEND_URL}/signup`);
    url.searchParams.set('githubId', githubId);
    url.searchParams.set('suggested', githubUser.login);
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

  return c.redirect(`${c.env.FRONTEND_URL}/me/edit`);
});

export default auth;
