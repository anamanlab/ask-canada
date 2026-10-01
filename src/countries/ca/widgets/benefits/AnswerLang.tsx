'use client';
/**
 * Renders the widget in the language of the answer it belongs to. The model (or a scripted answer) passes `lang`
 * to the tool: a French question in an English interface gets a French answer, so the widget, its numbers, dates
 * and sources must be French too (and the other way around), never a mix of both official languages.
 *
 * That is the rare case, so the other language's core catalogue is fetched only then (its own chunk), never
 * shipped with the widget. `fallback` (the widget's skeleton) holds its place meanwhile, so the answer doesn't jump.
 *
 * Core request on file (this file goes when it lands): a core `<AnswerLocale lang fallback>` (or a `useLocale({ lang })`
 * override) that owns the catalogue loading, so no widget imports `@/lib/i18n/messages/*` or rebuilds the provider.
 */
import { Suspense, use, type ReactNode } from 'react';
import { I18nProvider, useI18nContext } from '@/lib/i18n/provider';
import type { Lang } from './rates';

type Catalogue = Record<string, string>;

const LOADERS: Record<Lang, () => Promise<Catalogue>> = {
  en: () => import('@/lib/i18n/messages/en.json').then((m) => m.default),
  fr: () => import('@/lib/i18n/messages/fr.json').then((m) => m.default),
};
const loaded: Partial<Record<Lang, Promise<Catalogue>>> = {};
/** One request per language; if it fails, the widget keeps the interface's core strings. */
const catalogue = (lang: Lang) => (loaded[lang] ??= LOADERS[lang]().catch(() => ({})));

export function AnswerLang({ lang, fallback, children }: { lang?: string | null; fallback: ReactNode; children: ReactNode }) {
  const ctx = useI18nContext();
  const target = lang === 'fr' || lang === 'en' ? lang : null;
  const switchTo = target && target !== ctx.locale && (ctx.locale === 'en' || ctx.locale === 'fr') ? target : null;
  if (!switchTo) return <>{children}</>;
  return (
    <Suspense fallback={fallback}>
      <Switched to={switchTo}>{children}</Switched>
    </Suspense>
  );
}

function Switched({ to, children }: { to: Lang; children: ReactNode }) {
  const ctx = useI18nContext();
  const messages = { ...ctx.messages, ...use(catalogue(to)) };
  return (
    <I18nProvider locale={to} messages={messages} translated region={ctx.region} currency={ctx.currency} fallback={ctx.fallback}>
      <div lang={to}>{children}</div>
    </I18nProvider>
  );
}
