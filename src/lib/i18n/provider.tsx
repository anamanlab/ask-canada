'use client';
/**
 * Client i18n runtime.
 *
 *   const { locale, dir, intl, t, fmt } = useLocale();
 *   t('composer.placeholder')                      // core + country strings
 *   t('chat.sources', { count: 3 })                // ICU-lite placeholders/plurals
 *   fmt.currency(163.5)  -> "$163.50" | "163,50 $"
 *   fmt.money(1200, { cents: 'never' })            // see `formatMoney` in ./format
 *   fmt.date('2026-10-29', { month: 'short', day: 'numeric' })
 *
 *   const { setLocale, pending } = useSetLocale(); // language switchers only
 *
 * `t`, `fmt`, `intl` and `dir` are built once per provider, so `useLocale()` is a plain context read.
 * Widgets with their own catalogs use `useMessages(catalog)` from `@/lib/i18n/widget`.
 */
import { createContext, use, useCallback, useEffect, useMemo, useTransition, type MouseEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, dirOf, intlTag, type Locale } from './config';
import { formatMessage, type MessageValues, type Messages } from './format';
import { makeFormatters, type Formatters } from './provider-formatters';

type ProviderProps = {
  locale: Locale;
  region: string;
  currency: string;
  messages: Messages;
  /** True when the UI catalog for this locale exists (else English UI + note). */
  translated: boolean;
  /**
   * English core strings, sent only for languages other than English/French: widgets whose own catalog
   * doesn't cover the language yet render in English with these (see `EnglishFallback`).
   */
  fallback?: Messages;
};

export type Translate = (key: string, values?: MessageValues) => string;

export type LocaleContext = ProviderProps & {
  /** Intl tag for formatting, e.g. `fr-CA`. */
  intl: string;
  /** Direction of the interface (answer-only languages keep the English, LTR interface). */
  dir: 'ltr' | 'rtl';
  t: Translate;
  fmt: Formatters;
};

const I18nContext = createContext<LocaleContext | null>(null);

export function I18nProvider({ children, locale, region, currency, messages, translated, fallback }: ProviderProps & { children: ReactNode }) {
  const value = useMemo<LocaleContext>(() => {
    const intl = intlTag(locale, region);
    const t: Translate = (key, values) => {
      const tpl = messages[key];
      if (tpl == null) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return formatMessage(tpl, values, intl);
    };
    return {
      locale,
      region,
      currency,
      messages,
      translated,
      fallback,
      intl,
      dir: dirOf(translated ? locale : 'en'),
      t,
      fmt: makeFormatters(intl, currency),
    };
  }, [locale, region, currency, messages, translated, fallback]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18nContext(): LocaleContext {
  const ctx = use(I18nContext);
  if (!ctx) throw new Error('useLocale must be used inside <I18nProvider>');
  return ctx;
}

/** The active language and its formatters. Stable between renders unless the language changes. */
export function useLocale(): LocaleContext {
  return useI18nContext();
}

/** Shorthand when only `t` is needed. */
export function useT(): Translate {
  return useI18nContext().t;
}

/**
 * Switch the interface language in place: sets the cookie, puts `?lang=` in the address bar and re-renders
 * the layouts. `pending` is true while the switch is in flight. Only language controls need this.
 */
export function useSetLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setLocale = useCallback(
    (next: Locale) => {
      try {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      } catch {}
      document.documentElement.dataset.locale = next;
      // The language lives in the URL too, so every language view can be bookmarked, shared and indexed.
      const url = new URL(window.location.href);
      url.searchParams.set('lang', next);
      // replace() puts the language in the address bar; refresh() re-renders the layouts (<html lang dir>,
      // header, footer) for it. Router actions run in order, so the refresh sees the new URL.
      startTransition(() => {
        router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
        router.refresh();
      });
    },
    [router],
  );
  return { setLocale, pending };
}

/** When this page hydrated (performance clock). Clicks from before that are left to the browser. */
let hydratedAt = Number.POSITIVE_INFINITY;
const markHydrated = () => {
  if (hydratedAt === Number.POSITIVE_INFINITY) hydratedAt = performance.now();
};

/** How long an in-place language switch may take before we fall back to a full page load. */
const SWITCH_FALLBACK_MS = 2500;
/** The one pending fallback, shared by every language link so repeated clicks replace it instead of stacking. */
let switchFallback: number | undefined;

/**
 * Props for a link to the same page in another language (the EN⇄FR toggle, "Commencer en français",
 * the footer link). It is a real link (`?lang=fr`, with `lang`/`hrefLang`), so it works before the app
 * has loaded and can be opened in a new tab; once loaded, a plain click switches in place.
 *
 * Feedback is immediate: while the switch is in flight the link is `aria-busy` and dims (globals.css
 * `a[aria-busy='true']`). If the in-place switch hasn't landed after 2.5s (slow device, busy network),
 * it falls back to loading the link normally, so the control never feels dead.
 *
 *   <a className="…" {...useLanguageLink('fr')}>Français</a>
 */
export function useLanguageLink(next: Locale) {
  const { setLocale, pending } = useSetLocale();
  useEffect(markHydrated, []);
  const href = `?lang=${next}`;
  return {
    href,
    lang: next,
    hrefLang: next,
    'aria-busy': pending ? true : undefined,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Before hydration (or a click React replays from then), let the real link navigate.
      if (e.timeStamp < hydratedAt) return;
      e.preventDefault();
      setLocale(next);
      const target = new URL(href, window.location.href);
      target.hash = window.location.hash;
      // Deliberately not cleared on unmount: the link may unmount mid-switch (a closing menu), and the
      // fallback must still run. It does nothing once the switch has landed.
      window.clearTimeout(switchFallback);
      switchFallback = window.setTimeout(() => {
        if (document.documentElement.dataset.locale === next && document.documentElement.lang !== next && !document.hidden) {
          window.location.assign(target.toString());
        }
      }, SWITCH_FALLBACK_MS);
    },
  };
}

/**
 * Renders its children entirely in English (strings, dates, numbers, LTR) inside another interface language,
 * for content that isn't translated yet (a widget without a catalog in this language).
 */
export function EnglishFallback({ children }: { children: ReactNode }) {
  const ctx = useI18nContext();
  if (ctx.locale === 'en') return <>{children}</>;
  return (
    <I18nProvider locale="en" messages={ctx.fallback ?? ctx.messages} translated region={ctx.region} currency={ctx.currency}>
      <div lang="en" dir="ltr">
        {children}
      </div>
    </I18nProvider>
  );
}
