'use client';
/**
 * The three tabs of civicVoterCheck: how to register, the ID you need (with a "what do I have?" pick), and the
 * ways to vote. Sentences sit in <bdi>: English fallback text keeps its punctuation in place on an RTL page.
 */
import { useId, useState, type ReactNode } from 'react';
import { Building2, CalendarCheck2, Check, Clock, Info, Laptop, Mail, Receipt, Vote, type LucideIcon } from 'lucide-react';
import { Badge, Disclosure, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { LinkRow } from './shared';
import type { VoterOutput, VoterVerdict } from './types';

/** One way to register or vote: icon tile, title, detail (and an optional tag like "Start here"). */
function OptionTile({ icon: Icon, title, detail, tag }: { icon: LucideIcon; title: ReactNode; detail: ReactNode; tag?: string }) {
  return (
    <li className={cn('flex gap-3 rounded-tile border bg-card px-4 py-3.5', tag ? 'border-pine/30 shadow-sm' : 'border-hair')}>
      <span className="grid size-9 shrink-0 place-items-center rounded-[calc(var(--radius-field)*0.66)] bg-pine-wash text-pine">
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        {/* The tag sits above the title, so it holds its place however the title wraps (French runs to two lines). */}
        {tag ? (
          <span className="mb-1.5 block">
            <Badge tone="ok">{tag}</Badge>
          </span>
        ) : null}
        <span className="block text-[15px] font-semibold leading-snug text-ink">{title}</span>
        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">
          <bdi>{detail}</bdi>
        </span>
      </span>
    </li>
  );
}

export function RegisterPanel({ data, verdict }: { data: VoterOutput; verdict: VoterVerdict }) {
  const t = useMessages(messages);
  if (verdict === 'too-young' || verdict === 'future-abroad') {
    // Not eligible for any register yet: say what happens when, with no call to act now.
    return (
      <div className="pt-4">
        <p className="m-0 flex gap-3 rounded-tile border border-hair bg-paper-2 px-4 py-3.5 text-[14.5px] leading-snug text-ink">
          <Info className="mt-0.5 size-[18px] shrink-0 text-glacier" strokeWidth={1.8} aria-hidden />
          <span className="max-w-[68ch]">
            <bdi>{t(verdict === 'too-young' ? 'vote.reg.tooYoungInfo' : 'vote.reg.futureAbroadInfo')}</bdi>{' '}
            <ExternalLink href={verdict === 'too-young' ? data.links.futureElectors : data.links.abroad}>
              {t(verdict === 'too-young' ? 'vote.reg.futureLearn' : 'vote.reg.abroadLearn')}
            </ExternalLink>
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className="pt-4">
      <p className="m-0 max-w-[62ch] text-[14.5px] leading-snug text-ink-2">
        <bdi>{t(verdict === 'future-elector' ? 'vote.reg.leadFuture' : verdict === 'abroad' ? 'vote.reg.leadAbroad' : 'vote.reg.lead')}</bdi>
      </p>
      <ul className={cn('m-0 mt-3 grid list-none gap-2.5 p-0', verdict !== 'future-elector' && verdict !== 'abroad' && '@xl:grid-cols-2')}>
        {verdict === 'future-elector' ? (
          <OptionTile icon={Laptop} title={<ExternalLink href={data.links.futureElectors}>{t('vote.reg.future')}</ExternalLink>} detail={t('vote.reg.futureDetail')} />
        ) : verdict === 'abroad' ? (
          <OptionTile icon={Mail} title={<ExternalLink href={data.links.abroad}>{t('vote.reg.abroad')}</ExternalLink>} detail={t('vote.reg.abroadDetail')} />
        ) : (
          <>
            <OptionTile icon={Laptop} title={<ExternalLink href={data.links.ereg}>{t('vote.reg.online')}</ExternalLink>} detail={t('vote.reg.onlineDetail')} tag={t('vote.reg.start')} />
            <OptionTile icon={Receipt} title={t('vote.reg.tax')} detail={t('vote.reg.taxDetail')} />
            <OptionTile icon={Mail} title={<ExternalLink href={data.links.contact}>{t('vote.reg.mail')}</ExternalLink>} detail={t('vote.reg.mailDetail')} />
            <OptionTile icon={Vote} title={t('vote.reg.polls')} detail={t('vote.reg.pollsDetail')} />
          </>
        )}
      </ul>
    </div>
  );
}

const ID_OPTIONS = ['o1', 'o2', 'o3'] as const;
type IdOption = (typeof ID_OPTIONS)[number];

export function IdPanel({ data }: { data: VoterOutput }) {
  const t = useMessages(messages);
  const [pick, setPick] = useState<IdOption | null>(null);
  const leadId = useId();
  const roving = useRovingFocus({ count: ID_OPTIONS.length, index: pick ? ID_OPTIONS.indexOf(pick) : -1, onMove: (i) => setPick(ID_OPTIONS[i]), orientation: 'both' });
  return (
    <div className="pt-4">
      <p id={leadId} className="m-0 text-[14.5px] leading-snug text-ink-2">
        <bdi>{t('vote.id.lead')}</bdi>
      </p>
      {/* One of three: a radio group (one tab stop, arrow keys move and choose), drawn as cards. */}
      <div role="radiogroup" aria-labelledby={leadId} className="mt-3 grid gap-2.5 @xl:grid-cols-3">
        {ID_OPTIONS.map((o, i) => {
          const on = pick === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              {...roving.itemProps(i)}
              onClick={() => setPick(o)}
              className={cn(
                'flex min-h-11 flex-col items-start rounded-tile border px-4 py-3.5 text-start transition-[border-color,background-color,box-shadow] duration-200',
                on ? 'border-pine bg-pine-wash shadow-sm' : 'border-hair bg-card hover:border-hair-2 hover:shadow-sm',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-2">{t(`vote.id.${o}`)}</span>
                <span
                  aria-hidden
                  className={cn('grid size-[22px] place-items-center rounded-full border-[1.5px] transition-colors', on ? 'border-pine bg-pine text-paper' : 'border-hair-2 text-transparent')}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </span>
              <span className="mt-1 text-[15.5px] font-semibold text-ink">
                <bdi>{t(`vote.id.${o}.title`)}</bdi>
              </span>
              <span className="mt-1 text-[13.5px] leading-snug text-ink-2">
                <bdi>{t(`vote.id.${o}.body`)}</bdi>
              </span>
            </button>
          );
        })}
      </div>
      {/* Always one line of text here: a hint until an option is picked, so the spacing never looks empty. */}
      <p className={cn('m-0 mt-3 text-[14px]', pick ? 'font-medium text-pine' : 'text-ink-2')} aria-live="polite">
        <bdi>{pick ? t(`vote.id.result.${pick}`) : t('vote.id.hint')}</bdi>
      </p>
      {/* The examples are option 2's: they appear once option 2 is the choice, never before one is made. */}
      {pick === 'o2' ? (
        <Disclosure title={t('vote.id.examples')} className="mt-2 rounded-tile border border-hair bg-paper-2 px-4">
          <ul className="m-0 grid list-none gap-x-4 gap-y-1.5 p-0 @xl:grid-cols-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <li key={n} className="flex gap-2 text-[13.5px] text-ink-2">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                <bdi>{t(`vote.id.ex.${n}`)}</bdi>
              </li>
            ))}
          </ul>
          <p className="m-0 mb-1.5 mt-2 text-[13.5px]">
            <LinkRow href={data.links.voterId}>{t('vote.id.full')}</LinkRow>
          </p>
        </Disclosure>
      ) : null}
      <ul className="m-0 mt-3 grid list-none gap-1.5 p-0">
        {(['expired', 'digital', 'passport'] as const).map((k) => (
          <li key={k} className="flex gap-2.5 text-[13.5px] leading-snug text-ink-2">
            <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-pine" aria-hidden />
            <bdi>{t(`vote.id.tip.${k}`)}</bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WaysPanel({ data }: { data: VoterOutput }) {
  const t = useMessages(messages);
  const ways = [
    { k: 'day', icon: CalendarCheck2 },
    { k: 'advance', icon: Clock },
    { k: 'office', icon: Building2 },
    { k: 'mail', icon: Mail },
  ] as const;
  return (
    <div className="pt-4">
      <p className="m-0 text-[14.5px] leading-snug text-ink-2">
        <bdi>{t('vote.ways.lead')}</bdi>
      </p>
      <ul className="m-0 mt-3 grid list-none gap-2.5 p-0 @xl:grid-cols-2">
        {ways.map(({ k, icon }) => (
          <OptionTile key={k} icon={icon} title={t(`vote.ways.${k}.title`)} detail={t(`vote.ways.${k}.body`)} />
        ))}
      </ul>
      <p className="m-0 mt-3 text-[13px] text-ink-2">
        <bdi>{t('vote.ways.note')}</bdi> <ExternalLink href={data.links.waysToVote}>{t('vote.ways.linkLabel')}</ExternalLink>
      </p>
    </div>
  );
}
