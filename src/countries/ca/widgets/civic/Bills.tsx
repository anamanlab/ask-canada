'use client';
/** One bill in civicParliament: the focus card with its full track, and the compact list row. */
import { FileText, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { BillTrack, type TrackLabels } from './BillTrack';
import messages from './messages';
import { CardArrow, CardLink } from './shared';
import type { BillSummary, TrackStep } from './types';

function useTrackLabels(full: boolean, defeated: boolean): TrackLabels {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const day = (d: string) => fmt.date(d, { month: 'short', day: 'numeric', year: 'numeric' });
  const chamber = (s: TrackStep) => t(s.chamber === 'house' ? 'parl.track.houseFull' : 'parl.track.senateFull');
  return {
    house: t(full ? 'parl.track.houseFull' : 'parl.track.house'),
    senate: t(full ? 'parl.track.senateFull' : 'parl.track.senate'),
    assent: t(full ? 'parl.step.assent' : 'parl.track.assent'),
    assentShort: t('parl.track.assent'),
    stage: (s) => (s.stage ? t(`parl.track.short.${s.stage}`) : ''),
    stageLong: (s) => (s.stage ? t(`parl.track.long.${s.stage}`) : ''),
    title: (s) =>
      `${s.chamber === 'assent' ? t('parl.step.assent') : `${chamber(s)} · ${t(`parl.track.long.${s.stage}`)}`} · ${
        s.date ? t('parl.track.done', { date: day(s.date) }) : s.done ? t('parl.track.doneNoDate') : t('parl.track.pending')
      }`,
    now: t('parl.track.now'),
    stopped: t(defeated ? 'parl.bill.defeated' : 'parl.track.paused'),
    passed: (d) => t('parl.track.passed', { date: day(d) }),
    assented: (d) => t('parl.track.assented', { date: day(d) }),
  };
}

/** Screen-reader sentence for a track: the true current stage, then the official status line. */
function useTrackSentence(bill: BillSummary) {
  const t = useMessages(messages);
  const step = bill.track[bill.at];
  if (bill.law || !step) return t('parl.track.srLaw', { code: bill.code });
  const where =
    step.chamber === 'assent'
      ? t('parl.step.assent')
      : t('parl.track.where', { stage: t(`parl.track.long.${step.stage}`), chamber: t(step.chamber === 'house' ? 'parl.track.houseFull' : 'parl.track.senateFull') });
  return t('parl.track.sr', { code: bill.code, where, status: bill.status.replace(/\.$/, '') });
}

export function FocusBill({ bill }: { bill: BillSummary }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const labels = useTrackLabels(true, bill.defeated);
  const sentence = useTrackSentence(bill);
  const paused = !!bill.paused && !bill.law;
  // Parked or voted down: the bill sits at this step, it isn't moving through it.
  const stopped = paused || bill.defeated;
  return (
    <div
      className={cn(
        'rounded-card border px-5 py-5',
        bill.law ? 'border-pine/15 bg-[linear-gradient(135deg,var(--pine-wash),transparent_60%)]' : 'border-hair bg-[linear-gradient(135deg,var(--glacier-wash),transparent_60%)]',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={bill.law ? 'ok' : bill.defeated ? 'danger' : 'info'} icon={FileText} mono>
          {bill.code}
        </Badge>
        <span className="text-[12.5px] font-medium text-ink-2">{t(`parl.bill.kind.${bill.kind}`)}</span>
        {bill.defeated ? (
          <Badge tone="danger" className="ms-auto">
            {t('parl.bill.defeated')}
          </Badge>
        ) : paused ? (
          <Badge icon={PauseCircle} className="ms-auto">
            {t('parl.track.paused')}
          </Badge>
        ) : null}
      </div>
      <p className="m-0 mt-2.5 font-serif text-[24px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">{bill.title}</p>
      <p className="m-0 mt-1.5 text-[15px] font-medium text-ink-2" role="status">
        {bill.status}
        {bill.lastMoved ? <span className="font-normal text-ink-2"> · {t('parl.bill.moved', { date: fmt.date(bill.lastMoved, { month: 'long', day: 'numeric', year: 'numeric' }) })}</span> : null}
      </p>
      <div className="mt-4 border-t border-hair pt-4">
        <BillTrack track={bill.track} at={bill.at} stopped={stopped} labels={labels} />
      </div>
      <p className="sr-only">{sentence}</p>
    </div>
  );
}

export function BillRow({ bill }: { bill: BillSummary }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const labels = useTrackLabels(false, bill.defeated);
  const sentence = useTrackSentence(bill);
  const paused = !!bill.paused && !bill.law;
  const stopped = paused || bill.defeated;
  return (
    <li className="rounded-tile border border-hair bg-card px-4 py-3.5 transition-shadow hover:shadow-sm">
      <CardLink href={bill.url} className="block">
        <span className="flex items-start gap-2">
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[12px] font-semibold text-ink">{bill.code}</span>
            <span className="text-[12px] text-ink-2">{t(`parl.bill.kind.${bill.kind}`)}</span>
            {bill.law ? (
              <Badge tone="ok" className="ms-auto">
                {t('parl.bill.law')}
              </Badge>
            ) : bill.defeated ? (
              <Badge tone="danger" className="ms-auto">
                {t('parl.bill.defeated')}
              </Badge>
            ) : paused ? (
              // A long badge: it fits beside the bill code only on wide rows. Narrow rows show it under the title.
              <Badge icon={PauseCircle} className="ms-auto hidden @xl:inline-flex">
                {t('parl.track.paused')}
              </Badge>
            ) : null}
          </span>
          <CardArrow className="mt-0.5" />
        </span>
        <span className="mt-1 block text-[15px] font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-hair-2 group-hover:underline-offset-[3px]">{bill.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2 @xl:mt-0.5">
          {paused ? (
            <Badge icon={PauseCircle} className="@xl:hidden">
              {t('parl.track.paused')}
            </Badge>
          ) : null}
          <span>
            {bill.status}
            {bill.lastMoved ? <span> · {fmt.date(bill.lastMoved, { month: 'short', day: 'numeric', year: 'numeric' })}</span> : null}
          </span>
        </span>
        <span className="mt-2.5 block">
          <BillTrack track={bill.track} at={bill.at} stopped={stopped} labels={labels} compact />
        </span>
        <span className="sr-only">
          {sentence} {t('parl.bill.open', { code: bill.code })}
        </span>
      </CardLink>
    </li>
  );
}
