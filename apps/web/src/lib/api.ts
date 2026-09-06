export const API_BASE = 'https://api.parsigames.org';

export async function requestMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/auth/magic/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return res.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function completeSignup(payload: {
  alias: string;
  githubId?: string;
  email?: string;
  consent: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return res.ok ? { ok: true } : { ok: false, error: data.error };
}
