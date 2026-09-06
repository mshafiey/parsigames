import { generateToken } from './token';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function createSession(kv: KVNamespace, userId: string): Promise<string> {
  const sessionId = generateToken();
  await kv.put(sessionId, JSON.stringify({ userId }), { expirationTtl: SESSION_TTL_SECONDS });
  return sessionId;
}

export async function getSession(kv: KVNamespace, sessionId: string): Promise<{ userId: string } | null> {
  const raw = await kv.get(sessionId);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function destroySession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(sessionId);
}
