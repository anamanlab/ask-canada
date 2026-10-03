'use client';
/** Footer language link: the same page in the other official language (a real link, works before JS). */
import { useLanguageLink, useLocale } from '@/lib/i18n/provider';
import { endonym, otherOfficial } from '@/lib/brand';

export function LangSwitchLink() {
  const { locale } = useLocale();
  const other = otherOfficial(locale);
  const link = useLanguageLink(other);
  return <a {...link}>{endonym(other)}</a>;
}
