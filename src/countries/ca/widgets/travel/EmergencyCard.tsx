'use client';
/**
 * The emergency card (EmergencyHelp renders it): local emergency numbers and the nearest Canadian offices
 * when a destination is known, then every 24/7 channel to the Emergency Watch and Response Centre in
 * Ottawa, each one tap to call, text or write.
 */
import type { LucideIcon } from 'lucide-react';
import { Ear, LifeBuoy, Mail, MessageCircle, MessageSquareLock, MessageSquareText, Phone, PhoneCall, ShieldCheck, Siren } from 'lucide-react';
import { ExternalLink, LinkButton, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { EWRC, URLS } from './data';
import { FrIn, frIn } from './fr';
import { LocalNumbers, OfficeList } from './HelpParts';
import messages from './messages';
import { canadaPhone, telHref } from './phone';
import { nameIn, proseIn, useSources, useUiLang } from './shared';
import type { EmergencyOutput } from './types';

/** `printed`: the number as the official page writes it, when the card shows it in international form (tooltip). */
type Channel = { id: string; icon: LucideIcon; label: string; value: string; printed?: string; href: string; note?: string; primary?: boolean };
/** A channel with more than one number (TTY): each number is its own link, with its own note. */
type MultiChannel = { id: string; icon: LucideIcon; label: string; numbers: { value: string; printed?: string; href: string; note?: string }[] };

/** One of the Centre's own numbers, shown in one international format across the card. */
const line = (c: { label: string; href: string }) => ({ value: canadaPhone(c.label), printed: c.label, href: c.href });

const tile = 'flex h-full min-h-[60px] items-center gap-3 rounded-[16px] border px-4 py-3';
const well = 'grid size-9 shrink-0 place-items-center rounded-[11px]';

export function EmergencyCard({ out }: { out: EmergencyOutput }) {
  const t = useMessages(messages);
  // Words, links and the destination's name follow the UI, even when the feed answered in the other language.
  const L = useUiLang();
  // Numbers' labels and offices too: the feed publishes them in both languages (proseIn).
  const localized = out.country ? proseIn(out.country, out.lang, L) : null;
  const F = localized?.lang ?? out.lang;
  const c = out.country && localized ? { ...localized.c, name: nameIn(out.country, L) } : null;
  const sources = useSources(out);
  const m = out.countryMissing;
  const missing = m ? { place: m.names?.[L] ?? m.query, url: m.urls?.[L] ?? m.url } : null;
  // The destination the card is about: loaded, or recognised but not loaded (it has an official page). Never a
  // name we couldn't place.
  const place = c?.name ?? (missing?.url ? missing.place : null);
  // The toll-free line to Ottawa from this country, when it can be dialled as printed.
  const tollFreeHref = c?.tollFree ? telHref(c.tollFree, { iso: c.iso, local: true }) : null;
  const channels: (Channel | MultiChannel)[] = [
    ...(c?.tollFree && tollFreeHref
      ? [{ id: 'tollfree', icon: PhoneCall, label: t('sos.ch.tollFree', { country: c.name }), value: c.tollFree, href: tollFreeHref, note: t('sos.ch.tollFreeNote'), primary: true }]
      : []),
    { id: 'collect', icon: Phone, label: t('sos.ch.collect'), ...line(EWRC.collect), note: t('sos.ch.collectNote'), primary: !c?.tollFree },
    { id: 'email', icon: Mail, label: t('sos.ch.email'), value: EWRC.email.label, href: EWRC.email.href },
    { id: 'sms', icon: MessageSquareText, label: t('sos.ch.sms'), ...line(EWRC.sms), note: t('sos.ch.carrier') },
    { id: 'whatsapp', icon: MessageCircle, label: t('sos.ch.whatsapp'), ...line(EWRC.whatsapp), note: t('sos.ch.carrier') },
    { id: 'signal', icon: MessageSquareLock, label: t('sos.ch.signal'), ...line(EWRC.signal), note: t('sos.ch.carrier') },
    { id: 'family', icon: Phone, label: t('sos.ch.family'), ...line(EWRC.fromCanada), note: t('sos.ch.familyNote') },
    {
      id: 'tty',
      icon: Ear,
      label: t('sos.ch.tty'),
      numbers: [
        line(EWRC.tty),
        { ...line(EWRC.ttyFree), note: t('sos.ch.ttyFree') },
      ],
    },
  ];

  // On desktop the tiles pair up, and TTY (two numbers side by side) takes the last row. When the pairs don't
  // come out even, the tile before TTY takes a full row too, so no tile ever sits alone next to a gap.
  const paired = channels.filter((ch): ch is Channel => !('numbers' in ch) && !ch.primary);
  const alone = paired.length % 2 === 1 ? paired[paired.length - 1].id : null;

  return (
    <WidgetShell
      icon={LifeBuoy}
      tone="maple"
      title={t('sos.title')}
      subtitle={place ? t('sos.subtitleIn', { country: place, inCountry: frIn(place) }) : t('sos.subtitle')}
      sources={sources}
      handoff={{ href: URLS.emergencyForm[L], label: t('sos.handoff'), note: t('sos.handoffNote') }}
      secondaryAction={
        <LinkButton href={URLS.roca[L]} external variant="secondary" size="md" className="max-sm:w-full">
          {t('sos.roca')}
        </LinkButton>
      }
      className="@container"
    >
      <div
        className="relative mx-3 overflow-hidden rounded-[22px] border border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_12%,transparent),color-mix(in_oklab,var(--amber)_6%,transparent)_65%,transparent)] px-5 py-5 sm:mx-4 sm:px-6"
        role="note"
      >
        <p className="m-0 flex items-center gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-maple-ink">
          <Siren className="size-3.5" aria-hidden strokeWidth={2} />
          {t('sos.dangerLabel')}
        </p>
        <p className="m-0 mt-2 font-serif text-[26px] leading-[1.12] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_48]">
          {c ? t('sos.dangerIn', { country: c.name, InCountry: FrIn(c.name) }) : t('sos.danger')}
        </p>
        {c ? (
          <div className="mt-3">
            <LocalNumbers emergency={c.emergency} iso={c.iso} lang={F} compact />
          </div>
        ) : (
          <p className="m-0 mt-1.5 text-[15px] leading-[1.5] text-ink-2">{t('sos.dangerSub')}</p>
        )}
      </div>

      {missing ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" title={t('sos.missing.title', { place: missing.place })}>
            {t('sos.missing.body')}{' '}
            {missing.url ? (
              <ExternalLink href={missing.url}>{t('sos.missing.link', { place: missing.place })}</ExternalLink>
            ) : null}
          </Notice>
        </div>
      ) : null}

      <WidgetSection
        // The full name wraps to two lines beside the badge in a phone-width column: a short label there,
        // the full name in the sentence below.
        title={
          <>
            <span className="@xl:hidden">{t('sos.ewrcShort')}</span>
            <span className="hidden @xl:inline">{t('sos.ewrcTitle')}</span>
          </>
        }
        aside={<span className="shrink-0 whitespace-nowrap rounded-full bg-pine-wash px-2 py-0.5 font-mono text-[11.5px] font-medium text-pine">{t('sos.always')}</span>}>
        <p className="m-0 mb-3 text-[14.5px] leading-[1.5] text-ink-2">{t('sos.ewrcBody')}</p>
        <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2 p-0 @xl:grid-cols-2">
          {channels.map((ch) =>
            'numbers' in ch ? (
              <li key={ch.id} className="@xl:col-span-2">
                <div className={cn(tile, 'border-hair bg-card')}>
                  <span className={cn(well, 'bg-paper-2 text-ink-2')} aria-hidden>
                    <ch.icon className="size-[18px]" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[13px] leading-snug text-ink-3">{ch.label}</p>
                    <ul className="m-0 list-none p-0 @xl:flex @xl:flex-wrap @xl:gap-x-6">
                      {ch.numbers.map((n) => (
                        <li key={n.value} className="flex flex-wrap items-center gap-x-2">
                          <a href={n.href} title={n.printed !== n.value ? n.printed : undefined} className="inline-flex min-h-11 items-center text-[15.5px] font-semibold leading-snug text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink">
                            <bdi dir="ltr" className="whitespace-nowrap">
                              {n.value}
                            </bdi>
                          </a>
                          {n.note ? <span className="text-[12.5px] leading-snug text-ink-3">{n.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ) : (
              <li key={ch.id} className={cn((ch.primary || ch.id === alone) && '@xl:col-span-2')}>
                <a
                  href={ch.href}
                  title={ch.printed !== ch.value ? ch.printed : undefined}
                  {...(ch.href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={cn(
                    tile,
                    // Only transform and opacity animate: the lift, and a shadow layer that fades in behind the tile.
                    'relative no-underline transition-transform duration-200 hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                    'after:pointer-events-none after:absolute after:inset-0 after:rounded-[16px] after:opacity-0 after:shadow-md after:transition-opacity after:duration-200 hover:after:opacity-100 motion-reduce:after:transition-none',
                    ch.primary ? 'border-maple/30 bg-maple-wash' : 'border-hair bg-card hover:border-hair-2',
                  )}
                >
                  <span className={cn(well, ch.primary ? 'bg-card text-maple-ink shadow-sm' : 'bg-paper-2 text-ink-2')} aria-hidden>
                    <ch.icon className="size-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-ink-3">{ch.label}</span>
                    {/* Inline isolate in a block: always left-to-right, yet aligned to the start in RTL. */}
                    <span className={cn('block whitespace-nowrap font-semibold leading-snug text-ink', ch.primary ? 'text-[19px]' : 'text-[15.5px]')}>
                      <bdi dir="ltr">{ch.value}</bdi>
                    </span>
                    {ch.note ? <span className="block text-[12.5px] leading-snug text-ink-3">{ch.note}</span> : null}
                    {ch.href.startsWith('https:') ? <span className="sr-only"> {t('a11y.newTab')}</span> : null}
                  </span>
                </a>
              </li>
            ),
          )}
        </ul>
        <p className="m-0 mt-3 flex items-start gap-2 text-[13px] leading-snug text-ink-3">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden strokeWidth={2} />
          {t('sos.scope')}
        </p>
      </WidgetSection>

      {c?.offices.length ? (
        <WidgetSection title={t('help.offices', { count: c.offices.length })}>
          <OfficeList offices={c.offices} initial={2} iso={c.iso} lang={F} />
        </WidgetSection>
      ) : null}

      <WidgetSection title={t('sos.nextTitle')}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {(['lost', 'arrest', 'medical'] as const).map((k) => (
            <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
              <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-maple" aria-hidden />
              <span>{t(`sos.next.${k}`)}</span>
            </li>
          ))}
        </ul>
        {/* Further reading: stacked 44px targets in a phone-width column, side by side in a wide one.
            Each label is its own element: a standalone link is a flex row, where a bare string loses the space before its last word. */}
        <div className="mt-1 flex flex-col items-start @xl:flex-row @xl:flex-wrap @xl:gap-x-6">
          <ExternalLink href={URLS.thingsGoWrong[L]} standalone className="text-[14px] text-ink-2 hover:text-ink">
            <span>{t('sos.nextLink')}</span>
          </ExternalLink>
          {c ? (
            <ExternalLink href={URLS.tollFree[L]} standalone className="text-[14px] text-ink-2 hover:text-ink">
              <span>{t('sos.tollFreeList')}</span>
            </ExternalLink>
          ) : null}
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}
