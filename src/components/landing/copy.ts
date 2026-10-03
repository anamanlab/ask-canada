/**
 * The landing's copy and formatting for one request, shared by its sections (computed once per request).
 */
import 'server-only';
import { cache } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { packServer as pack } from '@/countries/active.server';
import { getT } from '@/lib/i18n/server-t';
import { formatMessage, type MessageValues, type Messages } from '@/lib/i18n/format';

/**
 * A pack may override its own catalog for the landing with more refined wording (`pack.landing`). Canada
 * does, in English and French. A pack with no override — Brazil — keeps its own translation for every key,
 * which is the point: one country's landing copy must never appear in another's interface.
 */
async function landingCatalog(locale: Locale): Promise<Messages> {
  const load = pack.landing?.[locale];
  if (!load) return {};
  return (await load()).default;
}

export const getLandingCopy = cache(async () => {
  const base = await getT();
  const { fmt, locale, intl } = base;
  // The pack's landing override: empty for a pack that has none, so its own catalog shows through.
  const own = await landingCatalog(locale);
  // Live data (holiday names, advisories) comes in the pack's official languages; tag it so it keeps its own direction.
  const L = (pack.locales.official.includes(locale) ? locale : (pack.locales.official[0] ?? 'en')) as Locale;
  return {
    /** `t` resolves the landing override first, then the pack + core catalog, then the key itself. */
    t: (key: string, values?: MessageValues) => {
      const override = own[key];
      return override == null ? base.t(key, values) : formatMessage(override, values, intl);
    },
    /**
     * A string the landing shows on its own, preferring the pack's `landing` override and falling back to the
     * merged catalog. A pack with no override therefore supplies these keys in its own messages file.
     */
    own: (key: string) => own[key] ?? base.t(key),
    fmt,
    locale,
    fr: locale === 'fr',
    L,
    dataLang: locale === L ? undefined : L,
    /** Whether the interface language is one of the pack's official ones (verbatim quotes stay in them). */
    official: pack.locales.official.includes(locale),
    // Chinese sets headline halves and inline phrases without a word space between them.
    sp: locale.startsWith('zh') ? '' : ' ',
    d: (iso: string, o: Intl.DateTimeFormatOptions) => fmt.date(iso, o),
    /** When the pack's static facts were last checked, short form ("Sep 29, 2026"). */
    checked: fmt.date(pack.showcase.factsChecked, { month: 'short', day: 'numeric', year: 'numeric' }),
  };
});

export type LandingCopy = Awaited<ReturnType<typeof getLandingCopy>>;