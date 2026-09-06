import { describe, it, expect } from 'vitest';
import { validateAlias } from '../src/lib/alias';

describe('validateAlias', () => {
  it('accepts a normal alias', () => {
    expect(validateAlias('nima_dev')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    expect(validateAlias('').valid).toBe(false);
  });

  it('rejects aliases shorter than 3 characters', () => {
    expect(validateAlias('ab').valid).toBe(false);
  });

  it('rejects aliases longer than 32 characters', () => {
    expect(validateAlias('a'.repeat(33)).valid).toBe(false);
  });

  it('rejects aliases with spaces', () => {
    expect(validateAlias('nima dev').valid).toBe(false);
  });

  it('rejects aliases with characters outside a-z0-9_-', () => {
    expect(validateAlias('nima@dev').valid).toBe(false);
  });

  it('accepts hyphens and underscores', () => {
    expect(validateAlias('nima-dev_2').valid).toBe(true);
  });

  it('rejects the reserved word "admin"', () => {
    expect(validateAlias('admin').valid).toBe(false);
  });
});
