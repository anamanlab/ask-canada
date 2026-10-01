'use client';
/**
 * The cards inside the urgent-help widget: 9-1-1 and 9-8-8 (large or as one compact row), the youth and
 * Indigenous help lines, and the Canadian Anti-Fraud Centre with its live hours.
 */
import { useId } from 'react';
import { ArrowUpRight, HeartHandshake, MessageCircle, MessageSquareText, PhoneCall, Siren } from 'lucide-react';
import { ExternalLink, LinkButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useLang, useTimeFmt } from './clock';
import { LINES } from './data';
import { URGENT, type UrgentLine } from './urgent-data';
import { URLS } from './urls';
import { formatDays, isOpen, statusOf, typicalWindow } from './hours';
import messages from './messages';
import type { Viewer } from './pick';
import { amberPanel, DotParts, PhoneNumber, telHref, WithNumbers } from './primitives';
import { StatusLine, StatusPill, statusTone, useStatusText } from './status';

/** Layout only: the shared button at the cards' 44px row height. */
const ACTION = 'min-h-11';

/** Call, and Text where the line takes texts (`keyword`: open the message with the line's keyword already typed). */
function CallAndText({ line, variant, callLabel, keyword }: { line: UrgentLine; variant: 'accent' | 'primary'; callLabel: string; keyword?: boolean }) {
  const t = useMessages(messages);
  const lang = useLang();
  const text = line.text;
  const body = keyword ? text?.keyword?.[lang] : undefined;
  return (
    <>
      <LinkButton href={telHref(line.tel)} variant={variant} size="sm" icon={PhoneCall} aria-label={t('call.aria', { name: line.name[lang], number: line.number })} className={ACTION}>
        {callLabel}
      </LinkButton>
      {text ? (
        <LinkButton
          href={`sms:${text.to}${body ? `?body=${encodeURIComponent(body)}` : ''}`}
          variant="secondary"
          size="sm"
          icon={MessageSquareText}
          aria-label={t('text.aria', { name: line.name[lang], number: keyword ? text.to : line.number })}
          className={cn(ACTION, 'bg-card')}
        >
          {t('text.button')}
        </LinkButton>
      ) : null}
    </>
  );
}

/** 9-1-1 or 9-8-8: the number set large with when to call it, or (`compact`) one row with its call button. */
export function BigLine({ id, compact }: { id: '911' | '988'; compact?: boolean }) {
  const t = useMessages(messages);
  const headingId = useId();
  const line = URGENT[id];
  const is911 = id === '911';
  if (compact) {
    const Icon = is911 ? Siren : HeartHandshake;
    return (
      <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-tile px-4 py-3', is911 ? 'bg-maple-wash' : 'bg-pine-wash')}>
        <p className="m-0 flex min-w-0 items-center gap-2.5 text-[14.5px] font-medium leading-snug text-ink">
          <Icon className={cn('size-[18px] shrink-0', is911 ? 'text-maple' : 'text-pine')} strokeWidth={1.9} aria-hidden />
          <bdi>
            <WithNumbers text={t(`line.${id}.compact`)} />
          </bdi>
        </p>
        <div className="flex flex-wrap gap-2">
          <CallAndText line={line} variant={is911 ? 'accent' : 'primary'} callLabel={t('call.number', { number: line.number })} />
        </div>
      </div>
    );
  }
  return (
    <section aria-labelledby={headingId} className={cn('relative overflow-hidden rounded-card px-5 py-5', is911 ? 'bg-maple-wash' : 'bg-pine-wash')}>
      <p className={cn('m-0 text-[12px] font-semibold uppercase tracking-[.08em]', is911 ? 'text-maple-ink' : 'text-pine')}>
        <DotParts text={t(`line.${id}.eyebrow`)} />
      </p>
      <h4 id={headingId} className="m-0 mt-1.5 text-[16px] font-semibold leading-snug text-ink">
        <bdi>{t(`line.${id}.when`)}</bdi>
      </h4>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <p className="m-0 font-serif text-[56px] leading-[.9] tracking-[-.03em] text-ink @xl:text-[64px]">
          <PhoneNumber number={line.number} />
        </p>
        {/* Phone-width cards: the actions take their own row under the number in both heroes (one button or two). */}
        <div className="flex flex-wrap gap-2 @max-sm:basis-full">
          <CallAndText line={line} variant={is911 ? 'accent' : 'primary'} callLabel={t('call.button')} />
        </div>
      </div>
      <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-2">
        <bdi>{t(`line.${id}.detail`)}</bdi>
      </p>
    </section>
  );
}

/** Kids Help Phone or the Hope for Wellness Help Line. */
export function SmallLine({ id }: { id: 'kids' | 'hope' }) {
  const t = useMessages(messages);
  const lang = useLang();
  const headingId = useId();
  const line = URGENT[id];
  return (
    <section aria-labelledby={headingId} className="flex flex-col rounded-tile border border-hair bg-card px-4 py-4">
      <h4 id={headingId} className="m-0 text-[15px] font-semibold leading-snug text-ink">
        {line.name[lang]}
      </h4>
      <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">
        <bdi>{t(`line.${id}.who`)}</bdi>
      </p>
      {/* Same rhythm in both tiles: status pill, number, then one line of how else to reach them. */}
      <StatusPill tone="open" className="mt-3 self-start">
        {t('status.always')}
      </StatusPill>
      <p className="m-0 mt-2 font-serif text-[26px] leading-none text-ink">
        <PhoneNumber number={line.number} />
      </p>
      <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-ink-2">
        <bdi>{line.text?.keyword ? t('line.textKeyword', { keyword: line.text.keyword[lang], to: line.text.to }) : t(`line.${id}.langs`)}</bdi>
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <CallAndText line={line} variant="primary" callLabel={t('call.button')} keyword />
        {id === 'hope' ? (
          // A compact text link, so Call + Chat stay on one row in French too and the two cards line up.
          <ExternalLink
            href={URLS.hopeChat[lang]}
            standalone
            icon={false}
            aria-label={t('chat.aria', { name: line.name[lang] })}
            className="gap-1.5 rounded-chip px-1.5 text-[14px] hover:decoration-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <MessageCircle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {t('chat.button')}
            <ArrowUpRight className="size-3.5 shrink-0 text-ink-3 flip-rtl" strokeWidth={2} aria-hidden />
          </ExternalLink>
        ) : null}
      </div>
    </section>
  );
}

/**
 * The Canadian Anti-Fraud Centre. One rule in every situation: while the line is open, Call leads and the
 * online report follows; while it's closed, the online report (open any time) leads and Call steps back.
 */
export function CafcCard({ viewer: { now, tz, holidays, lang }, hero }: { viewer: Viewer; hero?: boolean }) {
  const t = useMessages(messages);
  const headingId = useId();
  const { time, intl } = useTimeFmt(tz);
  const statusText = useStatusText(tz);
  const { name, covers, number, agents } = LINES.cafc;
  if (!number || !agents) return null;
  const s = statusOf(agents, now, tz, holidays);
  const open = isOpen(s);
  const w = typicalWindow(agents, now, tz);
  const callAria = t('call.aria', { name: name[lang], number });
  const call = (
    <LinkButton href={telHref(number)} variant={open ? 'primary' : 'secondary'} size="sm" icon={PhoneCall} aria-label={callAria} className={cn(ACTION, !open && 'bg-card')}>
      {t('call.button')}
    </LinkButton>
  );
  const report = (
    <LinkButton href={URLS.cafcReport[lang]} external variant={open ? 'secondary' : 'primary'} size="sm" className={cn(ACTION, open && 'bg-card')}>
      {t('fraud.reportOnline')}
    </LinkButton>
  );
  return (
    <section aria-labelledby={headingId} className={cn('rounded-card border px-5 py-5', hero ? amberPanel : 'border-hair bg-card')}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[.08em] text-amber">{t('line.cafc.eyebrow')}</p>
          <h4 id={headingId} className="m-0 mt-1.5 text-[16px] font-semibold leading-snug text-ink">
            {name[lang]}
          </h4>
        </div>
        <StatusLine tone={statusTone(s)} status={statusText(s, now)} />
      </div>
      <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-2">
        <bdi>{covers[lang]}</bdi>
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Tappable for touch and named like the Call button, which stays the one tab stop. */}
        <a href={telHref(number)} tabIndex={-1} aria-label={callAria} className="inline-flex min-h-11 items-center font-serif text-[30px] leading-none tracking-[-.01em] text-ink no-underline">
          <PhoneNumber number={number} />
        </a>
        <div className="flex flex-wrap gap-2">
          {open ? call : report}
          {open ? report : call}
        </div>
      </div>
      <p className="m-0 mt-3 text-pretty text-[13.5px] leading-snug text-ink-3">
        <bdi>{t('fraud.hours', { days: formatDays(agents.days, intl), from: time(w.start), to: time(w.end) })}</bdi>
      </p>
    </section>
  );
}
