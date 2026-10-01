'use client';
/**
 * "I think a call from the CRA was a scam": nothing lost yet. The CRA's own warning signs, then what to do now
 * (hang up and verify through channels you look up yourself, report even with no loss, and the bank step only
 * if money or details were given, with the CRA's identity-theft line), each phone route with its live hours.
 */
import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, FileWarning, PhoneCall, ShieldQuestion, UserRound, X } from 'lucide-react';
import { ExternalLink, Stepper, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { ToolSource } from '@/lib/widgets/types';
import { CRA_FRAUD_LINE, LINES, type Hours } from './data';
import { SCAM_SIGNS } from './urgent-data';
import { URLS } from './urls';
import { statusOf } from './hours';
import messages from './messages';
import type { Viewer } from './pick';
import { amberPanel, telHref, WithNumbers } from './primitives';
import { StatusLine, statusTone, useStatusText } from './status';
import { CafcCard } from './UrgentLines';

const row =
  'flex min-h-11 items-center gap-2.5 px-3.5 text-[14px] font-medium leading-snug text-ink no-underline transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink';

/**
 * Two ways to reach the CRA, as one tidy list: the online route, then the call with its live status (under the
 * number on phones, beside it on wide cards).
 */
function Routes({ viewer, online, call }: { viewer: Viewer; online: { href: string; label: string; icon: LucideIcon }; call?: { name: string; number: string; hours?: Hours } }) {
  const t = useMessages(messages);
  const { now, tz, holidays } = viewer;
  const statusText = useStatusText(tz);
  const status = call ? statusOf(call.hours, now, tz, holidays) : null;
  const Icon = online.icon;
  return (
    <ul className="m-0 mt-2.5 list-none divide-y divide-hair overflow-hidden rounded-tile border border-hair bg-card p-0">
      <li>
        <ExternalLink href={online.href} icon={false} className={cn(row, 'py-0')}>
          <Icon className="size-4 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
          <bdi className="min-w-0 flex-1">{online.label}</bdi>
          <ArrowUpRight className="size-4 shrink-0 text-ink-3 flip-rtl" strokeWidth={2} aria-hidden />
        </ExternalLink>
      </li>
      {call ? (
        <li className="flex flex-col @xl:flex-row @xl:items-center">
          <a href={telHref(call.number)} className={cn(row, '@xl:flex-1')} aria-label={t('call.aria', { name: call.name, number: call.number })}>
            <PhoneCall className="size-4 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
            <bdi className="min-w-0 flex-1">
              <WithNumbers text={t('suspect.steps.verify.call', { number: call.number })} />
            </bdi>
          </a>
          <StatusLine tone={statusTone(status)} status={statusText(status, now)} className="ps-10 pe-3.5 pb-3 @xl:ps-0 @xl:pb-0" />
        </li>
      ) : null}
    </ul>
  );
}

export function Suspected({ viewer, sources }: { viewer: Viewer; sources: ToolSource[] }) {
  const t = useMessages(messages);
  const signsId = useId();
  const { lang } = viewer;
  const cra = LINES['cra-individuals'];
  return (
    <WidgetShell
      icon={ShieldQuestion}
      tone="amber"
      title={t('urgent.titleSuspected')}
      subtitle={t('urgent.subtitle.suspected')}
      sources={sources}
      handoff={{ href: URLS.cafcReport[lang], label: t('fraud.handoff'), note: t('fraud.handoffNote') }}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <section aria-labelledby={signsId} className={cn('rounded-card px-5 py-5', amberPanel)}>
          <h4 id={signsId} className="m-0 text-[16px] font-semibold leading-snug text-ink dark:text-amber">
            {t('suspect.signs.title')}
          </h4>
          <ul className="m-0 mt-3 grid list-none gap-x-6 gap-y-2.5 p-0 @xl:grid-cols-2">
            {SCAM_SIGNS.map((k) => (
              <li key={k} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink">
                <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-card text-maple" aria-hidden>
                  <X className="size-3" strokeWidth={3} />
                </span>
                <bdi>{t(`suspect.signs.${k}`)}</bdi>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-4 border-t border-amber/20 pt-3 text-[13.5px] leading-snug text-ink-2">
            <bdi>{t('suspect.signs.note')}</bdi>
          </p>
        </section>
      </div>

      <WidgetSection title={t('suspect.steps.title')} className="mt-5">
        <Stepper
          steps={[
            {
              title: <bdi>{t('suspect.steps.verify.title')}</bdi>,
              state: 'current',
              detail: (
                <>
                  <bdi>{t('suspect.steps.verify.detail')}</bdi>
                  <Routes
                    viewer={viewer}
                    online={{ href: URLS.craLogin[lang], label: t('suspect.steps.verify.account'), icon: UserRound }}
                    call={cra.number ? { name: cra.name[lang], number: cra.number, hours: cra.agents } : undefined}
                  />
                </>
              ),
            },
            { title: <bdi>{t('suspect.steps.report.title')}</bdi>, detail: <bdi>{t('suspect.steps.report.detail')}</bdi>, state: 'upcoming' },
            {
              title: <bdi>{t('suspect.steps.paid.title')}</bdi>,
              state: 'upcoming',
              detail: (
                <>
                  <bdi>{t('suspect.steps.paid.detail')}</bdi>
                  {/* The CRA's own line for a shared SIN or sign-in: protections can go on the account during the call. */}
                  <Routes
                    viewer={viewer}
                    online={{ href: URLS.craScam[lang], label: t('suspect.steps.paid.link'), icon: FileWarning }}
                    call={{ name: CRA_FRAUD_LINE.name[lang], number: CRA_FRAUD_LINE.number, hours: CRA_FRAUD_LINE.hours }}
                  />
                </>
              ),
            },
          ]}
        />
        <div className="mt-3">
          <CafcCard viewer={viewer} />
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}
