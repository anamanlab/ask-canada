'use client';
/**
 * The notes under the calendar: a notice read live from the CRA's payment-dates page, the Quebec Pension Plan note,
 * and how long to wait before calling about a late payment.
 */
import { useId } from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';
import { Disclosure, ExternalLink, Notice } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PROGRAM_META, URLS, type Program } from '../data';
import messages from '../messages';
import { Dot, LINK_LINE, NoBreakPhones } from '../parts';
import { sentencesOf } from '../select';
import type { LiveNotice } from '../types';

/**
 * A notice read live from a canada.ca page: its headline, then one short bullet per sentence (the official wording,
 * never rewritten), then the link to the notice.
 */
export function LiveAlert({ n }: { n: LiveNotice }) {
  const t = useMessages(messages);
  const id = useId();
  const sentences = n.body ? sentencesOf(n.body) : [];
  const Icon = n.tone === 'warn' ? AlertTriangle : Info;
  return (
    <section aria-labelledby={id} className={cn('rounded-[16px] px-4 py-3.5', n.tone === 'warn' ? 'bg-amber-wash' : 'bg-glacier-wash')}>
      <div className="flex gap-3">
        <Icon className={cn('mt-px size-[18px] shrink-0', n.tone === 'warn' ? 'text-amber' : 'text-glacier')} strokeWidth={1.9} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-2">{t('note.alert.eyebrow')}</p>
          <h4 id={id} className="m-0 mt-0.5 text-[14.5px] font-semibold leading-snug text-ink">
            {n.title}
          </h4>
          {sentences.length ? (
            <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-[14px] leading-snug text-ink-2">
              {sentences.map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ink-3" />
                  <span className="min-w-0">
                    <NoBreakPhones text={x} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <ExternalLink href={n.url} className={cn(LINK_LINE, 'mt-1 text-[14px]')}>
            {t('note.alert.more')}
          </ExternalLink>
        </div>
      </div>
    </section>
  );
}

/**
 * Quebec: who gets the Quebec Pension Plan instead of the CPP (canada.ca CPP eligibility page, see data.ts). With the CPP
 * followed, it warns that those dates may not apply; with it off, it says why it starts off.
 */
export function QppNote({ on }: { on: boolean }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  return (
    <Notice tone="info" title={t('qpp.title')}>
      <span className="mt-1 block text-[14px] text-ink-2">{t(on ? 'qpp.bodyOn' : 'qpp.body')}</span>
      <ExternalLink href={URLS.cppQuebec[locale === 'fr' ? 'fr' : 'en']} className={cn(LINK_LINE, 'mt-0.5 text-[14px]')}>
        {t('qpp.link')}
      </ExternalLink>
    </Notice>
  );
}

type WaitGroup = { key: string; programs: Program[]; days: 5 | 10 | null; who: 'cra' | 'sc' | 'vac' };

/**
 * How long to wait for a late payment, per program followed (CRA page footnotes: 5 working days for the CCB and
 * ACFB, 10 for the others; benefits calendar: 5 to 10 business days for Service Canada and Veterans Affairs).
 */
function waitGroups(programs: Program[]): WaitGroup[] {
  const order = ['cra-5', 'cra-10', 'sc', 'vac'];
  const by = new Map<string, WaitGroup>();
  for (const p of programs) {
    const m = PROGRAM_META[p];
    const key = m.admin === 'cra' ? `cra-${m.waitDays}` : m.admin;
    const g = by.get(key) ?? { key, programs: [], days: m.admin === 'cra' ? m.waitDays : null, who: m.admin };
    g.programs.push(p);
    by.set(key, g);
  }
  return [...by.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

/**
 * "If a payment is late": the wait before contacting each program, built from what the person follows. Closed by
 * default (the hero already says a payment can take a few days) and only built when it's opened.
 */
export function LateNote({ programs }: { programs: Program[] }) {
  const t = useMessages(messages);
  return (
    <Disclosure
      lazy
      className="rounded-[16px] border-t-0 bg-glacier-wash px-4"
      title={
        <>
          <Clock className="me-1 size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
          {t('note.late.title')}
        </>
      }
    >
      <WaitList programs={programs} />
    </Disclosure>
  );
}

function WaitList({ programs }: { programs: Program[] }) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const list = new Intl.ListFormat(intl, { style: 'long', type: 'conjunction' });
  return (
    <div className="pb-2.5 ps-[30px]">
      <p className="m-0 text-[14px] leading-snug text-ink-2">{t('note.arrive.lead')}</p>
      <ul className="m-0 mt-2.5 list-none p-0 text-[14px] leading-snug" aria-label={t('note.wait.label')}>
        {waitGroups(programs).map((g) => (
          <li key={g.key} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-t border-hair py-2 first:border-t-0">
            <span aria-hidden className="inline-flex min-w-0 flex-1 basis-[12rem] flex-wrap items-center gap-x-2.5 gap-y-1 text-ink-2">
              {g.programs.map((p) => (
                <span key={p} className="inline-flex items-start gap-1.5">
                  <Dot tone={PROGRAM_META[p].tone} className="mt-[6px] size-2" />
                  {t(`program.${p}.short`)}
                </span>
              ))}
            </span>
            <span className="sr-only">{t('note.wait.sr', { names: list.format(g.programs.map((p) => t(`program.${p}.name`))) })} </span>
            <span className="min-w-0 text-end @max-md:text-start @md:shrink-0">
              {/* <bdi>: "5 to 10 business days" keeps its word order inside right-to-left text. */}
              <b className="font-semibold text-ink @md:block">
                <bdi>{g.days ? t('note.wait.days', { count: g.days }) : t('note.wait.range')}</bdi>
              </b>{' '}
              <span className="text-[13px] text-ink-2 @md:block">
                <bdi>{t('note.wait.who', { who: g.who })}</bdi>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
