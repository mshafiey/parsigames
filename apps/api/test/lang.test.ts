import { describe, it, expect } from 'vitest';
import { resolveLang } from '../src/lib/lang';

describe('resolveLang', () => {
  it('returns fa when raw is exactly "fa"', () => {
    expect(resolveLang('fa')).toBe('fa');
  });

  it('returns en when raw is exactly "en"', () => {
    expect(resolveLang('en')).toBe('en');
  });

  it('returns en when raw is undefined', () => {
    expect(resolveLang(undefined)).toBe('en');
  });

  it('returns en when raw is an unexpected value', () => {
    expect(resolveLang('de')).toBe('en');
    expect(resolveLang('')).toBe('en');
    expect(resolveLang('FA')).toBe('en');
  });
});
