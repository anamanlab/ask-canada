'use client';
/**
 * The live border-waits board (BorderWaits renders it): summary tiles, lane switch (travellers /
 * commercial), province filter and one row per crossing (WaitRow), with CBSA's own notices.
 */
import { useId, useState } from 'react';
import { ChevronDown, Construction, Timer } from 'lucide-react';
import { Badge, LiveRegion, Notice, Segmented, Stat, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useNow, useRovingFocus } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import messages from './messages';
import { stampMs, stampText } from './select';
import { Feed, LiveSubtitle, ShowAll, nameIn, useShowAll, useSources, useUiLang } from './shared';
import type { BorderWaitsOutput, Crossing, Lang, Province } from './types';
import { WaitRow } from './WaitRow';
import { DATED_MS, STALE_MS, byWait, latestStamp, summarizeWaits, waitTone, type Lane } from './waits';

/** Province filter order: west to east, like the map. */
const ORDER: Province[] = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB'];
/** Rows shown before "Show all". */
const LIMIT = 8;
type Filter = Province | 'all';

/**
 * The rows in view and their summary: longest current wait first (the question is usually "where's the
 * line?"), the crossing asked about on top. The summary is the scripted answer's own (waits.ts), so the
 * headline and the tiles always agree.
 */
function viewOf(out: { crossings: Crossing[]; highlight: string | null }, lane: Lane, prov: Filter, now: number) {
  const order = byWait(lane, now);
  const rows = out.crossings
    .filter((c) => prov === 'all' || c.province === prov)
    .sort((a, b) => (a.id === out.highlight ? -1 : b.id === out.highlight ? 1 : order(a, b)));
  return { rows, sum: summarizeWaits(rows, lane, now) };
}

export function WaitsBoard({ out }: { out: BorderWaitsOutput }) {
  const t = useMessages(messages);
  // Everything follows the UI's language: links, sources, and CBSA's own crossing names and notices (the tool returns both).
  const L = useUiLang();
  const cited = useSources(out);
  // The tool's own read time until the reader's clock takes over (0: an answer saved before `asOf` existed).
  const now = useNow((out.live && out.asOf) || 0, { tickMs: 30_000, pinned: out.live && out.pinned });
  const [lane, setLane] = useState<Lane>('travellers');
  const [prov, setProv] = useState<Filter>(out.province ?? 'all');
  // What a screen reader hears after a lane or province change: set by those handlers only, never by the clock.
  const [said, setSaid] = useState('');
  const more = useShowAll<HTMLLIElement>(LIMIT);

  if (!out.live) {
    return (
      <WidgetShell
        icon={Timer}
        tone="glacier"
        title={t('waits.title')}
        subtitle={t('waits.subtitle')}
        sources={cited}
        handoff={{ href: URLS.waits[L], label: t('waits.handoff'), note: t('waits.handoffNote') }}
      >
        <div className="px-5 sm:px-6">
          <Notice tone="warn" title={t('waits.offline.title')} live>
            {t('waits.offline.body')}
          </Notice>
        </div>
      </WidgetShell>
    );
  }

  const chips: Filter[] = ['all', ...ORDER.filter((p) => out.crossings.some((c) => c.province === p))];
  const { rows, sum } = viewOf(out, lane, prov, now);
  const choose = (nextLane: Lane, nextProv: Filter) => {
    setLane(nextLane);
    setProv(nextProv);
    const next = viewOf(out, nextLane, nextProv, now).sum;
    const where = { lane: t(`waits.lane.${nextLane}`), place: nextProv === 'all' ? t('waits.allProv') : t(`waits.provName.${nextProv}`) };
    setSaid(
      next.max == null
        ? t('waits.say.none', where)
        : next.max === 0
          ? t('waits.say.clear', { ...where, total: next.total })
          : t('waits.say.some', { ...where, minutes: next.max, name: nameIn(next.top[0], L), clear: next.clear, total: next.total }),
    );
  };

  // A short name stays on one line, never broken at its hyphen ("Abbotsford-Huntingdon"); a longer one
  // (« Pont International Gordie-Howe ») wraps in full. "+2 more" can wrap below it.
  const topName = sum.top[0] ? nameIn(sum.top[0], L) : '';
  // The tile takes the row's own colour ladder (waits.ts): amber from 15 min, red only from 45.
  const topTone = waitTone(sum.max);
  const longestNote =
    sum.max == null ? (
      t('waits.stat.noCurrent')
    ) : sum.max > 0 ? (
      <>
        <bdi className={cn(topName.length <= 22 && 'whitespace-nowrap')}>{topName}</bdi>
        {sum.top.length > 1 ? <> <bdi className="whitespace-nowrap">{t('waits.stat.more', { count: sum.top.length - 1 })}</bdi></> : null}
      </>
    ) : (
      t('waits.stat.allClear')
    );
  const latest = latestStamp(rows);
  // Rows carry their own time zones (PDT beside ADT), so the latest estimate also says how long ago it was.
  const sinceMs = now && latest ? Math.max(0, now - stampMs(latest)) : null;
  const age = sinceMs == null ? null : Math.floor(sinceMs / 60_000);
  const ago = age == null ? null : age < 120 ? t('waits.ago', { count: age }) : t('waits.agoHours', { count: Math.floor(age / 60) });
  // When even the newest estimate is old, the card says when CBSA last reported instead of calling itself live.
  const old = sinceMs != null && sinceMs > STALE_MS;
  const latestTime = latest ? stampText(latest, L, { date: sinceMs != null && sinceMs > DATED_MS }) : '';
  // The source line drops its own "Live" mark with the badge.
  const sources = old ? cited.map((s) => ({ ...s, live: false })) : cited;
  const badge = old ? <Badge tone="neutral">{t('waits.lastReported', { time: latestTime })}</Badge> : <Badge tone="live">{t('badge.live')}</Badge>;
  const scaleMax = Math.max(30, sum.max ?? 0);
  // A notice naming no crossing applies to all of them.
  const notices = out.notices.filter((n) => !n.crossing || rows.some((r) => r.id === n.crossing));

  return (
    <WidgetShell
      icon={Timer}
      tone="glacier"
      title={t('waits.title')}
      subtitle={<LiveSubtitle short={t('waits.subtitleShort')} full={t('waits.subtitle')} badge={badge} />}
      badge={badge}
      sources={sources}
      handoff={{ href: URLS.waits[L], label: t('waits.handoff'), note: t('waits.handoffNote') }}
      footnote={t('waits.footnote')}
      className="@container"
    >
      {/* On phones the "Longest wait" tile gets the wider column: its note is a crossing name that stays on one line. */}
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2.5 px-5 sm:px-6 @xl:grid-cols-3">
        <Stat
          label={t('waits.stat.longest')}
          value={<bdi className={cn(topTone === 'mid' && 'text-amber')}>{sum.max == null ? '—' : sum.max > 0 ? t('waits.min', { count: sum.max }) : t('waits.stat.none')}</bdi>}
          note={longestNote}
          size="sm"
          tone={topTone === 'long' ? 'danger' : undefined}
        />
        <Stat
          label={t('waits.stat.clear')}
          value={<bdi>{sum.total ? t('waits.ofTotal', { n: sum.clear, total: sum.total }) : '—'}</bdi>}
          note={sum.total && sum.total < sum.lane ? <bdi>{t('waits.stat.clearNoteOf', { total: sum.total, all: sum.lane })}</bdi> : t('waits.stat.clearNote')}
          size="sm"
          tone={sum.total > 0 && sum.clear === sum.total ? 'ok' : undefined}
        />
        <Stat
          label={t('waits.stat.updated')}
          value={<bdi className={cn(old && 'text-amber')}>{latest ? stampText(latest, L) : '—'}</bdi>}
          note={ago ? <bdi>{t('waits.stat.updatedAgo', { ago })}</bdi> : t('waits.stat.updatedNote')}
          size="sm"
          className="hidden @xl:block"
        />
      </div>
      {/* Why the tiles count fewer crossings than the list holds, right where the totals are. */}
      {(sum.stale || sum.na) && sum.total ? (
        <p className="m-0 mt-2.5 px-5 text-[13px] leading-snug text-ink-3 sm:px-6">
          {/* Each sentence starts with a number: isolated, so it stays in front in a right-to-left page. */}
          {sum.stale ? <bdi>{t('waits.staleLine', { count: sum.stale })}</bdi> : null}
          {sum.stale && sum.na ? ' ' : null}
          {sum.na ? <bdi>{t(`waits.naLine.${lane}`, { count: sum.na })}</bdi> : null}
        </p>
      ) : null}
      <LiveRegion text={said} delay={700} />

      <WidgetSection title={t(rows[0]?.id === out.highlight ? 'waits.listTitlePinned' : 'waits.listTitle')}>
        <div className="flex flex-col gap-2.5">
          <Segmented
            label={t('waits.lane')}
            value={lane}
            onChange={(next) => choose(next, prov)}
            className="@xl:max-w-[340px]"
            options={[
              { value: 'travellers', label: t('waits.lane.travellers') },
              { value: 'commercial', label: t('waits.lane.commercial') },
            ]}
          />
          <ProvinceChips chips={chips} value={prov} onChange={(p) => choose(lane, p)} />
        </div>

        {latest ? (
          <p className={cn('m-0 mt-2.5 text-[13px] @xl:hidden', old ? 'text-amber' : 'text-ink-3')}>
            <bdi>{ago ? t('waits.latestLineAgo', { time: latestTime, ago }) : t('waits.latestLine', { time: latestTime })}</bdi>
          </p>
        ) : null}

        {notices.map((n) => (
          <CbsaNotice key={n.id} {...(n.text?.[L] ?? n)} lang={n.text ? L : out.lang} />
        ))}

        <ul className="m-0 mt-3 grid list-none gap-0 divide-y divide-hair p-0" aria-label={t('waits.listLabel', { lane })}>
          {(more.open ? rows : rows.slice(0, LIMIT)).map((c, i) => (
            <WaitRow key={c.id} c={c} lane={lane} max={scaleMax} now={now} highlight={c.id === out.highlight} {...more.revealed(i)} />
          ))}
        </ul>
        {rows.length > LIMIT ? <ShowAll open={more.open} onToggle={more.toggle} more={t('help.showAll', { count: rows.length })} fewer={t('help.showFewer')} /> : null}
      </WidgetSection>
    </WidgetShell>
  );
}

/**
 * The province filter: one choice among chips (a radio group, arrow keys move the choice). The chips are an
 * even grid: two full rows on phones (4 + 4), one row in a wide column, never a chip alone. Each chip's
 * accessible name starts with what it shows ("QC, Quebec"), so "click QC" works with voice control.
 */
function ProvinceChips({ chips, value, onChange }: { chips: Filter[]; value: Filter; onChange: (p: Filter) => void }) {
  const t = useMessages(messages);
  const roving = useRovingFocus({ count: chips.length, index: chips.indexOf(value), onMove: (i) => onChange(chips[i]), orientation: 'both' });
  return (
    <div
      role="radiogroup"
      aria-label={t('waits.province')}
      className="grid grid-cols-[repeat(var(--half),minmax(0,1fr))] gap-1.5 @xl:grid-cols-[repeat(var(--all),minmax(0,1fr))] @xl:max-w-[520px]"
      style={{ '--half': chips.length > 4 ? Math.ceil(chips.length / 2) : chips.length, '--all': chips.length } as React.CSSProperties}
    >
      {chips.map((p, i) => (
        <button
          key={p}
          {...roving.itemProps(i)}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={cn(
            'min-h-11 w-full min-w-0 rounded-full border px-2 font-mono text-[12.5px] font-medium tracking-[.04em] transition-colors',
            value === p ? 'border-ink bg-ink text-paper' : 'border-hair bg-card text-ink-2 hover:border-hair-2 hover:text-ink',
          )}
        >
          {p === 'all' ? (
            t('waits.all')
          ) : (
            <>
              {t(`waits.prov.${p}`)}
              <span className="sr-only">, {t(`waits.provName.${p}`)}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * A CBSA page notice, word for word: the headline, with CBSA's longer explanation behind a toggle that stays in place.
 * The toggle is local on purpose: Notice renders its body inside a <span>, and the shared Disclosure is a
 * <section> with a heading and a full-width 56px row, which is neither valid there nor the right weight for
 * one "Details" link in a banner.
 */
function CbsaNotice({ title, body, lang }: { title: string; body: string; lang: Lang }) {
  const t = useMessages(messages);
  const id = useId();
  const [open, setOpen] = useState(false);
  const long = body.length > 140;
  return (
    // CBSA's headlines have no final period; add one so a following sentence or link doesn't run on.
    <Notice tone="warn" icon={Construction} className="mt-3" title={<Feed lang={lang}>{/[.!?:]$/.test(title) ? title : `${title}.`}</Feed>}>
      {!body ? null : !long ? (
        <Feed lang={lang}>{body}</Feed>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={id}
            className="-my-2 flex min-h-11 items-center gap-1 font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
          >
            {t('waits.notice.more')}
            <ChevronDown className={cn('size-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
          </button>
          <span id={id} hidden={!open} className={cn(open && 'mt-1.5 block')}>
            <Feed lang={lang}>{body}</Feed>
          </span>
        </>
      )}
    </Notice>
  );
}
