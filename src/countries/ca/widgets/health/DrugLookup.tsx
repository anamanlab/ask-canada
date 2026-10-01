'use client';
/**
 * Drug Product Database lookup (renders `healthDrugLookup`): is it authorized and sold in Canada, its DIN
 * (copyable), active ingredients, form, route, prescription status and the official product page.
 */
import { useRef, useState, type Ref } from 'react';
import { Check, CircleAlert, Copy, Leaf, Pill, Search, SearchX, ShieldAlert, Stethoscope, WifiOff } from 'lucide-react';
import { Badge, EmptyState, ExternalLink, IconButton, Notice, Tooltip, WidgetError, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { OFFICIAL } from './facts';
import { companyCase, drugsIn, plainStatus, sentenceCase, strengthLabel, titleCase, type DrugOutput, type DrugProduct } from './drugs';
import { CARD, DrugSkeleton, MORE_ROW, MORE_TEXT, SHOWN } from './DrugSkeleton';
import messages from './messages';
import { LiveBadge, useCopied, useLang, VerdictHero } from './shared';

export function DrugLookup({ part }: WidgetProps<{ query: string }, DrugOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('drugs.error.title')} message={t('drugs.error.body')} fallback={{ href: OFFICIAL.dpd[lang], label: t('drugs.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <DrugSkeleton cards={/^\s*\d{8}\s*$/.test(part.input?.query ?? '') ? 1 : SHOWN} />;
  }
  return <Lookup data={drugsIn(part.output, lang)} />;
}

function Lookup({ data }: { data: DrugOutput }) {
  const t = useMessages(messages);
  const [all, setAll] = useState(false);
  // "Show 2 more" disappears once used: focus moves to the first card it revealed, not back to the page.
  const focusNew = useRef(false);
  const showAll = () => {
    focusNew.current = true;
    setAll(true);
  };
  const revealed = (el: HTMLLIElement | null) => {
    if (!el || !focusNew.current) return;
    focusNew.current = false;
    el.focus();
  };
  const products = all ? data.products : data.products.slice(0, SHOWN);
  const hidden = data.products.length - products.length;
  const found = data.products.length > 0;
  const sold = data.marketed > 0 || data.products.some((p) => p.status === 'marketed');
  const q = data.kind === 'din' ? data.query : titleCase(data.query.toUpperCase());
  // "Check recalls" asks about the brand family ("Advil"), never one product's full name ("Advil Caplets"): the
  // Recalls site searches several words as an exact phrase, and notices name the brand.
  const family = (p: DrugProduct) => (data.kind === 'name' && q.length >= 3 ? q : (titleCase(p.brand).split(/\s+/)[0] ?? titleCase(p.brand)));
  return (
    <WidgetShell
      icon={Pill}
      tone="glacier"
      title={t('drugs.title')}
      subtitle={!data.query ? t('drugs.subtitle') : data.kind === 'din' ? t('drugs.subtitle.din', { din: data.query }) : t('drugs.subtitle.name', { query: q })}
      badge={<LiveBadge live={data.live} at={data.fetchedAt} />}
      sources={data.sources}
      handoff={{ href: data.dpdUrl, label: t('drugs.handoff'), note: t('drugs.handoffNote') }}
      className="@container"
    >
      {!data.live ? (
        <div className="px-5 sm:px-6">
          <Notice tone="warn" icon={WifiOff} title={t('drugs.offline.title')}>
            {t('drugs.offline.body')}
          </Notice>
        </div>
      ) : !data.query ? (
        // The question named no drug: say what to ask, instead of "no drug called “”".
        <div className="px-5 sm:px-6">
          <EmptyState icon={Search} title={t('drugs.ask.title')}>
            {t('drugs.ask.body')}
          </EmptyState>
        </div>
      ) : !found ? (
        <div className="px-5 sm:px-6">
          <EmptyState icon={SearchX} title={t('drugs.empty.title', { query: q })}>
            {t('drugs.empty.body')}
          </EmptyState>
          <Notice tone="info" icon={Leaf} className="mt-3" title={t('drugs.nhp.title')}>
            {t('drugs.nhp.body')}{' '}
            <ExternalLink href={data.lnhpdUrl}>{t('drugs.nhp.link')}</ExternalLink>
          </Notice>
        </div>
      ) : (
        <>
          <VerdictHero live tone={sold ? 'ok' : 'caution'} icon={sold ? Check : CircleAlert} title={sold ? t('drugs.verdict.sold') : t('drugs.verdict.notSold')}>
            {data.kind === 'din'
              ? t('drugs.verdict.din', { din: data.query, brand: titleCase(data.products[0].brand) })
              : sold
                ? t('drugs.verdict.soldSub', { count: data.marketed, total: data.total, query: q })
                : t('drugs.verdict.notSoldSub', { total: data.total, query: q })}
          </VerdictHero>
          <ul className={cn('m-0 mt-4 grid list-none gap-2.5 px-5 sm:px-6', data.products.length > 1 && '@xl:grid-cols-2')}>
            {products.map((p, i) => (
              <ProductCard key={p.drugCode} p={p} recallsFor={family(p)} ref={i === SHOWN ? revealed : undefined} />
            ))}
          </ul>
          {/* One line for both ways to see more: the cards already fetched, then the whole list in the database. */}
          {data.total > products.length ? (
            <p className={cn(MORE_ROW, 'px-5 sm:px-6')}>
              <span className={MORE_TEXT}>{t('drugs.more', { shown: products.length, total: data.total })}</span>
              {hidden > 0 ? (
                <>
                  <MoreDot />
                  <button type="button" onClick={showAll} className={MORE}>
                    {t('drugs.showMore', { count: hidden })}
                  </button>
                </>
              ) : null}
              {data.total > data.products.length ? (
                <>
                  <MoreDot />
                  {/* Inline (its own 44px hit area): as a flex box, the link would drop the space before its last word. */}
                  <ExternalLink href={data.dpdUrl}>{t('drugs.moreLink', { total: data.total })}</ExternalLink>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      )}
      <div className="px-5 pt-4 sm:px-6">
        <Notice tone="info" icon={Stethoscope} title={t('drugs.advice.title')}>
          {t('drugs.advice.body')}{' '}
          <ExternalLink href={data.sideEffectUrl}>{t('drugs.advice.link')}</ExternalLink>
        </Notice>
      </div>
    </WidgetShell>
  );
}

/** Separates the items where they share one line (desktop); on a phone they sit apart by a gap instead. */
function MoreDot() {
  const t = useMessages(messages);
  return (
    <span aria-hidden className="hidden @xl:inline">
      {t('common.dot')}
    </span>
  );
}

const MORE =
  'inline-flex min-h-11 items-center font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

function ProductCard({ p, recallsFor, ref }: { p: DrugProduct; /** The brand the "Check recalls" question names. */ recallsFor: string; ref?: Ref<HTMLLIElement> }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const lang = useLang();
  const num = (n: number) => fmt.number(n, { maximumFractionDigits: 4 });
  const [copied, copy] = useCopied();
  const meta = [p.forms.join(', '), p.routes.join(', ')].filter(Boolean).join(t('common.sep'));
  const brand = titleCase(p.brand);
  return (
    <li ref={ref} tabIndex={-1} className={cn(CARD, 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-serif text-[20px] leading-tight tracking-[-.015em] text-ink [overflow-wrap:anywhere]">
            <bdi>{brand}</bdi>
          </p>
          {p.descriptor ? (
            <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-ink-3">
              <bdi>{sentenceCase(p.descriptor)}</bdi>
            </p>
          ) : null}
        </div>
        {p.access === 'rx' ? (
          <Badge tone="info">{t('drugs.access.rx')}</Badge>
        ) : p.access === 'otc' ? (
          <Badge tone="ok">{t('drugs.access.otc')}</Badge>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-3">{t('drugs.din')}</span>
        <bdi dir="ltr" className="select-all font-mono text-[14px] font-medium tracking-[.04em] text-ink">
          {p.din}
        </bdi>
        <IconButton size="md" icon={copied ? Check : Copy} label={t('drugs.copy', { din: p.din })} onClick={() => copy(p.din)} className="-my-2" />
        <span className="sr-only" aria-live="polite">
          {copied ? t('drugs.copied') : ''}
        </span>
      </div>

      {p.ingredients.length ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0" aria-label={t('drugs.ingredients')}>
          {p.ingredients.map((a) => {
            const strength = strengthLabel(a, lang, num);
            return (
              <li key={a.name} className="rounded-full bg-glacier-wash px-2.5 py-1 text-[12.5px] font-medium leading-snug text-ink">
                <bdi>{titleCase(a.name)}</bdi>
                {strength ? (
                  <span className="text-ink-2">
                    {' '}
                    <bdi dir="ltr" className="whitespace-nowrap">
                      {strength}
                    </bdi>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="m-0 mt-2.5 text-[13px] leading-snug text-ink-2">
        {/* Database wording (form, route, company): isolated, so a right-to-left page keeps it in order. */}
        <bdi>{[meta, companyCase(p.company)].filter(Boolean).join(t('common.sep'))}</bdi>
      </p>
      <StatusLine p={p} />

      <div className="mt-auto flex flex-wrap items-center gap-x-4 pt-2">
        <ExternalLink href={p.url} standalone className="text-[13.5px]">
          <span>{t('drugs.page')}</span>
        </ExternalLink>
        <button
          type="button"
          onClick={() => send(t('drugs.ask.recalls', { brand: recallsFor }))}
          className="inline-flex min-h-11 items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"
        >
          <ShieldAlert className="size-4" strokeWidth={1.8} aria-hidden />
          {t('drugs.checkRecalls')}
        </button>
      </div>
    </li>
  );
}

/**
 * "Sold in Canada since 2017" / "No longer sold in Canada (since 2017)". The database's own wording is a tooltip
 * on a real button (a focus stop with a role; the tooltip is its description), 44px tall without adding height.
 */
function StatusLine({ p }: { p: DrugProduct }) {
  const t = useMessages(messages);
  const kind = plainStatus(p);
  const year = (kind === 'marketed' ? p.since : p.statusDate)?.slice(0, 4);
  const text = year ? t(`drugs.st.${kind}.year`, { year }) : t(`drugs.st.${kind}`);
  const tone = kind === 'safety' ? 'text-maple-ink' : 'text-ink-2';
  if (!p.statusLabel) return <p className={cn('m-0 mt-1 text-[13px]', tone)}>{text}</p>;
  return (
    <p className="m-0 mt-1 text-[13px]">
      <Tooltip content={t('drugs.st.official', { status: p.statusLabel })}>
        <button
          type="button"
          className={cn(
            '-my-3 inline-flex min-h-11 cursor-help items-center text-start underline decoration-hair-2 decoration-dotted underline-offset-[3px] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            tone,
          )}
        >
          {text}
        </button>
      </Tooltip>
    </p>
  );
}
