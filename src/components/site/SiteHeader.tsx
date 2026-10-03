'use client';
/**
 * Site header.
 *  variant="landing": transparent, sits inside the hero frame.
 *  variant="chat": sticky, turns to frosted glass once the thread scrolls; shows the thread title,
 *    New chat and History.
 * Always: brand, quick EN⇄FR toggle, full language picker, Menu. The Menu and the picker are fetched the
 * first time they are wanted (on hover, focus or click), so closed sheets aren't in every page's first load.
 */
import { useState, type Ref } from 'react';
import { Globe, History, Menu, SquarePen } from 'lucide-react';
import { brand, endonym, isOfficial, otherOfficial } from '@/lib/brand';
import { IconButton } from '@/components/ui/plain/Button';
import { cx } from '@/lib/cx';
import { useOnDemand, useWindowScrolled } from '@/lib/hooks';
import { useLanguageLink, useLocale } from '@/lib/i18n/provider';
import { LanguageNote } from './LanguageNote';

const loadMenu = () => import('./MenuSheet').then((m) => m.MenuSheet);
const loadPicker = () => import('./LanguagePicker').then((m) => m.LanguagePicker);

export function Brand({ onClick, href = '/' }: { onClick?: () => void; href?: string }) {
  const { t } = useLocale();
  const Mark = brand.Mark;
  const Signature = isOfficial ? brand.OfficialSignature : undefined;
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="ac-brand"
      aria-label={t('brand.home', { brand: brand.name })}
    >
      {Signature ? <Signature className="h-7 w-auto" /> : <Mark className="ac-brand__leaf" />}
      <span className="ac-brand__name">{brand.name}</span>
    </a>
  );
}

export function SiteHeader({
  variant,
  title,
  titleShown = true,
  onHome,
  onNewChat,
  onHistory,
  historyOpen,
  ref,
}: {
  variant: 'landing' | 'chat';
  title?: string;
  /** Chat: show the thread title (fades in once the first question scrolls under the header). */
  titleShown?: boolean;
  onHome?: () => void;
  onNewChat?: () => void;
  onHistory?: () => void;
  /** Whether the history sheet is open (for aria-expanded). */
  historyOpen?: boolean;
  /** The `<header>` element (the chat measures its reading area from it). */
  ref?: Ref<HTMLElement>;
}) {
  const { t, locale } = useLocale();
  const [menu, setMenu] = useState(false);
  const [lang, setLang] = useState(false);
  const [MenuSheet, wantMenu] = useOnDemand(loadMenu);
  const [LanguagePicker, wantPicker] = useOnDemand(loadPicker);
  const scrolled = useWindowScrolled(8, variant === 'chat');
  const other = otherOfficial(locale);
  const langLink = useLanguageLink(other);
  const otherName = endonym(other);
  const otherShort = otherName === 'English' ? 'EN' : other.toUpperCase();

  return (
    <>
    <header ref={ref} className={cx('ac-head', `ac-head--${variant}`, scrolled && 'is-scrolled')}>
      <Brand onClick={onHome} />
      {variant === 'chat' && title ? (
        <p className={cx('ac-head__title', titleShown && 'is-shown')} title={title} aria-hidden={!titleShown || undefined}>
          <span dir="auto">{title}</span>
        </p>
      ) : (
        <span />
      )}
      <div className="ac-head__actions">
        {variant === 'chat' && onNewChat ? (
          <button type="button" className="ac-btn-quiet ac-desktop-only" onClick={onNewChat}>
            <SquarePen className="size-[18px]" strokeWidth={1.7} aria-hidden />
            {t('chat.new')}
          </button>
        ) : null}
        {variant === 'chat' && onNewChat ? <IconButton className="ac-mobile-only" label={t('chat.new')} icon={SquarePen} onClick={onNewChat} /> : null}
        {variant === 'chat' && onHistory ? <IconButton label={t('history.title')} icon={History} onClick={onHistory} aria-haspopup="dialog" aria-expanded={Boolean(historyOpen)} /> : null}
        {/* The official-language toggle is a real link to this page in the other language (works before
            the app loads, can be shared); once loaded it switches in place. */}
        <a className="ac-btn-quiet" aria-label={otherName} {...langLink}>
          <span className={variant === 'chat' ? 'max-md:hidden' : undefined}>{otherName}</span>
          {variant === 'chat' ? <span className="md:hidden">{otherShort}</span> : null}
        </a>
        <IconButton
          label={t('lang.title')}
          icon={Globe}
          onPointerEnter={wantPicker}
          onFocus={wantPicker}
          onClick={() => {
            wantPicker();
            setLang(true);
          }}
          className="ac-desktop-only"
        />
        <button
          type="button"
          className="ac-btn-pill"
          aria-haspopup="dialog"
          aria-expanded={menu}
          onPointerEnter={wantMenu}
          onFocus={wantMenu}
          onClick={() => {
            wantMenu();
            setMenu(true);
          }}
        >
          <Menu className="size-5" strokeWidth={1.7} aria-hidden />
          <span className="ac-btn-pill__label">{t('menu.title')}</span>
        </button>
      </div>
      {MenuSheet ? <MenuSheet open={menu} onClose={() => setMenu(false)} /> : null}
      {LanguagePicker ? <LanguagePicker open={lang} onClose={() => setLang(false)} /> : null}
    </header>
    <LanguageNote />
    </>
  );
}
