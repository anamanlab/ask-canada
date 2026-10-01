'use client';
/**
 * Appointment helper: passport (optional, walk in or book), biometrics (appointment required), or anything
 * else (walk in, ask for a call back, or call the program's own line). Renders the `officesAppointment` part.
 */
import { useState } from 'react';
import { CalendarCheck, CalendarClock, Check, DoorOpen, Fingerprint, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { Chip, ExternalLink, Segmented, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AppointmentSkeleton } from './AppointmentSkeleton';
import { appointmentSources, PHONE, PROGRAMS, URLS } from './data';
import messages from './messages';
import { useLatestSearch } from './searchStore';
import { PIN_TEXT, placeName, telHref, useLang } from './shared';
import type { AppointmentFocus, AppointmentOutput } from './types';
import { useGuardedSend } from './useGuardedSend';

const FOCI: AppointmentFocus[] = ['passport', 'biometrics', 'other'];
const STEPS = ['1', '2', '3'] as const;
/** Stands in for the phone line's name while its sentence is formatted, so the name can be its own element. */
const BRAND_SLOT = '\u0001';
/** The finder filter each kind of appointment leads to. */
const FIND_NEED = { passport: 'passport', biometrics: 'biometrics', other: 'any' } as const;
const LEAD_ICON = { passport: CalendarClock, biometrics: Fingerprint, other: DoorOpen } as const;

export function OfficesAppointment({ part }: WidgetProps<{ focus?: AppointmentFocus }, AppointmentOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('appt.error.title')} message={t('appt.error.body')} fallback={{ href: URLS.booking[lang], label: t('appt.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    const f = part.input?.focus;
    const shape = f ?? 'passport';
    const copy = {
      lead: t(`appt.${shape}.lead`),
      sub: t(`appt.${shape}.leadSub`),
      // The passport card's last step ends with the "renew online" link and its arrow.
      steps: STEPS.map((n) => (shape === 'passport' && n === '3' ? `${t('appt.passport.3')} ${t('appt.passport.3.link')} ↗` : t(`appt.${shape}.${n}`))),
      hint: t('appt.phone.hint', { line: t('appt.phone.line') }),
      programsHint: shape === 'other' ? t('appt.programs.hint') : undefined,
      programs: PROGRAMS.length,
    };
    return <AppointmentSkeleton title={t(`appt.title.${shape}`)} subtitle={t('appt.subtitle')} label={t('loading')} copy={copy} />;
  }
  return <Appointment data={part.output} />;
}

type PhoneRow = { key: string; label: string; number: string; href?: string };

/**
 * Grouped phone lines. A general line is one tappable row (name start, number end). A program row leads with
 * its official contact page (the right contact can depend on the situation) and keeps the number as a
 * second, separate tap target.
 */
function PhoneList({ rows, label }: { rows: PhoneRow[]; label: string }) {
  const t = useMessages(messages);
  const text = 'flex min-w-0 flex-1 flex-col gap-0.5 @md:flex-row @md:items-baseline @md:justify-between @md:gap-3';
  const number = 'shrink-0 text-[15px] font-medium tabular-nums text-ink';
  return (
    <ul aria-label={label} className="m-0 list-none overflow-hidden rounded-tile border border-hair bg-card p-0">
      {rows.map((r, i) => (
        <li key={r.key} className={cn(i > 0 && 'border-t border-hair')}>
          {r.href ? (
            <div className="flex min-h-12 items-center gap-3 px-4 py-1">
              <Phone className="size-4 shrink-0 text-ink-3" aria-hidden strokeWidth={1.9} />
              <span className={cn(text, '@md:items-center')}>
                <ExternalLink href={r.href} className="py-1.5 text-[14px] font-medium leading-snug text-ink @md:py-3">
                  {r.label}
                </ExternalLink>
                <a
                  href={telHref(r.number)}
                  aria-label={t('appt.program.call', { program: r.label, number: r.number })}
                  className={cn(number, '-mx-1.5 inline-flex min-h-8 items-center self-start rounded-chip px-1.5 underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-ink @md:min-h-11 @md:self-auto')}
                >
                  <bdi dir="ltr">{r.number}</bdi>
                </a>
              </span>
            </div>
          ) : (
            <a
              href={telHref(r.number)}
              className="flex min-h-12 items-center gap-3 px-4 py-2.5 no-underline transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
            >
              <Phone className="size-4 shrink-0 text-ink-3" aria-hidden strokeWidth={1.9} />
              {/* Phones: name over number, like a contact card. Wider cards: name start, number end. */}
              <span className={text}>
                <span className="text-[14px] leading-snug text-ink-2">
                  <bdi>{r.label}</bdi>
                </span>
                <span className={number}>
                  <bdi dir="ltr">{r.number}</bdi>
                </span>
              </span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The sentence under the phone lines. The line's name starts with digits, so it is isolated left-to-right. */
function PhoneHint() {
  const t = useMessages(messages);
  const [before, after] = t('appt.phone.hint', { line: BRAND_SLOT }).split(BRAND_SLOT);
  return (
    <p className="m-0 mt-2 text-[13px] text-ink-2">
      {before}
      <bdi dir="ltr">{t('appt.phone.line')}</bdi>
      {after}
    </p>
  );
}

function Appointment({ data }: { data: AppointmentOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  // The follow-up waits while an answer is being written: a second question would land inside the first.
  const { send, busy } = useGuardedSend();
  const [focus, setFocus] = useState<AppointmentFocus>(data.focus);
  const Lead = LEAD_ICON[focus];
  // A place searched earlier on this page goes into the question, so the answer names the nearest office.
  const place = placeName(useLatestSearch());
  const handoff =
    focus === 'other'
      ? { href: URLS.callback[lang], label: t('appt.handoff.callback'), note: t('appt.handoff.callbackNote') }
      : { href: URLS.booking[lang], label: t('appt.handoff.book'), note: t('appt.handoff.bookNote') };

  return (
    <WidgetShell
      icon={CalendarCheck}
      tone="pine"
      title={t(`appt.title.${focus}`)}
      subtitle={t('appt.subtitle')}
      sources={appointmentSources(lang, focus)}
      handoff={handoff}
      aurora={false}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <Segmented
          label={t('appt.label')}
          value={focus}
          onChange={setFocus}
          // A 320px phone has no room for three labels side by side (EN "Biometrics", FR "Passeport"): stack them.
          className="grid w-full @[320px]:flex"
          options={FOCI.map((f) => ({ value: f, label: t(`appt.${f}`), sub: <span className="font-sans text-[12.5px] text-ink-2">{t(`appt.${f}.sub`)}</span> }))}
        />
      </div>

      <div className="mx-5 mt-4 rounded-card border border-pine/15 bg-pine-wash px-5 py-4 sm:mx-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3.5">
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-pine shadow-[0_0_0_6px_var(--pine-wash)]', PIN_TEXT)} aria-hidden>
            <Lead className="size-[18px]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="m-0 font-serif text-[22px] leading-[1.2] tracking-[-.015em] text-ink">{t(`appt.${focus}.lead`)}</p>
            <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{t(`appt.${focus}.leadSub`)}</p>
          </div>
        </div>
      </div>

      <WidgetSection title={t('appt.steps')}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {STEPS.map((n) => {
            const warn = focus === 'other' && n === '3';
            const Icon = warn ? ShieldAlert : Check;
            return (
              <li key={n} className={cn('flex items-start gap-3 rounded-tile border px-3.5 py-3 text-[14.5px] leading-snug', warn ? 'border-amber/30 bg-amber-wash' : 'border-hair bg-card')}>
                <Icon className={cn('mt-0.5 size-4 shrink-0', warn ? 'text-amber' : 'text-pine')} strokeWidth={2.4} aria-hidden />
                <span className="text-ink">
                  {t(`appt.${focus}.${n}`)}
                  {/* The online-renewal step is actionable: link the official page. */}
                  {focus === 'passport' && n === '3' ? (
                    <>
                      {' '}
                      <ExternalLink href={URLS.renewOnline[lang]} className="font-medium">
                        {t('appt.passport.3.link')}
                      </ExternalLink>
                    </>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </WidgetSection>

      <WidgetSection title={t(focus === 'other' ? 'appt.programs' : 'appt.phone')}>
        {focus === 'other' ? (
          <>
            <PhoneList label={t('appt.programs')} rows={PROGRAMS.map((p) => ({ key: p.id, label: t(`appt.program.${p.id}`), number: p.phone[lang], href: p.url[lang] }))} />
            <p className="m-0 mt-2 text-[13px] leading-snug text-ink-2">{t('appt.programs.hint')}</p>
          </>
        ) : null}
        <div className={cn(focus === 'other' && 'mt-4')}>
          <PhoneList label={t('appt.phone')} rows={[{ key: 'oc', label: t('appt.phone.line'), number: PHONE.oCanada }, { key: 'tty', label: t('appt.phone.tty'), number: PHONE.tty }]} />
          <PhoneHint />
        </div>
        <div className="mt-4">
          <Chip icon={MapPin} wrap className="max-w-full disabled:pointer-events-none disabled:opacity-50" disabled={busy} onClick={() => send(place ? t(`ask.send.${FIND_NEED[focus]}`, { place }) : t(`appt.findSend.${focus}`))}>
            {place ? t('appt.findNear', { place }) : t('appt.find')}
          </Chip>
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}
