'use client';
/**
 * Keeps the card in the answer's language. When someone asks in French on the English interface (or the
 * other way round), the answer, its sources and the tool's links are in the question's language, so the
 * card's copy, dates and links follow them instead of mixing two languages in one answer.
 * Only applies when the tool call named a language that differs from the interface. The core strings of that
 * language (source footer, "opens in a new tab") are fetched then, not bundled with every card.
 */
import { use, type ReactNode } from 'react';
import type { Messages } from '@/lib/i18n/format';
import { I18nProvider, useI18nContext } from '@/lib/i18n/provider';
import type { Lang } from './data';

const LOAD: Record<Lang, () => Promise<Messages>> = {
  en: () => import('@/lib/i18n/messages/en.json').then((m) => m.default),
  fr: () => import('@/lib/i18n/messages/fr.json').then((m) => m.default),
};
const loaded = new Map<Lang, Promise<Messages>>();
function core(lang: Lang) {
  let p = loaded.get(lang);
  if (!p) {
    p = LOAD[lang]();
    loaded.set(lang, p);
  }
  return p;
}

export function AnswerLang({ lang, children }: { lang?: Lang; children: ReactNode }) {
  const { locale } = useI18nContext();
  if ((lang !== 'en' && lang !== 'fr') || locale === lang) return <>{children}</>;
  return <Switched lang={lang}>{children}</Switched>;
}

/** Suspends (under the card's loading state) until the other language's core strings arrive. */
function Switched({ lang, children }: { lang: Lang; children: ReactNode }) {
  const ctx = useI18nContext();
  const messages = { ...ctx.messages, ...use(core(lang)) };
  return (
    <I18nProvider locale={lang} messages={messages} translated region={ctx.region} currency={ctx.currency} fallback={ctx.fallback}>
      <div lang={lang === 'fr' ? 'fr-CA' : 'en-CA'}>{children}</div>
    </I18nProvider>
  );
}
