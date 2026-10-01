'use client';
/**
 * The days calculator's first run (a short form for the PR date and any time in Canada before it) and the
 * list of conditions the calculator doesn't check, shown under the form and under the result.
 */
import { useState, type FormEvent } from 'react';
import { Button, Disclosure, ExternalLink, Field, Toggle } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { URLS } from './data';
import { DateInput } from './DateInput';
import { isISO } from './presence';
import { useLang } from './shared';

export function Setup({ today, onDone }: { today: string; onDone: (prDate: string, tempStart: string | null) => void }) {
  const t = useMessages(messages);
  const [pr, setPr] = useState('');
  const [before, setBefore] = useState(false);
  const [temp, setTemp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!pr) return setError(t('presence.setup.required'));
    if (!isISO(pr) || pr > today) return setError(t('presence.setup.invalid'));
    onDone(pr, before && isISO(temp) && temp < pr ? temp : null);
  };
  return (
    <form onSubmit={submit} className="px-5 pt-2 sm:px-6" noValidate>
      <div className="rounded-card border border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_12%,transparent),color-mix(in_oklab,var(--glacier)_10%,transparent)_60%,transparent)] p-5">
        <h4 className="m-0 font-serif text-[24px] leading-[1.15] tracking-[-.02em] text-ink">{t('presence.setup.title')}</h4>
        <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{t('presence.setup.sub')}</p>
        <Field className="mt-4 @md:max-w-[320px]" label={t('presence.setup.pr')} error={error}>
          {(p) => <DateInput {...p} value={pr} max={today} onChange={(e) => (setPr(e.target.value), setError(null))} required />}
        </Field>
        {/* Everything that changes the count comes before the button, so nobody submits before seeing it. */}
        <Toggle className="mt-4" label={t('presence.setup.before')} checked={before} onChange={setBefore} />
        {/* Under the switch at full width, so the label beside it stays short and the hint doesn't wrap in a narrow column. */}
        <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">{t('presence.setup.beforeHint')}</p>
        {before ? (
          <Field className="mt-3 @md:max-w-[320px]" label={t('presence.setup.tempStart')}>
            {(p) => <DateInput {...p} value={temp} max={pr || today} onChange={(e) => setTemp(e.target.value)} />}
          </Field>
        ) : null}
        <Button type="submit" variant="primary" size="md" className="mt-5 @max-md:w-full">
          {t('presence.setup.go')}
        </Button>
      </div>
    </form>
  );
}

/** The conditions this calculator doesn't check, one tap away. */
export function AlsoNeeded() {
  const t = useMessages(messages);
  const lang = useLang();
  const keys = ['pr', 'taxes', 'language', 'prohibition'] as const;
  return (
    <Disclosure title={t('presence.also.title')} summary={t('presence.also.summary')}>
      <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2">
        {keys.map((k) => (
          <li key={k} className="flex gap-3 text-[14px] leading-snug text-ink-2">
            {/* A neutral marker: these are conditions to check, not things this calculator has verified. */}
            <span className="mt-[6px] size-2 shrink-0 rounded-full border-[1.5px] border-ink-3" aria-hidden />
            <span>{t(`presence.also.${k}`)}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 pb-3 text-[13.5px]">
        <ExternalLink href={URLS.who[lang]}>{t('presence.also.link')}</ExternalLink>
      </p>
    </Disclosure>
  );
}
