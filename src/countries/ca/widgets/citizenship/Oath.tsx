'use client';
/**
 * The oath of citizenship in English, French or both, sworn or affirmed, with a practice mode: the box
 * becomes a teleprompter that keeps the line being said in the middle, one line per tap or key press.
 */
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, Play, RotateCcw, X } from 'lucide-react';
import { Button, IconButton, Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { Mark } from '../../brand/Mark';
import { OATH_OPENING, type Lang } from './data';
import type { CeremonyOutput } from './steps';

type OathLang = Lang | 'both';

/** Ref callbacks with a stable identity. The teleprompter takes focus, in view with its controls, when a run starts. */
const enterPractice = (el: HTMLDivElement | null) => {
  el?.focus({ preventScroll: true });
  el?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
};
/** The "Practise" button takes focus back when the person stops. */
const focusOnMount = (el: HTMLButtonElement | null) => el?.focus();

function oathLines(data: CeremonyOutput, l: Lang, mode: 'swear' | 'affirm') {
  const lines = [...data.oath[l]];
  lines[0] = OATH_OPENING[l][mode];
  return lines;
}

export function Oath({ data, initial }: { data: CeremonyOutput; initial: Lang }) {
  const t = useMessages(messages);
  const titleId = useId();
  const [view, setView] = useState<OathLang>(initial);
  const [mode, setMode] = useState<'swear' | 'affirm'>('swear');
  const [line, setLine] = useState<number | null>(null);
  // Each run (start or restart) mounts a fresh teleprompter: scrolled to the top, focused, in view.
  const [run, setRun] = useState(0);
  // True after "Stop" or Escape: the "Practise" button that comes back takes focus.
  const [stopped, setStopped] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** The practice column's lines, by index: what the teleprompter centres. */
  const lineEls = useRef<(HTMLLIElement | null)[]>([]);
  const practiceLang: Lang = view === 'both' ? initial : view;
  const lines = oathLines(data, practiceLang, mode);
  const practising = line != null;
  const finished = practising && line >= lines.length;

  // Practising turns the box into a teleprompter: a fixed-height window that keeps the line being said in the
  // middle, so the line and the "Next line" button are on screen together, even on a small phone.
  const centre = (el: HTMLElement | null) => {
    const sc = scrollRef.current;
    if (!sc || !el) return;
    const top = el.offsetTop - (sc.clientHeight - el.offsetHeight) / 2;
    sc.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  /** Say line `n` (`lines.length` = finished: the closing message centres itself when it appears). */
  const go = (n: number) => {
    setLine(n);
    centre(lineEls.current[n] ?? null);
  };

  const start = () => {
    if (view === 'both') setView(initial);
    setLine(0);
    setRun((n) => n + 1);
  };
  const stop = () => {
    setLine(null);
    setStopped(true);
  };
  const advance = () => go(line == null ? 0 : Math.min(lines.length, line + 1));
  const back = () => go(line == null ? 0 : Math.max(0, line - 1));
  const onKey = (e: KeyboardEvent) => {
    if (!practising) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      advance();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      back();
    } else if (e.key === 'Escape') stop();
  };

  const column = (l: Lang) => {
    const ls = oathLines(data, l, mode);
    const active = practising && l === practiceLang;
    return (
      <ol lang={l} className="m-0 list-none p-0" aria-label={l === 'fr' ? t('ceremony.oath.fr') : t('ceremony.oath.en')}>
        {ls.map((text, i) => {
          const state = !active ? 'idle' : i < line! ? 'past' : i === line ? 'now' : 'next';
          return (
            <li
              key={i}
              ref={
                l === practiceLang
                  ? (el) => {
                      lineEls.current[i] = el;
                    }
                  : undefined
              }
              className={cn(
                // A hanging indent: when a line wraps on a narrow screen, the rest reads as the same verse line.
                'relative -mx-2 rounded-field py-[3px] ps-9 pe-3 -indent-3 font-serif leading-[1.35] tracking-[-.01em] [text-wrap:balance] transition-[color,opacity] duration-300 motion-reduce:transition-none',
                view === 'both' ? 'text-[17px]' : 'text-[18px] @md:text-[20px] @xl:text-[22px]',
                state === 'idle' && 'text-ink',
                state === 'past' && 'text-ink-2',
                state === 'now' && 'bg-maple-wash text-ink',
                state === 'next' && 'text-ink-3',
              )}
            >
              <span
                aria-hidden
                className={cn('absolute start-1 top-[7px] bottom-[7px] w-[3px] rounded-full transition-colors duration-300', state === 'now' ? 'bg-maple' : 'bg-transparent')}
              />
              {text}
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <div className="px-5 sm:px-6">
      <div className="flex flex-wrap items-stretch gap-2.5">
        <Segmented
          label={t('ceremony.oath.lang')}
          value={view}
          onChange={(v) => {
            setView(v);
            setLine(null);
            // Focus stays on the language switch.
            setStopped(false);
          }}
          options={(['en', 'fr', 'both'] as const).map((v) => ({
            value: v,
            label: <span className="whitespace-nowrap">{t(`ceremony.oath.${v}`)}</span>,
          }))}
          className="min-w-max flex-1"
        />
        <Segmented
          label={t('ceremony.oath.mode')}
          value={mode}
          onChange={setMode}
          options={(['swear', 'affirm'] as const).map((v) => ({
            value: v,
            label: <span className="whitespace-nowrap">{t(`ceremony.oath.${v}`)}</span>,
            sub: <span className="whitespace-nowrap">{t(`ceremony.oath.${v}Sub`)}</span>,
          }))}
          className="min-w-max flex-1"
        />
      </div>

      <div>
        <div
          key={run}
          ref={practising ? enterPractice : undefined}
          role="group"
          aria-labelledby={titleId}
          tabIndex={practising ? 0 : -1}
          onKeyDown={onKey}
          onClick={practising && !finished ? advance : undefined}
          className={cn(
            'relative mt-3 overflow-hidden rounded-card border border-hair bg-[linear-gradient(180deg,color-mix(in_oklab,var(--amber)_7%,var(--card)),var(--card))] px-4 pb-4 pt-6 shadow-sm outline-none focus-visible:shadow-[var(--focus)] @md:px-5 @md:pb-5',
            // Room for the chat's bars above, and for the controls under the box (they must be on screen with it).
            'scroll-mt-20 scroll-mb-48',
            practising && !finished && 'cursor-pointer',
          )}
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h4 id={titleId} className="m-0 flex items-center gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[.14em] text-ink-2">
              <Mark className="size-3.5 shrink-0 text-maple" />
              {t('ceremony.oath.title')}
            </h4>
            {/* Progress sits with the text it counts, so the controls below stay on one row on a phone. */}
            {practising && !finished ? (
              <span className="font-mono text-[11.5px] tabular-nums tracking-[.04em] text-ink-3" aria-hidden>
                {t('ceremony.oath.lineOf', { n: line + 1, total: lines.length })}
              </span>
            ) : null}
          </div>
          <div
            ref={scrollRef}
            className={cn(
              // Bleeds 8px each side so the highlighted line's rounded background and bar aren't clipped.
              'relative -mx-2 px-2',
              practising &&
                '-mb-2 max-h-[min(50svh,440px)] overflow-y-auto overscroll-contain py-5 [mask-image:linear-gradient(180deg,transparent,black_20px,black_calc(100%-28px),transparent)] [scrollbar-width:none]',
            )}
          >
            {view === 'both' ? (
              <div className="grid gap-5 @xl:grid-cols-2">
                {column('en')}
                {column('fr')}
              </div>
            ) : (
              column(view)
            )}
            {finished ? (
              <p ref={centre} className="m-0 mt-4 font-serif text-[19px] text-pine" role="status">
                {t('ceremony.oath.done')}
              </p>
            ) : null}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {practising && !finished ? `${t('ceremony.oath.lineOf', { n: line! + 1, total: lines.length })}: ${lines[line!]}` : ''}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!practising ? (
            <Button ref={stopped ? focusOnMount : undefined} icon={Play} variant="primary" onClick={start} className="@max-md:w-full">
              {t('ceremony.oath.practise')}
            </Button>
          ) : finished ? (
            <>
              <Button icon={RotateCcw} variant="primary" onClick={start}>
                {t('ceremony.oath.restart')}
              </Button>
              <Button icon={X} onClick={stop}>
                {t('ceremony.oath.stop')}
              </Button>
            </>
          ) : (
            <>
              <Button icon={ArrowDown} variant="primary" onClick={advance} className="@max-md:flex-1">
                {t('ceremony.oath.nextLine')}
              </Button>
              {/* On a phone, restart and stop are round icon buttons on the same row; labelled buttons from @md. */}
              <Button icon={RotateCcw} onClick={start} className="hidden @md:inline-flex">
                {t('ceremony.oath.restart')}
              </Button>
              <Button icon={X} onClick={stop} className="hidden @md:inline-flex">
                {t('ceremony.oath.stop')}
              </Button>
              <IconButton icon={RotateCcw} label={t('ceremony.oath.restart')} onClick={start} className="border border-hair-2 @md:hidden" />
              <IconButton icon={X} label={t('ceremony.oath.stop')} onClick={stop} className="border border-hair-2 @md:hidden" />
            </>
          )}
        </div>
      </div>
      <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-2">{t(mode === 'swear' ? 'ceremony.oath.tipSwear' : 'ceremony.oath.tip')}</p>
    </div>
  );
}
