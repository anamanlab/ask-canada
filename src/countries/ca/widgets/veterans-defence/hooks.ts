'use client';
/**
 * Small hooks shared by the veterans-defence widgets:
 *   useSavedList(key, label)  a list of ids starred on this device (shortlisted careers, starred programs)
 *   useListJoin()             "Army, Navy and Air Force" in Canada.ca style for the interface language
 */
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

/** Ids saved on this device only. `detail(next)` is the line shown in the privacy card after a change. */
export function useSavedList(key: string, label: string, detail: (next: string[]) => string) {
  const [stored, save] = useDeviceItem<string[]>(key, { label, kind: 'plan' });
  const ids = stored ?? [];
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    save(next, { detail: detail(next) });
  };
  return { ids, has: (id: string) => ids.includes(id), toggle };
}

export type ListJoin = (items: string[]) => string;

/**
 * Canada.ca style: no serial comma in English ("Army, Navy and Air Force"); French never uses one. Other
 * languages use their own list rules. One formatter per card list, not one per career card.
 */
export function useListJoin(): ListJoin {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const manual = locale === 'en' || locale.startsWith('en-') || locale === 'fr' || locale.startsWith('fr-');
  if (manual) {
    const and = t('list.and');
    return (items) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`);
  }
  const intl = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });
  return (items) => intl.format(items);
}
