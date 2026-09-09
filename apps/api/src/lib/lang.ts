export function resolveLang(raw: string | undefined): 'fa' | 'en' {
  return raw === 'fa' ? 'fa' : 'en';
}
