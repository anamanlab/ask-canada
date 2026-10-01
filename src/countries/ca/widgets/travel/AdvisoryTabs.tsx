'use client';
/**
 * The three tabs under an advisory: entry requirements (passport, visas), emergency help (local numbers,
 * the 24/7 centre in Ottawa, Canadian offices) and the before-you-go checklist saved on this device.
 */
import { BookUser, LifeBuoy } from 'lucide-react';
import { Checklist, ExternalLink, Notice, useChecklist } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { EWRC, URLS } from './data';
import { LocalNumbers, OfficeList, PhoneLink } from './HelpParts';
import messages from './messages';
import { capFirst, emergencyText } from './select';
import { Feed, useUiLang } from './shared';
import type { CountryAdvisory, Lang, RiskLevel } from './types';

export function Entry({ c, feed }: { c: CountryAdvisory; feed: Lang }) {
  const t = useMessages(messages);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)]">
      {/* What the official page says before its passport rules (an outbreak's entry restrictions, ETIAS): first here too. */}
      {c.entry.notices?.map((n, i) => (
        <Notice key={i} tone="info" className="mb-3" title={n.title ? <Feed lang={feed}>{n.title}</Feed> : undefined}>
          {n.body.map((p, j) => (
            <span key={j} className={cn('block text-start', (j > 0 || n.title) && 'mt-1.5')}>
              <Feed lang={feed}>{p}</Feed>
            </span>
          ))}
          {n.more ? (
            <span className="mt-1.5 block">
              <ExternalLink href={c.url} className="font-medium text-ink">
                {t('entry.noticeMore')}
              </ExternalLink>
            </span>
          ) : null}
        </Notice>
      ))}
      <div className="flex gap-3 rounded-[16px] bg-paper-2 px-4 py-3.5">
        <BookUser className="mt-0.5 size-5 shrink-0 text-glacier" aria-hidden strokeWidth={1.8} />
        <div className="min-w-0 flex-1 text-start">
          <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('entry.passport')}</p>
          <p className="m-0 mt-1 text-[15px] leading-[1.5] text-ink">{c.entry.passport ? <Feed lang={feed}>{c.entry.passport}</Feed> : t('entry.passportUnknown')}</p>
          <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-3">{t('entry.airline')}</p>
        </div>
      </div>
      {c.entry.visas.length ? (
        <dl className="m-0 mt-3 grid gap-0 divide-y divide-hair rounded-[16px] border border-hair">
          {c.entry.visas.map((v) => {
            const notRequired = /^(not required|non exig)/i.test(v.value);
            return (
              <div key={v.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-[14.5px] font-medium text-ink">
                  <Feed lang={feed}>{v.label}</Feed>
                </dt>
                <dd className={cn('m-0 max-w-full text-[14px] leading-snug @xl:max-w-[60%] @xl:text-end', notRequired ? 'text-pine' : 'text-ink-2')}>
                  <Feed lang={feed}>{capFirst(v.value)}</Feed>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
      <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">
        {t('entry.more')}{' '}
        <ExternalLink href={c.url} className="text-ink-2 hover:text-ink">
          {t('entry.moreLink', { country: c.name })}
        </ExternalLink>
      </p>
    </div>
  );
}

export function Help({ c, feed }: { c: CountryAdvisory; feed: Lang }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const row = 'flex min-w-0 flex-wrap items-center gap-x-2';
  const link = 'inline-flex min-h-11 items-center font-medium text-ink underline decoration-hair-2 underline-offset-[3px]';
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="min-w-0">
        <h5 className="m-0 mb-2 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('help.local', { country: c.name })}</h5>
        <LocalNumbers emergency={c.help.emergency} iso={c.iso} lang={feed} />
      </div>
      <div className="min-w-0 rounded-[16px] bg-paper-2 px-4 py-3.5">
        <h5 className="m-0 flex items-center gap-2 text-[15px] font-semibold text-ink">
          <LifeBuoy className="size-4 shrink-0 text-maple" aria-hidden strokeWidth={2} />
          {t('help.ewrc')}
        </h5>
        <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-3">{t('help.ewrcSub')}</p>
        <ul className="m-0 mt-1.5 grid list-none p-0 text-[14.5px] text-ink-2">
          {c.help.tollFree ? (
            <li className={row}>
              <span>{t('help.tollFree', { country: c.name })}</span>
              <PhoneLink number={c.help.tollFree} iso={c.iso} local />
            </li>
          ) : null}
          <li className={row}>
            <span>{t('help.collect')}</span>
            <a href={EWRC.collect.href} className={link}>
              <bdi dir="ltr">{EWRC.collect.label}</bdi>
            </a>
          </li>
          <li className={row}>
            <span>{t('help.email')}</span>
            <a href={EWRC.email.href} className={cn(link, 'min-w-0 [overflow-wrap:anywhere]')}>
              {EWRC.email.label}
            </a>
          </li>
        </ul>
        {/* The label is its own element: a standalone link is a flex row, where a bare string loses the space before its last word. */}
        <ExternalLink href={URLS.emergency[L]} standalone className="text-[13.5px] text-ink-2 hover:text-ink">
          <span>{t('help.allWays')}</span>
        </ExternalLink>
      </div>
      <div className="min-w-0">
        <h5 className="m-0 mb-2 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('help.offices', { count: c.help.offices.length })}</h5>
        <OfficeList offices={c.help.offices} iso={c.iso} lang={feed} />
      </div>
    </div>
  );
}

export function Prepare({ c, worst, feed }: { c: CountryAdvisory; worst: RiskLevel; feed: Lang }) {
  const t = useMessages(messages);
  const emergency = emergencyText(c.help.emergency);
  // Non-breaking hyphens and spaces: a number to save shouldn't wrap mid-number ("001-" / "800-156-…").
  const ewrc = (c.help.tollFree ?? EWRC.collect.label).replace(/-/g, '‑').replace(/ /g, ' ');
  const items = [
    { id: 'roca', title: t('prep.roca.title'), detail: t('prep.roca.detail') },
    { id: 'passport', title: t('prep.passport.title'), detail: c.entry.passport ? <Feed lang={feed}>{c.entry.passport}</Feed> : t('entry.passportUnknown') },
    { id: 'copies', title: t('prep.copies.title'), detail: t('prep.copies.detail') },
    { id: 'insurance', title: t('prep.insurance.title'), detail: worst >= 3 ? t('prep.insurance.advisory') : t('prep.insurance.detail') },
    {
      id: 'numbers',
      title: t('prep.numbers.title'),
      detail: emergency ? t('prep.numbers.detail', { local: emergency, ewrc }) : t('prep.numbers.detailNoLocal', { ewrc }),
    },
    { id: 'health', title: t('prep.health.title'), detail: t('prep.health.detail') },
  ];
  const label = t('prep.label', { country: c.name });
  // One saved list per destination; the count is read during render, so it never lags a tick behind.
  const list = useChecklist(`travel:prep:${c.iso}`, label, items.length);
  const done = items.filter((it) => list.value.includes(it.id)).length;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="m-0 text-[13.5px] text-ink-3">{t('prep.sub', { country: c.name })}</p>
        <span className="shrink-0 font-mono text-[12px] text-pine" aria-live="polite">
          <bdi>{t('prep.progress', { done, total: items.length })}</bdi>
        </span>
      </div>
      <Checklist label={label} items={items} value={list.value} onChange={list.onChange} />
      <p className="m-0 mt-1 text-[12.5px] text-ink-3">{t('prep.device')}</p>
    </div>
  );
}
