import { describe, it, expect } from 'vitest';
import { generateToken } from '../src/lib/token';

describe('generateToken', () => {
  it('generates a url-safe string of at least 32 characters', () => {
    const token = generateToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });

  it('generates a different token on each call', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});
