'use client';
/**
 * Keeps a parks card in the answer's language. Someone who asks in French on the English interface (or the
 * other way round) gets the answer, its sources and the tool's park names and links in the question's
 * language, so the card's copy, numbers, dates and links follow them instead of mixing two languages in
 * one answer. Keyed on the language the tool call named, so it also holds while the card is loading.
 */
import type { ReactNode } from 'react';
import coreEn from '@/lib/i18n/messages/en.json';
import coreFr from '@/lib/i18n/messages/fr.json';
import { dirOf } from '@/lib/i18n/config';
import { I18nProvider, useI18nContext } from '@/lib/i18n/provider';
import type { Lang } from './data';

export function AnswerLang({ lang, children }: { lang?: Lang; children: ReactNode }) {
  const ctx = useI18nContext();
  if (!lang || ctx.locale === lang) return <>{children}</>;
  const flips = dirOf(ctx.locale) !== dirOf(lang);
  return (
    <I18nProvider locale={lang} messages={{ ...ctx.messages, ...(lang === 'fr' ? coreFr : coreEn) }} translated region={ctx.region} currency={ctx.currency}>
      <div lang={lang === 'fr' ? 'fr-CA' : 'en-CA'} {...(flips ? { dir: dirOf(lang) } : {})}>
        {children}
      </div>
    </I18nProvider>
  );
}
