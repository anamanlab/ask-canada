'use client';
/**
 * Renders its children in the language of the answer when that isn't the interface language: a French
 * question asked in the English interface gets French prose and French sources, so the planner is French too
 * (its own strings, the shell's "Source" and "Checked" line, dates, money), marked up with `lang` so screen
 * readers pronounce it right. The interface's core strings for the other official language aren't on the
 * page, so they load on demand (once per language) while the planner's skeleton holds the place.
 */
import { use, type ReactNode } from 'react';
import type { Messages } from '@/lib/i18n/format';
import { I18nProvider, useLocale } from '@/lib/i18n/provider';
import type { Lang } from './types';

const CORE: Record<Lang, () => Promise<{ default: Messages }>> = {
  en: () => import('@/lib/i18n/messages/en.json'),
  fr: () => import('@/lib/i18n/messages/fr.json'),
};
const loaded = new Map<Lang, Promise<Messages>>();
function coreMessages(lang: Lang) {
  let p = loaded.get(lang);
  if (!p) {
    p = CORE[lang]().then((m) => m.default);
    loaded.set(lang, p);
  }
  return p;
}

/** Suspends while the language loads: wrap it in <Suspense>. */
export function AnswerLanguage({ lang, children }: { lang: Lang; children: ReactNode }) {
  const ui = useLocale();
  const core = use(coreMessages(lang));
  return (
    // Country-pack strings stay as they are (the shell only reads core ones); core strings switch language.
    <I18nProvider locale={lang} region={ui.region} currency={ui.currency} translated messages={{ ...ui.messages, ...core }}>
      <div lang={lang} dir="ltr">
        {children}
      </div>
    </I18nProvider>
  );
}

/**
 * While that language loads: the same switch with the strings already on the page. The planner's own strings
 * ship in both languages, so its skeleton holds the room of the plan as it will be written; only the shell's
 * few core words wait for the load.
 */
export function AnswerLanguagePending({ lang, children }: { lang: Lang; children: ReactNode }) {
  const ui = useLocale();
  return (
    <I18nProvider locale={lang} region={ui.region} currency={ui.currency} translated messages={ui.messages}>
      <div lang={lang} dir="ltr">
        {children}
      </div>
    </I18nProvider>
  );
}
