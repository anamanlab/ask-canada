'use client';
/**
 * One program in the benefits navigator: fit, name, what it is, the headline figure, how to get it, and the star.
 * The first program on the list is `featured`: larger type and figure, and its next step as a button.
 */
import { BadgeCheck, ClipboardCheck, DoorOpen, FileText, Phone, Star, Stethoscope, type LucideIcon } from 'lucide-react';
import { Badge, ExternalLink, LinkButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { tel } from './facts';
import messages from './messages';
import { refFor, type BenefitsOutput, type HowToGet, type ProgramResult, type Service, type Status } from './navigator';

/**
 * Copy written to the Veteran ("your service") has a version for the person asking on their behalf:
 * `<key>Family` / `<key>Survivor` when the catalog has one, else the key itself.
 */
const VOICE: Partial<Record<Status, string>> = { family: 'Family', survivor: 'Survivor' };
export const voiced = (key: string, status: Status) => {
  const v = VOICE[status];
  return v && `${key}${v}` in messages.en ? `${key}${v}` : key;
};
/** First-strong isolate … pop directional isolate: what <bdi> does, for a value placed inside a translated sentence. */
const isolate = (s: string) => `\u2068${s}\u2069`;
const HOW_ICON: Record<HowToGet, LucideIcon> = {
  myvac: FileText,
  'no-application': BadgeCheck,
  'with-disability': ClipboardCheck,
  call: Phone,
  referral: Stethoscope,
  'transition-centre': DoorOpen,
};
/** Row links sit on a 32px line, and a pseudo-element extends the hit area to 44px, so the footer stays compact when it wraps. */
const LINK = 'relative inline-flex min-h-8 items-center gap-1.5 font-medium underline decoration-hair-2 underline-offset-[3px] after:absolute after:inset-x-0 after:-inset-y-1.5';

export function ProgramCard({
  r,
  data,
  status,
  service,
  featured,
  starred,
  onStar,
}: {
  r: ProgramResult;
  data: BenefitsOutput;
  status: Status;
  service: Service;
  /** The first program on the list: a larger card, a larger figure, and its next step as a button. */
  featured?: boolean;
  starred: boolean;
  onStar: () => void;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const p = r.program;
  // Some programs have their own name and official page for an audience (e.g. the VIP for survivors).
  const name = refFor(data.names, p.id, status) ?? p.id;
  const href = refFor(data.urls, p.id, status) ?? data.links.navigator;
  const HowIcon = HOW_ICON[p.how];
  const starLabel = t(starred ? 'nav.unsave' : 'nav.save', { name });
  const phone = p.phone ?? data.phones.vac;
  // Amounts keep their own direction inside a sentence (the plain-text form of <bdi>), so a note that starts
  // with one reads in order in a right-to-left card.
  // The Canadian Forces Income Support maximum changes every quarter: the tool sends the current one.
  const rawValues = p.id === 'cfis' ? { amount: data.rates.cfisMax } : (p.stat?.values ?? {});
  const statValues = Object.fromEntries(Object.entries(rawValues).map(([k, v]) => [k, isolate(fmt.money(v, { cents: 'always' }))]));
  const statKey = p.stat?.key ?? '';
  // Work income the Income Replacement Benefit ignores (veterans.gc.ca): shown in its description and note.
  const earnings = isolate(fmt.money(data.rates.irbEarnings, { cents: 'never' }));
  // Canadian Forces Income Support maximums change every quarter: its note says which adjustment the figure is from.
  const since = isolate(fmt.date(data.rates.cfisSince, { month: 'long', year: 'numeric' }));
  // The Education and Training Benefit maximum depends on years of service: show theirs when we know it.
  // Mental Health Benefits start the day after release for members who applied before leaving (veterans.gc.ca).
  const suffix =
    p.id === 'etb' && service === '12plus' ? '12' : p.id === 'etb' && service === '6to11' ? '6' : p.id === 'mentalHealthBenefits' && status === 'releasing' ? 'Releasing' : '';
  // A side column for the headline figure at @xl, only when there is one. The star is always in the card's top end corner.
  const col = p.stat ? '@xl:col-start-1' : '';
  // The headline: a figure ("$2,500", "24/7") is set at full size; words ("2 business days", "Up to …") one step
  // down and balanced, so the largest type on the card never leaves one word alone on a line. Amounts use
  // non-breaking spaces, so a line only ever breaks before the figure.
  const statValue = p.stat ? t(`${statKey}.value${suffix}`, statValues) : '';
  const wordy = /\p{L}/u.test(statValue);
  const details = (
    <ExternalLink href={href} standalone className={cn(LINK, 'shrink-0 gap-0 text-ink-2 hover:text-ink')}>
      {t('nav.details')}
      <span className="sr-only"> {name}</span>
    </ExternalLink>
  );
  return (
    // One column on phones (headline figure right under the description), a side column for it at @xl.
    <article
      className={cn(
        'relative flex flex-col border bg-card',
        featured ? 'rounded-card border-hair-2 px-5 pb-4 pt-5 shadow-md' : 'rounded-tile border-hair px-4 pb-2.5 pt-3.5 shadow-sm',
        p.stat && (featured ? '@xl:grid @xl:grid-cols-[minmax(0,1fr)_290px] @xl:gap-x-6' : '@xl:grid @xl:grid-cols-[minmax(0,1fr)_236px] @xl:gap-x-5'),
      )}
    >
      <div className={cn('min-w-0 pe-8', col)}>
        <Badge tone={r.fit === 'likely' ? 'ok' : 'warn'} className={featured ? 'mb-2' : 'mb-1.5'}>
          {t(`fit.${r.fit}`)}
        </Badge>
        <h5 className={cn('m-0 font-semibold text-ink', featured ? 'text-[20px] leading-tight tracking-[-.015em]' : 'text-[16.5px] leading-snug tracking-[-.01em]')}>{name}</h5>
      </div>
      <button
        type="button"
        onClick={onStar}
        aria-pressed={starred}
        aria-label={starLabel}
        title={starLabel}
        className={cn('absolute z-[1] grid size-11 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink', featured ? 'end-2.5 top-2.5' : 'end-1.5 top-1.5')}
      >
        <Star className={cn('size-[19px]', starred && 'fill-current text-amber')} strokeWidth={1.8} aria-hidden />
      </button>
      <p className={cn('m-0 text-ink-2', featured ? 'mt-1.5 text-[15.5px] leading-normal' : 'mt-1 text-[14.5px] leading-snug', col)}>{t(voiced(`prog.${p.id}`, status), { earnings })}</p>
      {p.stat ? (
        // The headline figure: a large serif number on a pine rule (no box), so amounts line up down the list.
        <div
          className={cn(
            'flex flex-col border-s-2 border-pine/35 @xl:col-start-2 @xl:row-span-4 @xl:row-start-1 @xl:self-start',
            featured ? 'mt-4 gap-1.5 ps-4 @xl:me-10 @xl:mt-1' : 'mt-3 gap-1 ps-3.5 @xl:mb-2 @xl:me-9 @xl:mt-0.5',
          )}
        >
          <p
            className={cn(
              "m-0 font-serif leading-[1.05] tracking-[-.025em] text-balance text-ink [font-variation-settings:'opsz'_72]",
              featured ? (wordy ? 'text-[28px]' : 'text-[34px]') : wordy ? 'text-[22px] leading-[1.1]' : 'text-[25px]',
            )}
          >
            <bdi>{statValue}</bdi>
          </p>
          <p className={cn('m-0 leading-snug text-ink-2', featured ? 'text-[13.5px]' : 'text-[13px]')}>
            <bdi>{t(voiced(`${statKey}.note${suffix}`, status), { ...statValues, earnings, since })}</bdi>
          </p>
        </div>
      ) : null}
      {r.reasons.length ? (
        <ul className={cn('m-0 grid list-none gap-1 p-0', featured ? 'mt-3' : 'mt-2.5 @xl:mt-2', col)}>
          {r.reasons.map((k) => (
            <li key={k} className={cn('flex gap-2 leading-snug text-ink-2', featured ? 'text-[14px]' : 'text-[13.5px]')}>
              <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-amber" aria-hidden />
              {t(voiced(k, status))}
            </li>
          ))}
        </ul>
      ) : null}
      {featured ? (
        <div className={cn('mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]', col)}>
          {p.how === 'call' ? (
            <LinkButton href={tel(phone)} variant="primary" size="md" icon={Phone} className="font-semibold max-sm:w-full">
              {t('how.call', { phone })}
            </LinkButton>
          ) : p.how === 'myvac' ? (
            <LinkButton href={data.links.myVacSignIn} variant="primary" size="md" external className="text-center font-semibold max-sm:w-full max-sm:px-3">
              {t('how.myvacCta')}
            </LinkButton>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-1.5 font-medium text-ink">
              <HowIcon className="size-[17px] shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
              {t(`how.${p.how}`)}
            </span>
          )}
          {details}
        </div>
      ) : (
        // In a phone-width column every card has the same footer: how to get it at the start (it wraps in place),
        // "Details" at the end edge of the same row.
        <p className={cn('m-0 mt-2 flex items-center gap-x-3.5 gap-y-0 text-[13.5px] @max-sm:justify-between @sm:flex-wrap', col)}>
          {p.how === 'call' ? (
            <a href={tel(phone)} className={cn(LINK, 'text-ink hover:decoration-ink')}>
              <HowIcon className="size-4 shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
              {t('how.call', { phone })}
            </a>
          ) : (
            <span className="inline-flex min-h-8 min-w-0 items-center gap-1.5 font-medium leading-snug text-ink">
              <HowIcon className="size-4 shrink-0 text-pine" strokeWidth={1.9} aria-hidden />
              {t(`how.${p.how}`)}
            </span>
          )}
          {details}
        </p>
      )}
    </article>
  );
}
