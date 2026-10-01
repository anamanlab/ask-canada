/**
 * The landing's copy and formatting for one request, shared by its sections (computed once per request).
 */
import 'server-only';
import { cache } from 'react';
import { packServer as pack } from '@/countries/active.server';
import { getT } from '@/lib/i18n/server-t';
import { landingOwn, landingText, withLandingCopy } from './messages';

export const getLandingCopy = cache(async () => {
  const base = await getT();
  const { fmt, locale } = base;
  const lt = landingText(locale);
  // Live data (holiday names, advisories) comes in English or French; tag it so it keeps its own direction.
  const L: 'en' | 'fr' = locale === 'fr' ? 'fr' : 'en';
  return {
    t: withLandingCopy(base.t, locale),
    lt,
    /** Copy the landing has only in English and French (`undefined` elsewhere). */
    own: landingOwn(locale),
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
