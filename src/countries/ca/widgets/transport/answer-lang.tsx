'use client';
/**
 * A widget speaks the language of the answer it belongs to. Someone who types « Revenir au Canada avec mon chien »
 * in the English interface gets a French answer with French sources and links (the tool's `lang`), so the widget's
 * own words, dates and numbers switch to French too, and the reverse. The interface language still decides when the
 * tool call names no language, and for languages other than English and French (the core picks those).
 */
import { lazy, use, useMemo, type ComponentType, type ReactNode } from 'react';
import type { Messages } from '@/lib/i18n/format';
import { I18nProvider, useLocale } from '@/lib/i18n/provider';
import type { WidgetProps } from '@/lib/widgets/types';
import type { Lang } from './constants';

/**
 * Core strings the shared primitives use inside a widget (source footer, "opens in a new tab"), in the answer's
 * language. Fetched only when an answer's language differs from the interface's, and once per language: neither
 * catalog is part of the widget's entry chunk.
 */
const loaders: Record<Lang, () => Promise<{ default: Messages }>> = {
  en: () => import('@/lib/i18n/messages/en.json'),
  fr: () => import('@/lib/i18n/messages/fr.json'),
};
const loaded = new Map<Lang, Promise<Messages>>();
function coreMessages(lang: Lang): Promise<Messages> {
  let promise = loaded.get(lang);
  if (!promise) {
    promise = loaders[lang]().then((m) => m.default);
    loaded.set(lang, promise);
  }
  return promise;
}

function AnswerLang({ lang, children }: { lang: Lang | undefined; children: ReactNode }) {
  const { locale } = useLocale();
  const other = lang && (locale === 'en' || locale === 'fr') && lang !== locale ? lang : null;
  return other ? <OtherLang lang={other}>{children}</OtherLang> : children;
}

/** The subtree in the other official language (suspends, under the chat's widget skeleton, while its strings load). */
function OtherLang({ lang, children }: { lang: Lang; children: ReactNode }) {
  const ctx = useLocale();
  const core = use(coreMessages(lang));
  const messages = useMemo(() => ({ ...ctx.messages, ...core }), [ctx.messages, core]);
  return (
    <I18nProvider locale={lang} messages={messages} translated region={ctx.region} currency={ctx.currency} fallback={ctx.fallback}>
      <div lang={lang} className="contents">
        {children}
      </div>
    </I18nProvider>
  );
}

/**
 * A renderer in its own chunk (an answer about boating doesn't download the EV calculator; the chat shows its
 * loading skeleton while the chunk arrives) that follows the language its tool call asked for (`input.lang`).
 */
export function inAnswerLang<I extends { lang?: Lang }, O>(name: string, load: () => Promise<ComponentType<WidgetProps<I, O>>>) {
  const Renderer = lazy(() => load().then((component) => ({ default: component })));
  function Localized(props: WidgetProps<I, O>) {
    const lang = props.part.input?.lang;
    return (
      <AnswerLang lang={lang === 'en' || lang === 'fr' ? lang : undefined}>
        <Renderer {...props} />
      </AnswerLang>
    );
  }
  Localized.displayName = `inAnswerLang(${name})`;
  return Localized;
}
