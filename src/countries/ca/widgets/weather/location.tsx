'use client';
/**
 * "Where?" for the three weather renderers: the place saved on this device, "Use my location" (resolved on
 * the device) and the picker shown when a question had no place, an unknown place, an ambiguous one, or a
 * place we couldn't look up just now.
 */
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, BookmarkCheck, LocateFixed, MapPin, RotateCcw, Search } from 'lucide-react';
import { Button, Chip, ExternalLink, Input, Notice } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import { askName, splitName, useProvinceName } from './format';
import messages from './messages';
import type { LocateFailure, PlaceOption } from './types';

/** What a follow-up question asks about a place. `smoke` keeps a wildfire-smoke question about smoke. */
type AskKind = 'forecast' | 'alerts' | 'air' | 'smoke';

type SavedPlace = { id: string; name: string; province: string };

/**
 * "My place", saved only on this device from the forecast widget ("Save as my place"). Pickers offer it
 * first, as the default answer to "where?".
 */
export function useSavedPlace() {
  const t = useMessages(messages);
  return useDeviceItem<SavedPlace>('weather:place', { label: t('saved.label'), kind: 'preference' });
}

/** "Use my location": finds the nearest forecast location on the device, then asks about that place. */
function useMyLocation(kind: AskKind) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const { send } = useChatActions();
  const [state, setState] = useState<'idle' | 'busy' | 'denied' | 'error'>('idle');
  const run = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('error');
      return;
    }
    setState('busy');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Coordinates never leave the device: the nearest forecast location is found here, and only its name is sent.
          const { nearestCity } = await import('./nearest');
          const { place } = nearestCity(pos.coords.latitude, pos.coords.longitude, locale === 'fr' ? 'fr' : 'en');
          setState('idle');
          send(t(`ask.${kind}`, { place: askName(place) }));
        } catch {
          setState('error');
        }
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };
  return { run, state };
}

/**
 * "Use my location" with its privacy line. `lead` sits before it on the same row (the saved place, which
 * then becomes the primary choice and this button the secondary one).
 */
export function MyLocationButton({ kind, variant = 'primary', className, lead }: { kind: AskKind; variant?: 'primary' | 'secondary'; className?: string; lead?: ReactNode }) {
  const t = useMessages(messages);
  const { run, state } = useMyLocation(kind);
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {lead}
        <Button variant={variant} icon={state === 'busy' ? undefined : LocateFixed} loading={state === 'busy'} onClick={run} className="max-sm:w-full">
          {t('where.useLocation')}
        </Button>
      </div>
      <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3" aria-live="polite">
        {state === 'denied' ? t('where.denied') : state === 'error' ? t('where.error') : t('where.privacy')}
      </p>
    </div>
  );
}

/** Need a place / didn't find it / which one? — my place, "use my location", a search box and quick picks. */
export function LocationPicker({ failure, kind }: { failure: LocateFailure; kind: AskKind }) {
  const t = useMessages(messages);
  const prov = useProvinceName();
  const { send } = useChatActions();
  const { locale } = useLocale();
  const [saved] = useSavedPlace();
  const [q, setQ] = useState('');
  const id = useId();
  const ask = (place: string) => send(t(`ask.${kind}`, { place }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (v) ask(v);
  };
  const mine = saved && failure.status !== 'ambiguous' ? saved : null;
  const mineLabel = mine ? t('where.mine', { place: splitName(mine.name).base }) : '';
  const picks: PlaceOption[] = failure.status === 'ambiguous' ? failure.options : failure.popular.filter((p) => p.id !== mine?.id);
  // An ambiguous town that isn't a forecast location itself says whose forecast answers for it.
  const label = (p: PlaceOption) =>
    failure.status !== 'ambiguous' ? splitName(p.name).base : p.near ? t('where.optionNear', { place: p.name, prov: prov(p.province), near: splitName(p.near).base }) : `${p.name}, ${prov(p.province)}`;
  const lead =
    failure.status === 'lookup-unavailable' ? (
      <Button variant="primary" icon={RotateCcw} onClick={() => ask(failure.query)} className="max-sm:w-full">
        {t('where.retry')}
      </Button>
    ) : mine && failure.status === 'need-location' ? (
      <Button variant="primary" icon={BookmarkCheck} onClick={() => ask(askName(mine))} className="max-sm:w-full">
        {mineLabel}
      </Button>
    ) : null;
  return (
    <div className="px-5 pb-1 pt-1 sm:px-6">
      {failure.status === 'not-found' ? (
        <Notice tone="info" icon={MapPin} className="mb-4" title={t('where.notFound', { q: failure.query })}>
          {t('where.notFoundBody')}
        </Notice>
      ) : failure.status === 'lookup-unavailable' ? (
        // The lookup didn't answer: say so (the place may well exist); "Try again" below asks the same question.
        <Notice tone="warn" icon={MapPin} className="mb-4" title={t('where.lookupDown', { q: failure.query })}>
          {t('where.lookupDownBody')}
        </Notice>
      ) : null}
      {failure.status !== 'ambiguous' ? (
        <>
          {/* Asked with no place: the saved place is the default (primary) answer. Lookup down: trying again is. */}
          <MyLocationButton
            kind={kind}
            variant={lead ? 'secondary' : 'primary'}
            lead={lead}
          />
          <form onSubmit={submit} className="mt-4 flex gap-2" role="search" aria-labelledby={`${id}-l`}>
            <label id={`${id}-l`} htmlFor={`${id}-q`} className="sr-only">
              {t('where.searchLabel')}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-[17px] -translate-y-1/2 text-ink-3" aria-hidden />
              <Input
                id={`${id}-q`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('where.placeholder')}
                autoComplete="address-level2"
                enterKeyHint="search"
                className="ps-10"
              />
            </div>
            {/* On phones the submit collapses to an arrow so the placeholder has room; the label stays for AT. */}
            <Button type="submit" variant="secondary" disabled={!q.trim()} iconEnd={ArrowRight} className="max-sm:w-12 max-sm:shrink-0 max-sm:px-0">
              <span className="max-sm:sr-only">{t('where.go')}</span>
            </Button>
          </form>
        </>
      ) : null}
      <p className="m-0 mb-2.5 mt-5 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
        {failure.status === 'ambiguous' ? t('where.pickOne') : t('where.popular')}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {mine && (failure.status === 'not-found' || failure.status === 'lookup-unavailable') ? (
          <li className="min-w-0 max-w-full">
            {/* The saved place leads the list, filled, but not `selected`: it asks a question, it is not a toggle (no aria-pressed). `!` beats the unlayered .glass. */}
            <Chip icon={BookmarkCheck} iconClassName="text-paper" wrap className="max-w-full border-ink bg-ink! text-paper" onClick={() => ask(askName(mine))}>
              {mineLabel}
            </Chip>
          </li>
        ) : null}
        {picks.map((p) => (
          <li key={p.id} className="min-w-0 max-w-full">
            <Chip
              icon={MapPin}
              wrap
              className="max-w-full"
              onClick={() => ask(failure.status === 'ambiguous' ? `${p.name}, ${p.province.toUpperCase()}` : splitName(p.name).base)}
            >
              {label(p)}
            </Chip>
          </li>
        ))}
      </ul>
      {/* The official way out for a town we can't match: weather.gc.ca's own location search. */}
      <ExternalLink href={URLS.forecastHome[locale === 'fr' ? 'fr' : 'en']} standalone className="-mb-2 mt-3 text-[14px] text-ink-2 underline-offset-4">
        {/* One isolated run, so the sentence keeps its word order inside a right-to-left page. */}
        <bdi>{t('where.findOfficial')}</bdi>
      </ExternalLink>
    </div>
  );
}

/** Heading copy for a picker state. */
export function pickerTitle(t: (k: string, v?: Record<string, string | number>) => string, failure: LocateFailure) {
  return failure.status === 'ambiguous' ? t('where.which', { q: failure.query }) : failure.status === 'not-found' ? t('where.titleAgain') : failure.status === 'lookup-unavailable' ? t('where.titleLookup') : t('where.title');
}
