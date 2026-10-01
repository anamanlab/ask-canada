'use client';
/**
 * The directory's supporting parts: the notices above the list, the CRA "try online first" banner, the
 * accessibility options and the always-there 9-1-1 / 9-8-8 strip.
 */
import { ArrowUpRight, CalendarOff, Ear, Globe2, HeartHandshake, PhoneCall, Siren } from 'lucide-react';
import { Disclosure, ExternalLink, Notice, Toggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { LINES, type Lang } from './data';
import { URGENT } from './urgent-data';
import { URLS } from './urls';
import messages from './messages';
import type { dayNotice } from './pick';
import { PhoneNumber, telHref } from './primitives';

/** A federal holiday today, or a weekend with Service Canada lines on screen; and the note for callers abroad or in the U.S. */
export function DirectoryNotices({
  day,
  reopens,
  abroad,
  us,
  lang,
}: {
  day: ReturnType<typeof dayNotice>;
  /** "tomorrow at 8 a.m." */
  reopens?: string;
  /** Outside Canada and the United States. */
  abroad: boolean;
  /** In the United States, with "local time" lines on screen. */
  us: boolean;
  lang: Lang;
}) {
  const t = useMessages(messages);
  if (!day && !abroad && !us) return null;
  return (
    <div className="grid gap-2.5 px-5 sm:px-6">
      {day?.kind === 'holiday' ? (
        <Notice tone="warn" icon={CalendarOff} title={<bdi>{t('notice.holiday.title', { holiday: day.holiday.name[lang] })}</bdi>} live>
          <bdi>{reopens ? t('notice.holiday.body', { when: reopens }) : t('notice.holiday.bodyNoDate')}</bdi>
        </Notice>
      ) : day?.kind === 'weekend' ? (
        <Notice tone="info" icon={PhoneCall} title={<bdi>{t('notice.weekend.title')}</bdi>}>
          <bdi>{t('notice.weekend.body')}</bdi> <ExternalLink href={URLS.callback[lang]}>{t('notice.weekend.link')}</ExternalLink>
        </Notice>
      ) : null}
      {abroad ? (
        <Notice tone="info" icon={Globe2} title={<bdi>{t('notice.abroad.title')}</bdi>}>
          <bdi>{t('notice.abroad.body')}</bdi>
        </Notice>
      ) : us ? (
        <Notice tone="info" icon={Globe2} title={<bdi>{t('notice.us.title')}</bdi>}>
          <bdi>{t('notice.us.body')}</bdi>
        </Notice>
      ) : null}
    </div>
  );
}

/**
 * CRA rule: offer self-service before the phone number (only when a CRA line leads the list). One quiet line
 * above the list, so the number and its Call button stay the first thing seen.
 */
export function TryFirst({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  const selfServe = LINES['cra-individuals'].selfServe;
  if (!selfServe) return null;
  return (
    <div className="mt-1 px-5 sm:px-6">
      <ExternalLink
        href={selfServe.href[lang]}
        icon={false}
        className="group -mx-1 flex min-h-11 items-center gap-2.5 rounded-chip px-1 text-[13.5px] font-normal leading-snug text-ink-2 no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <HeartHandshake className="size-4 shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
        <bdi className="min-w-0 underline decoration-hair-2 underline-offset-[3px] group-hover:decoration-ink-3">{t('tryFirst.title')}</bdi>
        <ArrowUpRight className="size-3.5 shrink-0 text-ink-3 flip-rtl" strokeWidth={2} aria-hidden />
      </ExternalLink>
    </div>
  );
}

/** TTY numbers first (remembered on the device) and the video relay note. Opened rarely, so mounted on first open. */
export function AccessOptions({ tty, onTtyChange, className }: { tty: boolean; onTtyChange: (on: boolean) => void; className?: string }) {
  const t = useMessages(messages);
  return (
    <Disclosure
      lazy
      className={cn('mx-5 sm:mx-6', className)}
      title={
        <>
          <Ear className="size-4 shrink-0 text-ink-2" strokeWidth={1.9} aria-hidden />
          {t('a11y.toggle')}
          {tty ? <span className="rounded-chip bg-pine-wash px-2 py-0.5 text-[12px] font-medium text-pine">{t('a11y.ttyOnBadge')}</span> : null}
        </>
      }
    >
      <Toggle label={t('a11y.tty')} description={t('a11y.ttyDesc')} checked={tty} onChange={onTtyChange} />
      <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-3">
        <bdi>{t('a11y.vrs')}</bdi>
      </p>
    </Disclosure>
  );
}

/**
 * Always-there safety line at the bottom of the directory: two quiet call links (no tinted panel, so the
 * directory keeps one focal point), each a full 44px tap target, side by side when they fit.
 */
export function UrgentStrip({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  const lines = [
    { line: URGENT['911'], icon: Siren, lead: t('urgentStrip.danger') },
    { line: URGENT['988'], icon: HeartHandshake, lead: t('urgentStrip.crisis') },
  ];
  return (
    <div className="mx-5 mt-1 flex flex-wrap gap-x-6 sm:mx-6">
      {lines.map(({ line, icon: Icon, lead }) => (
        <a
          key={line.id}
          href={telHref(line.tel)}
          aria-label={t('call.aria', { name: line.name[lang], number: line.number })}
          className="-ms-1 inline-flex min-h-11 items-center gap-2 rounded-chip px-1 text-[13.5px] leading-snug text-ink-2 no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Icon className="size-4 shrink-0 text-maple-ink" strokeWidth={2} aria-hidden />
          <bdi>
            {lead}{' '}
            <span className="font-semibold text-maple-ink underline decoration-maple/30 underline-offset-[3px]">
              <PhoneNumber number={line.number} />
            </span>
          </bdi>
        </a>
      ))}
    </div>
  );
}
