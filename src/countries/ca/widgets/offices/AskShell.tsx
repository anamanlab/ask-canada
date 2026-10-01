'use client';
/** The finder before it has a place: a postal code / town box, "use my location", and the official finder link. */
import { useEffect, useEffectEvent, useState, type FormEvent } from 'react';
import { History, LocateFixed, MapPin, Search } from 'lucide-react';
import { Button, ExternalLink, Field, Input, WidgetShell } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import messages from './messages';
import { finderSources, fsaOf, PASSPORTISH } from './search';
import { useEarlierSearch } from './searchStore';
import { placeName, useLang } from './shared';
import { useGuardedSend } from './useGuardedSend';
import type { FinderOutput } from './types';

/**
 * No location yet, or not found: ask for a postal code or place (or a rounded location), then send it as the
 * person. Not-found keeps what they typed in the box; a place searched earlier on this page is one tap away.
 * While an answer is being written the three buttons wait (the one that was pressed shows a spinner), so a
 * second question can never land in the middle of the first answer.
 */
type Via = 'form' | 'here' | 'recent';
export function AskShell({ data }: { data: FinderOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { send, busy: answering } = useGuardedSend();
  // Which button asked: it carries the spinner while the answer is written.
  const [via, setVia] = useState<Via | null>(null);
  const notFound = data.status === 'not-found';
  const [value, setValue] = useState(notFound ? (data.query ?? '') : '');
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(notFound ? t('ask.notFound', { query: data.query ?? '' }) : null);
  const remembered = placeName(useEarlierSearch(data.asOf));
  const recent = notFound ? null : remembered;
  const passportish = PASSPORTISH.includes(data.need);

  /** Send as the person; if an answer is still being written, say so instead of sending into it. */
  function ask(text: string, from: Via) {
    const sent = send(text);
    if (sent === 'busy') return setErr(t('ask.wait'));
    setErr(null);
    if (sent === 'sent') setVia(from);
  }
  const go = (place: string, from: Via) => ask(t(`ask.send.${data.need}`, { place }), from);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return setErr(t('ask.required'));
    // Privacy: a postal code goes into the conversation as its first 3 characters only.
    go(fsaOf(v) ?? v, 'form');
  }

  // A fix can arrive seconds after the tap: these read the chat's status as it is then, not as it was at the tap.
  const onFix = useEffectEvent((pos: GeolocationPosition) => {
    setLocating(false);
    // Rounded to 2 decimals (about 1 km) before it leaves the device. Strings keep the dot in every locale.
    const lat = pos.coords.latitude.toFixed(2);
    const lng = pos.coords.longitude.toFixed(2);
    ask(t(`ask.sendHere.${data.need}`, { coords: `(${lat}, ${lng})` }), 'here');
  });
  const onNoFix = useEffectEvent((e: GeolocationPositionError) => {
    setLocating(false);
    setErr(t(e.code === e.PERMISSION_DENIED ? 'ask.geo.denied' : 'ask.geo.error'));
  });
  // The device's location service is outside React: asked while `locating`, and an answer that arrives after
  // the card is gone (or after a newer request) is dropped.
  useEffect(() => {
    if (!locating) return;
    let current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => current && onFix(pos),
      (e) => current && onNoFix(e),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
    return () => {
      current = false;
    };
  }, [locating]);

  function shareLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return setErr(t('ask.geo.unsupported'));
    if (answering || locating) return;
    setErr(null);
    setLocating(true);
  }

  return (
    <WidgetShell icon={MapPin} tone="maple" title={recent ? t('head.find.recent', { place: recent }) : t(`head.find.${data.need}`)} subtitle={t('sub.ask')} sources={finderSources(data, lang)} aurora={false} className="@container">
      <form onSubmit={submit} className="px-5 pb-1 sm:px-6" noValidate>
        {recent ? (
          <Button type="button" variant="secondary" size="md" icon={History} disabled={answering || locating} loading={answering && via === 'recent'} onClick={() => go(recent, 'recent')} className="mb-4 max-sm:w-full">
            {t('ask.recent', { place: recent })}
          </Button>
        ) : null}
        <Field label={t('ask.label')} hint={t('ask.hint')} error={err ?? undefined} className="w-full">
          {(p) => (
            <Input
              {...p}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              // Autofill may put a whole postal code here: on leaving the box it shows what will be sent (3 characters).
              onBlur={() => setValue((v) => fsaOf(v) ?? v)}
              placeholder={t('ask.placeholder')}
              autoComplete="postal-code"
              enterKeyHint="search"
              maxLength={60}
            />
          )}
        </Field>
        <div className="mt-3 grid gap-2.5 sm:flex sm:flex-wrap">
          <Button type="submit" variant="primary" size="md" icon={Search} disabled={answering || locating} loading={answering && via === 'form'}>
            {t('ask.go')}
          </Button>
          <Button type="button" variant="secondary" size="md" icon={LocateFixed} disabled={answering} loading={locating || (answering && via === 'here')} onClick={shareLocation}>
            {locating ? t('ask.geo.busy') : t('ask.geo')}
          </Button>
        </div>
        <p className="m-0 mt-4 text-[13.5px] text-ink-2">
          {t('ask.official')} <OfficialLink href={(passportish ? URLS.finderPassport : URLS.finder)[lang]} />
        </p>
      </form>
    </WidgetShell>
  );
}

/** "Official office finder ↗": the full official list, one tap away. */
export function OfficialLink({ href }: { href: string }) {
  const t = useMessages(messages);
  return <ExternalLink href={href}>{t('handoff.finder')}</ExternalLink>;
}
