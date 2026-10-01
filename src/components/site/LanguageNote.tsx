'use client';
/**
 * One-line note under the header for a language that has answers but no interface catalog yet:
 *   "Español: Respuestas en español · por ahora, menús en inglés — Answers in Spanish · menus in English for now"
 * Written first in the chosen language (when reviewed wording exists), then in English, so the person
 * knows why the menus around their answers are English. Dismissible; the choice is remembered per language
 * on this device (a convenience only; nothing is sent anywhere).
 */
import { Globe, X } from 'lucide-react';
import { useDeviceItem } from '@/lib/device-store';
import { localeInfo } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/provider';

/** Unlisted (no label): not something the person saved, but "Clear this device" still removes it. */
const DISMISSED = { label: '', kind: 'preference' } as const;

export function LanguageNote() {
  const { t, locale, translated } = useLocale();
  const [dismissed, setDismissed] = useDeviceItem<string>('pref:langnote', DISMISSED);
  if (translated || locale === 'en' || dismissed === locale) return null;
  const info = localeInfo(locale);
  return (
    <aside className="ac-langnote" aria-label={t('lang.title')}>
      <Globe className="ac-langnote__icon" aria-hidden strokeWidth={1.8} />
      <p className="ac-langnote__text">
        <bdi lang={locale} dir={info.dir}>
          <b>{info.endonym}</b>
          {info.answerNote ? <span className="ac-langnote__note">: {info.answerNote}</span> : null}
        </bdi>
        <span className="ac-langnote__en">{t('lang.banner', { language: info.english.replace(/ \(.*\)$/, '') })}</span>
      </p>
      <button type="button" className="ac-langnote__close" onClick={() => setDismissed(locale)} aria-label={t('action.close')}>
        <X className="size-4" aria-hidden />
      </button>
    </aside>
  );
}
