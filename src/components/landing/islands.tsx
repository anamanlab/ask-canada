'use client';
/** Interactive islands inside the (server-rendered) landing page. */
import React, { type CSSProperties, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { ArrowRight, ArrowUp, ArrowUpRight, Baby, BookOpen, Briefcase, Calendar, CaretRight, FileText, Globe, HandCoins, Airplane, Warning } from '@phosphor-icons/react';
import { useChatActions } from '@/components/chat/actions';
import { Composer } from '@/components/chat/Composer';
import { LinkButton } from '@/components/ui/plain/Button';
import { Chip } from '@/components/ui/plain/Chip';
import { ClearDeviceButton } from '@/components/site/ClearDevice';
import { useDeviceItems } from '@/lib/device-store';
import { useLanguageLink, useLocale } from '@/lib/i18n/provider';
import { pack } from '@/countries/active';

/** `compactPlaceholders`: the phone rotation (examples that fit one line), index-aligned with `placeholders`. */
export function HeroComposer({ placeholders, compactPlaceholders, hint }: { placeholders: string[]; compactPlaceholders?: string[]; hint: string }) {
  return <Composer variant="hero" placeholders={placeholders} compactPlaceholders={compactPlaceholders} hint={hint} id="ask" />;
}

export function ClosingComposer({ placeholder, compact, lang, label }: { placeholder: string; compact?: string; lang: string; label: string }) {
  return (
    <Composer
      variant="closing"
      label={label}
      placeholders={[placeholder]}
      compactPlaceholders={compact ? [compact] : undefined}
      placeholderLang={lang}
      id="ask-closing"
    />
  );
}

/** Fallback glyphs for the chip ids core ships (`pack.chips[].icon` wins where a pack names one). */
const CHIP_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number | string }>> = {
  passport: BookOpen,
  taxes: FileText,
  ccb: Baby,
  ei: Briefcase,
  travel: Airplane,
  oas: HandCoins,
  recalls: Warning,
};

/**
 * A starter question. On phones it is a tile: `short` (optional) replaces the label, `sub` (optional) adds a
 * quiet second line that says what the tile asks, and the icon sits in a small square tinted per task.
 *
 * `official`: the program's official name. When the visible label is a shorter everyday name, screen
 * readers hear the official one right after it (the accessible name still starts with the visible label).
 */
export function AskChip({ id, label, short, sub, official, question }: { id: string; label: string; short?: string; sub?: string; official?: string; question: string }) {
  const { send } = useChatActions();
  const sr = (shown: string) => (official && official !== shown ? <span className="sr-only"> ({official})</span> : null);
  // Glyph and phone hue come off the pack's own chip entry, so a country can name chips core has never heard
  // of; CHIP_ICONS is the fallback for the ids it does know.
  const chip = pack.chips?.find((c) => c.id === id);
  const Icon = chip?.icon ?? CHIP_ICONS[id] ?? Globe;
  const onClick = () => send(question);
  const tile = chip?.tile;

  const renderContent = () => {
    if (!short) {
      return (
        <React.Fragment>
          {label}
          {sr(label)}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <span className="l-chip-long">
          {label}
          {sr(label)}
        </span>
        <span className="l-chip-short">
          <span className="l-chip-short__t">
            {short}
            {sr(short)}
          </span>
          {sub ? <span className="l-chip-short__sub">{sub}</span> : null}
        </span>
      </React.Fragment>
    );
  };
  return (
    <Chip icon={Icon} onClick={onClick} className={`l-chip--${id}`} style={tile ? ({ '--tile-light': tile.light, '--tile-dark': tile.dark } as CSSProperties) : undefined}>
      {renderContent()}
    </Chip>
  );
}

export function ServiceRow({ name, question, go, icon }: { name: string; question: string; go: string; icon?: ReactNode }) {
  const { send } = useChatActions();
  const { t } = useLocale();
  const onClick = () => send(question);

  return (
    <button type="button" className="l-svc" onClick={onClick}>
      {icon ? (
        <span className="l-svc__ico" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="l-svc__n">{name}</span>
      <span className="l-svc__q">{t('landing.quote', { q: question })}</span>
      <span className="l-svc__go">
        {go} <ArrowRight className="size-[15px] flip-rtl" aria-hidden />
      </span>
      <span className="l-svc__chev" aria-hidden>
        <CaretRight className="size-4 flip-rtl" />
      </span>
    </button>
  );
}

/**
 * The follow-up box drawn inside the flag section's example conversation. It is part of the picture, not
 * a control: inert and hidden from assistive tech (the example is described by the section's caption), so
 * the page has exactly one question box per section and no duplicate "Ask a question" fields.
 */
export function DemoForm({ placeholder }: { placeholder: string }) {
  return (
    <div className="l-demo__form" inert aria-hidden="true">
      <span className="l-demo__input">{placeholder}</span>
      <span className="ac-send !size-10">
        <ArrowUp className="size-5" strokeWidth={2.1} />
      </span>
    </div>
  );
}

export function LanguageCTA() {
  const { locale } = useLocale();
  const other = locale === 'fr' ? 'en' : 'fr';
  const link = useLanguageLink(other);
  return (
    <LinkButton variant="glass" size="lg" icon={Globe} {...link}>
      {other === 'fr' ? 'Commencer en français' : 'Continue in English'}
    </LinkButton>
  );
}

const kindIcon: Record<string, React.ComponentType<{ className?: string; size?: number | string }>> = { plan: BookOpen, checklist: BookOpen, reminder: Calendar, chat: Calendar };

/** "Stored on our servers: Nothing." + what's saved on this device, with a working Clear button. */
export function DeviceCard() {
  const { t, fmt } = useLocale();
  const items = useDeviceItems();
  const shown = items.slice(0, 3);
  return (
    <div className="l-device">
      <div className="l-device__top">
        <p className="l-device__k">{t('privacy.card.stored')}</p>
        <p className="l-device__nothing">{t('privacy.card.nothing')}</p>
        <p className="l-device__p">{t('privacy.card.nothingSub')}</p>
      </div>
      <div className="l-device__bottom">
        <p className="l-device__k">{t('privacy.card.device')}</p>
        {shown.length ? (
          <>
            <ul className="l-device__list">
              {shown.map((i) => {
                const Icon = kindIcon[i.kind ?? 'plan'] ?? BookOpen;
                return (
                  <li key={i.key} className="l-device__item">
                    <span className="l-device__ico">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="l-device__t truncate">{i.label}</span>
                      <span className="l-device__d">{i.detail ?? fmt.date(new Date(i.updatedAt), { dateStyle: 'medium' })}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <ClearDeviceButton variant="link" withIcon className="l-device__clear" label={`${t('device.clear')} (${fmt.number(items.length)})`} />
          </>
        ) : (
          <>
            {/* Empty: say so first, then show what a saved plan would look like, as ghosted outlines (each one
                labelled "For example"), so the two never read as a contradiction. */}
            <p className="l-device__p l-device__empty">{t('privacy.card.emptyNote')}</p>
            <ul className="l-device__list is-preview">
              <li className="l-device__item is-example">
                <span className="l-device__ico">
                  <BookOpen className="size-[18px]" aria-hidden />
                </span>
                <span>
                  <span className="l-device__t">{t('privacy.card.ex1')}</span>
                  <span className="l-device__d">{t('privacy.card.ex1d')}</span>
                </span>
              </li>
              <li className="l-device__item is-example">
                <span className="l-device__ico">
                  <Calendar className="size-[18px]" aria-hidden />
                </span>
                <span>
                  <span className="l-device__t">{t('privacy.card.ex2')}</span>
                  <span className="l-device__d">{t('privacy.card.ex2d')}</span>
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export function DemoTry({ label, question }: { label: string; question: string }) {
  const { send } = useChatActions();
  return (
    <button type="button" className="l-demo__go" onClick={() => send(question)}>
      {label}
      <ArrowUpRight className="size-3.5 flip-rtl" aria-hidden />
    </button>
  );
}

/**
 * Preloads images from the document <head> at high priority (a client component, so the server render
 * places the hints in the shell). `media` limits a preload to, say, one colour scheme.
 */
export function PreloadImages({ images }: { images: { href: string; media?: string }[] }) {
  for (const { href, media } of images) preload(href, { as: 'image', fetchPriority: 'high', media });
  return null;
}
