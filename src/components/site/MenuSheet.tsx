'use client';
/**
 * The Services sheet: every service area (each opens a chat with a good starter question), appearance,
 * emergency numbers and policy pages, with the essentials pinned at the bottom (language, privacy,
 * clear this device, the official site) so the sheet is complete on its own. Its contents render only once
 * the sheet is first opened (see `Sheet`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Globe, Landmark, Lock, Phone, Search, X } from 'lucide-react';
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
  const { t, locale } = useLocale();
  const { send } = useChatActions();
  const items = useDeviceItems();
  const theme = useThemePref();
  const [filter, setFilter] = useState('');

  const services = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pack.services;
    return pack.services.filter(({ id }) => {
      const name = (t(`services.${id}.name`) ?? '').toLowerCase();
      const desc = (t(`services.${id}.desc`) ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [filter, t]);

  const searchPlaceholder = locale === 'pt' ? 'Buscar serviço ou tema…' : locale === 'fr' ? 'Rechercher un service…' : 'Search services or topics…';
  const noResults = locale === 'pt' ? 'Nenhum serviço encontrado.' : locale === 'fr' ? 'Aucun service trouvé.' : 'No services found.';

  return (
    <>
      <div className="relative mt-2 mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-10 w-full rounded-full border border-hair bg-paper-2 pl-9 pr-8 text-[14px] text-ink placeholder:text-ink-3 focus:border-maple focus:bg-card focus:outline-none transition-colors"
        />
        {filter ? (
          <button
            type="button"
            onClick={() => setFilter('')}
            aria-label={t('action.cancel')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav aria-label={t('menu.services')}>
        <h3 className="sr-only">{t('menu.services')}</h3>
        {services.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-ink-3">{noResults}</p>
        ) : (
          <ul className="m-0 -mx-2.5 grid list-none grid-cols-[minmax(0,1fr)] gap-0.5 p-0">
            {services.map(({ id, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    send(t(`services.${id}.starter`));
                  }}
                  className="group flex min-h-14 w-full items-center gap-3.5 rounded-[16px] px-2.5 py-2 text-start transition-colors hover:bg-paper-2 active:bg-paper-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-paper-2 text-ink-2 shadow-2xs group-hover:bg-card group-hover:text-ink transition-colors">
                    <Icon className="size-5" strokeWidth={1.7} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium leading-snug text-ink">{t(`services.${id}.name`)}</span>
                    <span className="block text-[12.5px] leading-snug text-ink-3 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{t(`services.${id}.desc`)}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3 flip-rtl group-hover:text-ink transition-colors" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
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

      <p className="m-0 mt-3 text-[13px] text-ink-3">{items.length ? t('menu.deviceCount', { count: items.length }) : t('menu.deviceEmpty')}</p>

      {/* Actionable Emergency assistance card */}
      <div className="mt-8 rounded-[18px] border border-hair bg-paper-2/80 p-3.5 transition-colors">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-2">
          <Phone className="size-3.5 text-maple" aria-hidden />
          <span>{locale === 'pt' ? 'Atendimento de emergência' : locale === 'fr' ? 'Urgences et crise' : 'Emergency & assistance'}</span>
        </div>
        <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-2">
          {t('footer.emergency', { emergency: pack.emergency.number, crisis: pack.emergency.crisis })}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <a
            href={`tel:${pack.emergency.number}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-2xs hover:bg-paper-2 transition-colors no-underline"
          >
            <Phone className="size-3 text-pine" aria-hidden />
            <span>{locale === 'pt' ? `Polícia ${pack.emergency.number}` : `Call ${pack.emergency.number}`}</span>
          </a>
          {pack.id === 'br' ? (
            <a
              href="tel:192"
              className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-2xs hover:bg-paper-2 transition-colors no-underline"
            >
              <Phone className="size-3 text-pine" aria-hidden />
              <span>SAMU 192</span>
            </a>
          ) : null}
          {pack.emergency.crisisTel ? (
            <a
              href={`tel:${pack.emergency.crisisTel}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-2xs hover:bg-paper-2 transition-colors no-underline"
            >
              <Phone className="size-3 text-maple" aria-hidden />
              <span>{locale === 'pt' ? `CVV ${pack.emergency.crisisTel}` : `Helpline ${pack.emergency.crisisTel}`}</span>
            </a>
          ) : null}
        </div>
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
