/**
 * Per-widget catalogs.
 *
 *   // widgets/<id>/messages/index.ts
 *   import en from './en.json'; import fr from './fr.json';
 *   export default defineMessages({ en, fr });
 *
 *   // in a component
 *   const t = useMessages(messages);
 *   t('planner.title', { count: 3 })
 *
 * Missing locales/keys fall back to English. The localization phase adds more JSON files.
 * (No 'use client': `defineMessages` is also used by server code, and the hook only runs in client components.)
 */
import { useCallback } from 'react';
import type { Locale } from './config';
import { formatMessage, type MessageValues, type Messages } from './format';
import { useLocale } from './provider';

export type Catalog = Partial<Record<Locale, Messages>> & { en: Messages };

export function defineMessages<T extends Catalog>(catalog: T): T {
  return catalog;
}

export function useMessages(catalog: Catalog) {
  const { locale, intl } = useLocale();
  return useCallback(
    (key: string, values?: MessageValues) => {
      const tpl = catalog[locale]?.[key] ?? catalog.en[key];
      if (tpl == null) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing widget key: ${key}`);
        return key;
      }
      return formatMessage(tpl, values, intl);
    },
    [catalog, locale, intl],
  );
}
