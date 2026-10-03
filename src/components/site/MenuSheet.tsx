'use client';
/**
 * The Services sheet: every service area (each opens a chat with a good starter question), appearance,
 * emergency numbers and policy pages, with the essentials pinned at the bottom (language, privacy,
 * clear this device, the official site) so the sheet is complete on its own. Its contents render only once
 * the sheet is first opened (see `Sheet`).
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Globe, Landmark, Lock, Phone } from 'lucide-react';
import { pack } from '@/countries/active';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { useChatActions } from '@/components/chat/actions';
import { useDeviceItems } from '@/lib/device-store';
import { useThemePref } from '@/lib/hooks';
import { localeInfo } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/provider';
import { ClearDeviceButton } from './ClearDevice';
import { LanguagePicker } from './LanguagePicker';
import { setThemePref } from './theme';

/** How long after the language picker starts to slide away the Menu follows it. */
const PICKED_CLOSE_MS = 90;

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  // Closing the Menu a beat after the picker (see onPicked); dropped if the Menu unmounts first.
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(closing.current), []);

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={t('menu.sheetTitle')}
        description={t('menu.description')}
        footer={<MenuEssentials onClose={onClose} onLanguage={() => setLangOpen(true)} />}
      >
        <MenuBody onClose={onClose} />
      </Sheet>
      <LanguagePicker
        open={langOpen}
        onClose={() => setLangOpen(false)}
        onPicked={() => {
          // Commit and dismiss: the picker slides away, then the Menu, and focus returns to the Menu button.
          setLangOpen(false);
          clearTimeout(closing.current);
          closing.current = setTimeout(onClose, PICKED_CLOSE_MS);
        }}
      />
    </>
  );
}

/** Pinned at the bottom: language, privacy, clear this device, the official site. */
function MenuEssentials({ onClose, onLanguage }: { onClose: () => void; onLanguage: () => void }) {
  const { t, locale } = useLocale();
  return (
    <ul className="ac-menu-foot m-0 list-none p-0" aria-label={t('menu.essentials')}>
      <li>
        <button type="button" onClick={onLanguage} aria-haspopup="dialog">
          <Globe className="size-4" strokeWidth={1.8} aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            <span className="ac-menu-foot__k">
              {t('menu.language')} <span className="text-ink-3">·</span>{' '}
            </span>
            <span lang={locale}>{localeInfo(locale).endonym}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-3 flip-rtl" aria-hidden />
        </button>
      </li>
      <li>
        <Link href="/privacy" onClick={onClose}>
          <Lock className="size-4" strokeWidth={1.8} aria-hidden />
          {t('footer.privacyControls')}
        </Link>
      </li>
      <li>
        <ClearDeviceButton variant="link" withIcon />
      </li>
      <li>
        <a href={pack.officialHome[locale] ?? pack.officialHome.en} target="_blank" rel="noopener noreferrer">
          <Landmark className="size-4" strokeWidth={1.8} aria-hidden />
          {pack.officialHomeLabel}
          <ArrowUpRight className="size-4 flip-rtl" strokeWidth={1.8} aria-hidden />
          <span className="sr-only"> {t('a11y.newTab')}</span>
        </a>
      </li>
    </ul>
  );
}

function MenuBody({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const { send } = useChatActions();
  const items = useDeviceItems();
  const theme = useThemePref();
  return (
    <>
      <nav aria-label={t('menu.services')}>
        <h3 className="sr-only">{t('menu.services')}</h3>
        <ul className="m-0 -mx-2.5 mt-3 grid list-none grid-cols-[minmax(0,1fr)] gap-0.5 p-0">
          {pack.services.map(({ id, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  send(t(`services.${id}.starter`));
                }}
                className="group flex min-h-14 w-full items-center gap-3.5 rounded-[16px] px-2.5 py-2 text-start transition-colors hover:bg-paper-2"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-paper-2 text-ink-2 group-hover:bg-card">
                  <Icon className="size-5" strokeWidth={1.7} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-medium leading-snug text-ink">{t(`services.${id}.name`)}</span>
                  <span className="block text-[13px] leading-snug text-ink-3 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{t(`services.${id}.desc`)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-3 flip-rtl" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <h3 className="eyebrow mb-2 mt-8">{t('menu.appearance')}</h3>
      <Segmented
        label={t('menu.appearance')}
        value={theme}
        onChange={(v) => setThemePref(v)}
        options={[
          { value: 'system', label: t('theme.system') },
          { value: 'light', label: t('theme.light') },
          { value: 'dark', label: t('theme.dark') },
        ]}
      />

      <p className="m-0 mt-3 text-[13.5px] text-ink-3">{items.length ? t('menu.deviceCount', { count: items.length }) : t('menu.deviceEmpty')}</p>

      <div className="mt-8 flex items-center gap-3 rounded-[18px] bg-maple-wash px-4 py-3 text-[14px] text-ink">
        <Phone className="size-4 shrink-0 text-maple" aria-hidden />
        <span>{t('footer.emergency', { emergency: pack.emergency.number, crisis: pack.emergency.crisis })}</span>
      </div>

      <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[14px]">
        {(['about', 'accessibility', 'terms'] as const).map((k) => (
          <li key={k}>
            <Link href={`/${k}`} onClick={onClose} className="inline-block py-2 text-ink-2 underline-offset-4 hover:text-ink hover:underline">
              {t(`footer.${k}`)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
