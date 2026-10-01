'use client';
/** Footer language link: the same page in the other official language (a real link, works before JS). */
import { useLanguageLink, useLocale } from '@/lib/i18n/provider';

export function LangSwitchLink() {
  const { locale } = useLocale();
  const other = locale === 'fr' ? 'en' : 'fr';
  const link = useLanguageLink(other);
  return <a {...link}>{other === 'fr' ? 'Français' : 'English'}</a>;
}
