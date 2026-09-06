import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, getSession, destroySession } from '../src/lib/session';

class FakeKV {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('session helpers', () => {
  let kv: FakeKV;

  beforeEach(() => {
    kv = new FakeKV();
  });

  it('createSession returns a session id and stores the userId', async () => {
    const sessionId = await createSession(kv as any, 'user-123');
    expect(sessionId.length).toBeGreaterThan(0);
    const session = await getSession(kv as any, sessionId);
    expect(session).toEqual({ userId: 'user-123' });
  });

  it('getSession returns null for an unknown session id', async () => {
    const session = await getSession(kv as any, 'nonexistent');
    expect(session).toBeNull();
  });

  it('destroySession removes the session', async () => {
    const sessionId = await createSession(kv as any, 'user-123');
    await destroySession(kv as any, sessionId);
    const session = await getSession(kv as any, sessionId);
    expect(session).toBeNull();
  });
});
