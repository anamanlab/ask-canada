/**
 * Request-scoped locale + theme resolution (server only).
 * Order: `?lang=` (set by src/proxy.ts as x-ac-locale) -> `lang` cookie -> Accept-Language -> pack default.
 */
import 'server-only';
import { cookies, headers } from 'next/headers';
import { pack } from '@/countries/active';
import { LOCALE_COOKIE, THEME_COOKIE, isLocale, matchAcceptLanguage, type Locale } from './config';

export type ThemePref = 'light' | 'dark' | 'system';

export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  const fromProxy = h.get('x-ac-locale');
  const supported = pack.locales.supported;
  if (isLocale(fromProxy) && supported.includes(fromProxy)) return fromProxy;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c) && supported.includes(c)) return c;
  return matchAcceptLanguage(h.get('accept-language'), supported) ?? pack.locales.default;
}

export async function getRequestTheme(): Promise<ThemePref> {
  const h = await headers();
  const v = h.get('x-ac-theme') ?? (await cookies()).get(THEME_COOKIE)?.value;
  return v === 'light' || v === 'dark' ? v : 'system';
}

export async function getNonce(): Promise<string | undefined> {
  return (await headers()).get('x-nonce') ?? undefined;
}

/** `?dir=rtl` (via src/proxy.ts) forces right-to-left layout for testing mirroring. */
export async function getForcedDir(): Promise<'rtl' | 'ltr' | null> {
  const v = (await headers()).get('x-ac-dir');
  return v === 'rtl' || v === 'ltr' ? v : null;
}

/**
 * Canonical + hreflang alternates for a page. Every language has its own shareable, indexable URL
 * (`?lang=fr`); the bare path is the x-default (language negotiated from the cookie / browser).
 */
export async function languageAlternates(path: string) {
  const locale = await getRequestLocale();
  const languages: Record<string, string> = { 'x-default': path };
  for (const l of pack.locales.official) languages[`${l}-${pack.region}`] = `${path}?lang=${l}`;
  return { canonical: `${path}?lang=${locale}`, languages };
}
