'use client';
/**
 * The parts of the visa / eTA check, shared by the result and its loading state. With `ghost`, the same layout is
 * drawn as placeholders over the real copy and controls (see Skeletons.tsx), so the skeleton can never drift
 * from the result's height.
 */
import type { ReactNode } from 'react';
import { Globe2, Plane, ShieldCheck, Stamp } from 'lucide-react';
import { LinkButton, Notice, Segmented, Skeleton, Stat, Toggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { countryName } from './country-name';
import { FEES, URLS, type Fees, type Lang } from './data';
import { needsEta, needsVisa, type EntryKind, type EntryResult, type Travel } from './entry';
import messages from './messages';
import { CountryChoice, HandoffHint, HERO_RADIUS, Section, useDuration } from './Shared';
import { Ghost, SkText } from './Skeletons';
import type { Duration } from './times';

const TONE: Record<EntryKind, 'maple' | 'pine' | 'glacier' | 'amber'> = {
  visa: 'maple',
  'visa-conditional': 'maple',
  eta: 'glacier',
  'eta-conditional': 'glacier',
  'passport-only': 'pine',
  'none-us': 'pine',
  canadian: 'pine',
  unknown: 'amber',
};
const ACCENT = { maple: 'bg-maple', pine: 'bg-pine', glacier: 'bg-glacier', amber: 'bg-amber' };
const TILE = { maple: 'bg-maple-wash text-maple', pine: 'bg-pine-wash text-pine', glacier: 'bg-glacier-wash text-glacier', amber: 'bg-amber-wash text-amber' };

type VisaFees = Pick<Fees, 'eta' | 'visitorVisa' | 'biometrics'>;

/**
 * The actions under the check. The country list is a strong hint, never the final word (dual citizens, travel
 * documents, permanent residents…), so IRCC's own questions are always the primary action; applying is second.
 */
export function useVisaActions(r: EntryResult, lang: Lang) {
  const t = useMessages(messages);
  const verdict = needsVisa(r.kind) || needsEta(r.kind) || r.kind === 'passport-only';
  const handoff = {
    href: URLS.checkVisaEta[lang],
    label: t(verdict ? 'visa.handoff.confirm' : 'visa.handoff.check'),
    note: t(verdict ? 'visa.handoff.confirmNote' : 'visa.handoff.checkNote'),
  };
  const secondary = needsEta(r.kind)
    ? { href: URLS.eta[lang], label: t('visa.secondary.eta') }
    : needsVisa(r.kind)
      ? { href: URLS.applyVisitorVisa[lang], label: t('visa.secondary.visa') }
      : null;
  // With a second button beside it, the hint moves into the footnote (one quiet provenance line).
  return {
    handoff: { href: handoff.href, label: handoff.label },
    /** The hint beside the button when there is no second button (the loading state draws it as a placeholder). */
    note: secondary ? undefined : handoff.note,
    footnote: secondary ? `${handoff.note} ${t('visa.footnote')}` : t('visa.footnote'),
    secondary: secondary ? (
      <LinkButton href={secondary.href} external variant="secondary" size="lg" className="max-sm:w-full">
        {secondary.label}
      </LinkButton>
    ) : (
      <HandoffHint>{handoff.note}</HandoffHint>
    ),
  };
}

/** Boarding-pass verdict: whose passport, the answer in one line, why, and the fees and time that go with it. */
export function VerdictCard({ r, history, fees, time, ghost }: { r: EntryResult; history: boolean; fees?: VisaFees; time?: Duration | null; ghost?: boolean }) {
  const t = useMessages(messages);
  const { fmt, intl } = useLocale();
  const dur = useDuration();
  const tone = TONE[r.kind];
  const name = r.country ? countryName(r.country, intl) : '';
  // Arriving by land or sea rules out the eTA route: say so in terms of what the person just answered.
  const subKey = r.kind === 'visa-conditional' && r.travel === 'land-sea' ? (history ? 'visa-conditional-land-history' : 'visa-conditional-land') : r.kind;
  const Icon = needsVisa(r.kind) ? Stamp : needsEta(r.kind) ? Plane : r.kind === 'unknown' ? Globe2 : ShieldCheck;
  const tx = (node: ReactNode) => (ghost ? <SkText>{node}</SkText> : node);
  // While loading, the published fees stand in for the live ones (same width, so the same wrapping).
  const f = fees ?? FEES;
  const stat = 'rounded-none border-0 bg-transparent';
  const last = 'col-span-2 border-t border-hair @xl:col-span-1 @xl:border-s @xl:border-t-0';
  return (
    <div
      className={cn('mx-3 overflow-hidden border border-hair sm:mx-4', HERO_RADIUS, !ghost && 'bg-card shadow-sm')}
      {...(ghost ? { 'aria-hidden': true } : { role: 'status', 'aria-live': 'polite' })}
    >
      {ghost ? <Skeleton className="h-1.5 w-full rounded-none" /> : <div className={cn('h-1.5', ACCENT[tone])} aria-hidden />}
      <div className="grid gap-4 px-5 py-5 @xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink-2">
            {tx(`${r.country ? t('visa.passportOf', { country: name }) : t('visa.noCountry')}${r.country ? ` · ${t(`visa.travel.${r.travel}`)}` : ''}`)}
          </p>
          <p className="m-0 mt-2 font-serif text-[30px] leading-[1.1] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_48]">{tx(t(`visa.kind.${r.kind}`))}</p>
          <p className="m-0 mt-2 max-w-[56ch] text-[14.5px] leading-snug text-ink-2">{tx(t(`visa.kindSub.${subKey}`))}</p>
        </div>
        {ghost ? (
          <Skeleton className="hidden size-16 self-start rounded-tile @xl:block" />
        ) : (
          <span className={cn('hidden size-16 place-items-center self-start rounded-tile @xl:grid', TILE[tone])} aria-hidden>
            <Icon className="size-8" strokeWidth={1.5} />
          </span>
        )}
      </div>
      {needsEta(r.kind) ? (
        <div className="grid grid-cols-2 border-t border-dashed border-hair-2 @xl:grid-cols-3">
          <Stat className={stat} label={tx(t('visa.stat.fee'))} value={tx(fmt.money(f.eta))} note={tx(t('visa.stat.etaFeeNote'))} size="sm" />
          <Stat className={cn(stat, 'border-s border-hair')} label={tx(t('visa.stat.time'))} value={tx(t('visa.stat.minutes'))} note={tx(t('visa.stat.etaTimeNote'))} size="sm" />
          <Stat className={cn(stat, last)} label={tx(t('visa.stat.valid'))} value={tx(t('visa.stat.years', { count: 5 }))} note={tx(t('visa.stat.validNote'))} size="sm" />
        </div>
      ) : needsVisa(r.kind) ? (
        <div className="grid grid-cols-2 border-t border-dashed border-hair-2 @xl:grid-cols-3">
          <Stat className={stat} label={tx(t('visa.stat.fee'))} value={tx(fmt.money(f.visitorVisa))} note={tx(t('visa.stat.visaFeeNote'))} size="sm" />
          <Stat className={cn(stat, 'border-s border-hair')} label={tx(t('visa.stat.biometrics'))} value={tx(fmt.money(f.biometrics))} note={tx(t('visa.stat.biometricsNote'))} size="sm" />
          <Stat
            className={cn(stat, last)}
            label={tx(t('visa.stat.time'))}
            value={tx(time ? <bdi>{dur(time)}</bdi> : t('visa.stat.varies'))}
            // While loading, the country's time isn't known yet: reserve the usual line ("Applying from: …").
            note={tx(time || ghost ? t('visa.stat.timeNote', { country: name }) : t('visa.stat.timeNone'))}
            size="sm"
          />
        </div>
      ) : null}
    </div>
  );
}

type TripProps = {
  r: EntryResult;
  country: string;
  history: boolean;
  greenCard: boolean;
  codes: string[];
  onCountry: (code: string) => void;
  onTravel: (travel: Travel) => void;
  onHistory: (on: boolean) => void;
  onGreenCard: (on: boolean) => void;
  ghost?: boolean;
};

/** "Your trip": passport country, how the person arrives, and the two answers that can change the verdict. */
export function TripForm({ r, country, history, greenCard, codes, onCountry, onTravel, onHistory, onGreenCard, ghost }: TripProps) {
  const t = useMessages(messages);
  const tx = (node: ReactNode) => (ghost ? <SkText>{node}</SkText> : node);
  const block = (node: ReactNode, className?: string) => (ghost ? <Ghost className={className}>{node}</Ghost> : className ? <div className={className}>{node}</div> : node);
  return (
    <Section title={tx(t('visa.trip'))}>
      <div className="grid gap-4 @xl:grid-cols-2">
        {block(<CountryChoice label={t(r.kind === 'unknown' && !country ? 'visa.field.countryOptional' : 'visa.field.country')} value={country} onChange={onCountry} codes={codes} placeholder={t('visa.field.choose')} />)}
        {block(
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-medium text-ink">{t('visa.field.travel')}</span>
            <Segmented
              label={t('visa.field.travel')}
              value={r.travel}
              onChange={onTravel}
              options={[
                // Short labels, so both options stay on one line in French; the verdict spells the answer out.
                { value: 'air', label: t('visa.travelShort.air') },
                { value: 'land-sea', label: t('visa.travelShort.land-sea') },
              ]}
            />
          </div>,
        )}
      </div>
      {r.conditional || r.country !== 'US'
        ? block(
            <div className="divide-y divide-hair rounded-tile border border-hair px-4">
              {r.conditional ? <Toggle className="py-2" label={t('visa.field.history')} description={t('visa.field.historyHint')} checked={history} onChange={onHistory} /> : null}
              {r.country !== 'US' ? <Toggle className="py-2" label={t('visa.field.greenCard')} description={t('visa.field.greenCardHint')} checked={greenCard} onChange={onGreenCard} /> : null}
            </div>,
            'mt-3',
          )
        : null}
      {r.note
        ? block(
            <Notice tone="warn" title={t(`visa.note.${r.note}.title`)}>
              {t(`visa.note.${r.note}.body`)}
            </Notice>,
            'mt-3',
          )
        : null}
      <p className="m-0 mt-3 text-[12.5px] leading-snug text-ink-3">{tx(t('visa.permitNote'))}</p>
    </Section>
  );
}
