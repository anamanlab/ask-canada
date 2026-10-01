'use client';
/**
 * IRCC processing times, live from the feeds behind canada.ca: the program in focus as a big number, then every
 * program grouped (pick one to focus it), with country-based times for visitor visas and permits.
 * The programs are one radio group: one Tab stop, arrow keys move between application types.
 */
import { useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Clock3, History } from 'lucide-react';
import { Button, ExternalLink, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import type { TimesOutput } from './build';
import { countryName } from './country-name';
import { URLS } from './data';
import { useRememberedCountry, useShareCountry } from './earlier';
import messages from './messages';
import { ProcessingTimesSkeleton } from './ProcessingTimesSkeleton';
import { CountryChoice, Eyebrow, HandoffHint, Hero, LastKnown, LiveBadge, Section, useDate, useDuration } from './Shared';
import { PausedNotice, StatusLink, TIME_ROW, TimeRowContent, useTimeRowText } from './TimesParts';
import { decodeDuration, durationDays, GROUP_ORDER, isLive, TIME_KEYS, TIME_META, updatedOf, type Duration, type TimeKey } from './times';

type CountryKey = 'visitor' | 'supervisa' | 'study' | 'work';
const isCountryKey = (k: TimeKey): k is CountryKey => !!TIME_META[k].byCountry;

export function ProcessingTimes({ part, locale }: WidgetProps<{ program?: TimeKey; country?: string }, TimesOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('pt.error.title')} message={t('pt.error.body')} fallback={{ href: URLS.processing[locale === 'fr' ? 'fr' : 'en'], label: t('pt.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ProcessingTimesSkeleton program={part.input?.program} lang={locale === 'fr' ? 'fr' : 'en'} />;
  }
  return <Times data={part.output} />;
}

function Times({ data }: { data: TimesOutput }) {
  const t = useMessages(messages);
  const dur = useDuration();
  const rowText = useTimeRowText();
  const [focus, setFocus] = useState<TimeKey | null>(data.focus);
  const { intl } = useLocale();
  const [country, setCountryState] = useState(data.country ?? '');
  // The country from earlier in this conversation (a visa check, another processing-time question): offered
  // back with one tap when this question came without one. The memory lives outside React (earlier.ts).
  const remembered = useRememberedCountry();
  const pinned = data.pinned;
  const earlierCountry = pinned ? pinned.country : remembered;
  const shareCountry = useShareCountry(data.country, !!pinned);
  const setCountry = (code: string) => {
    setCountryState(code);
    shareCountry(code);
  };
  const rowsByKey = new Map(data.data.rows.map((r) => [r.key, r]));
  const countryMaps = data.data.countries;

  const valueOf = (k: TimeKey): Duration | null | 'pick' => {
    if (isCountryKey(k)) {
      if (!country) return 'pick';
      const map = countryMaps[k];
      if (!map) return 'pick';
      return decodeDuration(map[country]);
    }
    return rowsByKey.get(k)?.value ?? null;
  };
  /** Country tables we can switch between on this device (the one in focus is complete). */
  const pickable = (k: CountryKey) => Object.keys(countryMaps[k] ?? {}).length > 20;

  const f = focus ?? 'cec';
  const fv = valueOf(f);
  const meta = TIME_META[f];
  const updated = updatedOf(data.data, f);
  // Per application type: IRCC publishes 4 feeds, and one can be down while the others answer.
  const live = isLive(data.data, f);
  const focusRow = rowsByKey.get(f);
  const waiting = focusRow?.waiting;
  const paused = focusRow?.status === 'paused';
  const lower = (s: string) => s.charAt(0).toLocaleLowerCase(intl) + s.slice(1);
  const quebecLine = (q: Duration | null | undefined) => (q ? t('pt.quebec', { value: lower(dur(q)) }) : null);
  const fdate = useDate();
  const d = (iso: string | null) => (iso ? fdate(iso, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const [all, setAll] = useState(false);
  const groups = all ? [meta.group, ...GROUP_ORDER.filter((g) => g !== meta.group)] : [meta.group];
  const countryCodes = isCountryKey(f) ? Object.keys(countryMaps[f] ?? {}) : [];
  const superVisaNote = useId();
  const heroValue = useRef<HTMLParagraphElement>(null);
  /**
   * "Compare the super visa" removes the notice it sits in. Focus moves to the headline time (a live region, so
   * the new program is read out); the next Tab lands on the country picker, which is the next thing to answer.
   */
  const compareSuperVisa = () => {
    setFocus('supervisa');
    heroValue.current?.focus();
  };
  /** The button leaves once a country is set: focus moves to the headline time, which reads out the new value. */
  const pickEarlierCountry = (code: string) => {
    setCountry(code);
    heroValue.current?.focus();
  };
  // Every application type on screen, in reading order: one radio group across the sections.
  const shown = groups.flatMap((g) => TIME_KEYS.filter((k) => TIME_META[k].group === g));
  const canFocus = (k: TimeKey) => !isCountryKey(k) || pickable(k) || !!country;
  const roving = useRovingFocus({ count: shown.length, index: shown.indexOf(f), onMove: (i) => setFocus(shown[i]), orientation: 'vertical', isDisabled: (i) => !canFocus(shown[i]) });

  return (
    <WidgetShell
      icon={Clock3}
      tone="glacier"
      title={t('pt.title')}
      subtitle={t(live ? 'pt.subtitle' : 'pt.subtitleOff')}
      badge={live ? <LiveBadge /> : undefined}
      sources={data.sources}
      handoff={{ href: URLS.processing[data.lang], label: t('pt.handoff') }}
      secondaryAction={<HandoffHint>{t('pt.handoffNote')}</HandoffHint>}
      className="@container"
    >
      <Hero tone="glacier">
        <Eyebrow>{t(`pt.key.${f}`)}</Eyebrow>
        <p
          ref={heroValue}
          tabIndex={-1}
          className="m-0 mt-2 rounded-md font-serif text-[38px] leading-[.95] tracking-[-.03em] text-ink outline-offset-4 [font-variation-settings:'opsz'_72] focus-visible:outline-2 focus-visible:outline-glacier @xl:text-[44px]"
          aria-live="polite"
        >
          {paused ? t('pt.paused.big') : fv === 'pick' ? t('pt.pickCountry') : <bdi>{dur(fv)}</bdi>}
        </p>
        <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">
          {paused && fv && fv !== 'pick'
            ? t('pt.paused.sub', { value: dur(fv), date: d(updated) })
            : fv === 'pick'
            ? t('pt.pickCountrySub')
            : fv === null
              ? (
                  <ExternalLink href={URLS.processing[data.lang]} icon={false}>
                    {t('pt.noEstimate')}
                  </ExternalLink>
                )
              : t(`pt.basis.${meta.basis}`, { date: d(updated) })}
        </p>
        {focusRow?.quebec ? <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">{quebecLine(focusRow.quebec)}</p> : null}
        {waiting ? <p className="m-0 mt-1 text-[13px] text-ink-3">{t('pt.waiting', { count: waiting })}</p> : null}
        {isCountryKey(f) && countryCodes.length ? (
          <CountryChoice
            className="mt-4 max-w-[340px]"
            label={t('pt.applyingFrom')}
            value={country}
            onChange={setCountry}
            codes={countryCodes}
            placeholder={t('pt.choose')}
          />
        ) : null}
        {isCountryKey(f) && !country && earlierCountry && countryCodes.includes(earlierCountry) ? (
          <Button size="md" variant="secondary" icon={History} className="mt-2.5 max-w-full" onClick={() => pickEarlierCountry(earlierCountry)}>
            <bdi>{t('pt.useCountry', { country: countryName(earlierCountry, intl) })}</bdi>
          </Button>
        ) : null}
      </Hero>
      {live ? null : <LastKnown date={updated} />}

      {paused ? <PausedNotice program={f} lang={data.lang} noteId={superVisaNote} onCompare={compareSuperVisa} /> : null}
      <StatusLink lang={data.lang} />

      <div role="radiogroup" aria-label={t('pt.pick')}>
        {groups.map((g) => {
          const values = shown.filter((k) => TIME_META[k].group === g).map((k) => [k, valueOf(k)] as const);
          const longest = Math.max(1, ...values.map(([, v]) => (v && v !== 'pick' ? durationDays(v) : 0)));
          return (
            <Section key={g} title={t(`pt.group.${g}`)}>
              <div className="grid gap-0.5">
                {values.map(([k, v]) => {
                  const on = k === f;
                  const row = rowsByKey.get(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!canFocus(k)}
                      onClick={() => setFocus(k)}
                      {...roving.itemProps(shown.indexOf(k))}
                      className={cn('group transition-colors disabled:cursor-default', TIME_ROW, on ? 'bg-glacier-wash' : 'hover:bg-paper-2')}
                    >
                      <TimeRowContent
                        label={rowText.label(k)}
                        value={v === 'pick' ? t('pt.byCountry') : <bdi>{dur(v)}</bdi>}
                        known={!!v && v !== 'pick'}
                        chevron={!on && canFocus(k)}
                        paused={row?.status === 'paused'}
                        quebec={rowText.quebec(k, row?.quebec)}
                        meter={v && v !== 'pick' ? { value: durationDays(v), max: longest, on } : undefined}
                      />
                    </button>
                  );
                })}
              </div>
            </Section>
          );
        })}
      </div>
      <div className="px-5 pt-3 sm:px-6">
        <Button size="md" variant="quiet" className="-ms-3 px-3" iconEnd={all ? ChevronUp : ChevronDown} onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? t('pt.showLess') : t('pt.showAll', { count: TIME_KEYS.length })}
        </Button>
      </div>
      <p className="m-0 px-5 pt-4 text-[12.5px] leading-snug text-ink-3 sm:px-6">{t('pt.note')}</p>
    </WidgetShell>
  );
}
