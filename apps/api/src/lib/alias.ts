const ALIAS_PATTERN = /^[a-z0-9_-]+$/;
const RESERVED = new Set(['admin', 'api', 'root', 'parsigames', 'moderator']);

export function validateAlias(alias: string): { valid: boolean; error?: string } {
  if (alias.length < 3) return { valid: false, error: 'too_short' };
  if (alias.length > 32) return { valid: false, error: 'too_long' };
  if (!ALIAS_PATTERN.test(alias)) return { valid: false, error: 'invalid_characters' };
  if (RESERVED.has(alias.toLowerCase())) return { valid: false, error: 'reserved' };
  return { valid: true };
}
