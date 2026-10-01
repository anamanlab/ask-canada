/**
 * Server-side catalog loading: core UI strings + active country pack strings, with English
 * fallback for any missing key. Only the active locale's merged dictionary is sent to the client.
 *
 * To add a UI language: add `src/lib/i18n/messages/<locale>.json` (+ the pack's
 * `messages/<locale>.json`) and register them in the loaders below / in the pack.
 */
import 'server-only';
import type { Locale } from './config';
import type { Messages } from './format';
import { packServer as pack } from '@/countries/active.server';

type Loader = () => Promise<{ default: Messages }>;

const core: Partial<Record<Locale, Loader>> & { en: Loader } = {
  en: () => import('./messages/en.json'),
  fr: () => import('./messages/fr.json'),
  ar: () => import('./messages/ar.json'),
  fa: () => import('./messages/fa.json'),
  ur: () => import('./messages/ur.json'),
  pa: () => import('./messages/pa.json'),
  'zh-Hans': () => import('./messages/zh-Hans.json'),
  'zh-Hant': () => import('./messages/zh-Hant.json'),
};

export async function loadMessages(locale: Locale): Promise<{ messages: Messages; translated: boolean }> {
  const [coreEn, packEn] = await Promise.all([core.en(), pack.messages.en()]);
  const coreLoc = locale !== 'en' ? core[locale] : undefined;
  const packLoc = locale !== 'en' ? pack.messages[locale] : undefined;
  const [cl, pl] = await Promise.all([coreLoc?.(), packLoc?.()]);
  return {
    messages: { ...coreEn.default, ...packEn.default, ...(cl?.default ?? {}), ...(pl?.default ?? {}) },
    translated: locale === 'en' || Boolean(cl && pl),
  };
}

/** Core UI strings only (no pack strings), e.g. the English fallback for untranslated widgets. */
export async function loadCoreMessages(locale: Locale): Promise<Messages> {
  const en = (await core.en()).default;
  const loc = locale !== 'en' ? await core[locale]?.() : undefined;
  return { ...en, ...(loc?.default ?? {}) };
}

/** Which locales have a full UI catalog (core + pack). */
export function hasCatalog(locale: Locale) {
  return locale === 'en' || Boolean(core[locale] && pack.messages[locale]);
}
