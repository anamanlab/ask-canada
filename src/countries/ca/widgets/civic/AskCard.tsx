'use client';
/** The postal code form of civicFindMp: nothing given yet, an invalid code, a code with no riding, or the lookup down. */
import { useId, useState, type FormEvent } from 'react';
import { Landmark, Search } from 'lucide-react';
import { Button, Field, Input, Notice, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import messages from './messages';
import { isolate } from './shared';
import { normalizePostal } from './select';
import type { FindMpOutput } from './types';

/** Uppercases as the person types and, once six characters make a valid code, sets it as "K1A 0B1". */
const formatPostal = (v: string) => {
  const up = v.toUpperCase();
  return normalizePostal(up.replace(/[\s-]/g, ''))?.display ?? up;
};

export function AskCard({ data }: { data: FindMpOutput }) {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const { status, lang } = data;
  const code = data.postalCode ?? '';
  const [value, setValue] = useState(status === 'ask' ? '' : formatPostal(code));
  const [error, setError] = useState<string | null>(null);
  const noticeId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const pc = normalizePostal(value);
    if (!pc) return setError(t('mp.ask.error'));
    setError(null);
    send(t('mp.ask.message', { code: pc.display }));
  };

  // The lookup said this code is wrong: flag the field itself (border + aria-invalid) and point it at the
  // explanation below, until the person edits it.
  const flagged = (status === 'invalid' || status === 'not-found') && !error && value.replace(/\s/g, '') === code.toUpperCase().replace(/\s/g, '');
  const handoff =
    status === 'unavailable'
      ? { href: URLS.membersSearch[lang], label: t('mp.handoff.search'), note: isolate(t('mp.handoff.searchNote')) }
      : status === 'not-found'
        ? { href: URLS.findRiding[lang], label: t('mp.notFound.link') }
        : undefined;

  return (
    <WidgetShell icon={Landmark} tone="maple" title={t('mp.title')} subtitle={t('mp.subtitle')} sources={data.sources} handoff={handoff} className="@container">
      <div className="px-5 sm:px-6">
        <div className="rounded-card border border-hair bg-[linear-gradient(135deg,var(--maple-wash),transparent_60%),linear-gradient(315deg,var(--glacier-wash),transparent_55%)] px-5 py-5">
          <p className="m-0 font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{t('mp.ask.title')}</p>
          <p className="m-0 mt-1.5 max-w-[52ch] text-[15px] text-ink-2">{t('mp.ask.body')}</p>
          <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3 @xl:flex-row @xl:items-end">
            <Field label={t('mp.ask.label')} hint={t('mp.ask.hint')} error={error} className="@xl:w-[240px]">
              {(p) => (
                <Input
                  {...p}
                  aria-invalid={p['aria-invalid'] || flagged || undefined}
                  aria-describedby={[p['aria-describedby'], flagged ? noticeId : null].filter(Boolean).join(' ') || undefined}
                  value={value}
                  onChange={(e) => setValue(formatPostal(e.target.value))}
                  onBlur={() => setValue((v) => formatPostal(v.trim()))}
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={7}
                  className="font-mono text-[17px] tracking-[.08em]"
                />
              )}
            </Field>
            <Button type="submit" variant="accent" size="lg" icon={Search}>
              {t('mp.ask.button')}
            </Button>
          </form>
          <p className="m-0 mt-3 text-[12.5px] text-ink-2">{t('mp.ask.privacy')}</p>
        </div>
        <div id={noticeId}>
          {status === 'invalid' ? (
            <Notice tone="warn" className="mt-4" title={t('mp.invalid.title', { code })} live>
              {t('mp.invalid.body')}
            </Notice>
          ) : status === 'not-found' ? (
            <Notice tone="warn" className="mt-4" title={t('mp.notFound.title', { code })} live>
              {t('mp.notFound.body')}
            </Notice>
          ) : status === 'unavailable' ? (
            <Notice tone="info" className="mt-4" title={t('mp.unavailable.title')} live>
              {t('mp.unavailable.body')}
            </Notice>
          ) : null}
        </div>
      </div>
      {handoff ? null : <div className="h-5" />}
    </WidgetShell>
  );
}
