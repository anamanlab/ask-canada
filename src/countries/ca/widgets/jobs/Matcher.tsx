'use client';
/**
 * The career matcher. Skills from the conversation, or from a resume read in the browser, become chips;
 * switching one off re-ranks the occupations. Nothing here is uploaded or stored.
 *
 * The first view is the tool's own matches. The scoring code and the occupations catalog it needs
 * (./match.ts) are fetched only when the person switches a chip off or brings a resume.
 */
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, LockKeyhole, RotateCcw, ScanSearch } from 'lucide-react';
import { Badge, LiveRegion, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { ResumeDrop, ResumeRefine } from './DropZone';
import { MatchCard } from './MatchCard';
import { chatView, resumeView, type Engine } from './match-view';
import messages from './messages';
import { SubtitleWithBadge, useJobsLang } from './parts';
import type { ReadResult } from './resume-text';
import type { MatchOutput } from './types';

type Resume = { kind: 'file'; name: string; text: string } | { kind: 'paste'; text: string };
type Source = { kind: 'chat' } | Resume;
/** Why a resume couldn't be used: the file's own problem, or the scoring code didn't download. */
type Problem = Extract<ReadResult, { ok: false }>['reason'] | 'offline';

export function Matcher({ data }: { data: MatchOutput }) {
  const t = useMessages(messages);
  const reduce = useReducedMotion();
  const lang = useJobsLang();
  const { given } = data;
  const hasGiven = given.skills.length + given.titles.length > 0;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [src, setSrc] = useState<Source>({ kind: 'chat' });
  const [off, setOff] = useState<Set<string>>(new Set());
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pasting, setPasting] = useState(false);
  /** The latest resume being read: an earlier, slower read must not overwrite a newer one. */
  const readId = useRef(0);
  /**
   * Where the keyboard goes when a control disappears under it: back to the button that opened the paste
   * box ("Cancel"), to "Choose a file" ("Start over"), or on to the skills a resume produced.
   */
  const focusNext = useRef<'choose' | 'paste' | 'skills' | null>(null);
  const claim = (what: 'choose' | 'paste' | 'skills') => (el: HTMLElement | null) => {
    if (!el || focusNext.current !== what) return;
    focusNext.current = null;
    el.focus();
  };
  const entryRefs = { chooseRef: claim('choose'), pasteRef: claim('paste') };

  // A resume is only adopted once the engine is here, so this is "chat" exactly when `src` is.
  const resume = src.kind !== 'chat' && engine ? src : null;
  const fromChat = !resume;
  // Text we score: the resume (on device) or what the person told the assistant.
  const baseText = resume ? resume.text : [...given.titles, ...given.skills].join(' | ');
  const { chips: skills, matches } = resume && engine ? resumeView(engine, resume.text, data, off, lang) : chatView(engine, data, off, lang);
  const ready = !fromChat || hasGiven;
  /** Skills and matches are on screen (not the empty drop zone, not mid-read). */
  const showing = ready && !reading;

  const loadEngine = () =>
    import('./match').then((m) => {
      setEngine(m);
      return m;
    });
  /** Start the download as soon as a chip gets the pointer or focus, so the first toggle re-ranks at once. */
  const warm = () => {
    if (!engine) loadEngine().catch(() => undefined);
  };

  const adopt = (next: Source) => {
    readId.current++; // a resume still being read no longer applies
    setReading(false);
    setOff(new Set());
    setSrc(next);
    setPasting(false);
    // Any source that worked (paste, a new file, back to the conversation) retires the last warning.
    setProblem(null);
  };

  /** The scoring code, for a resume that is ready to score (false when it couldn't be downloaded). */
  const engineReady = () => loadEngine().then(() => true, () => false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const id = ++readId.current;
    setProblem(null);
    setReading(true);
    // The PDF / Word reader is only downloaded when someone actually brings a file.
    const reading: Promise<ReadResult> = import('./resume-text').then(
      (m) => m.readResumeFile(file),
      () => ({ ok: false, reason: 'unreadable' }),
    );
    const [res, loaded] = await Promise.all([reading, engineReady()]);
    if (id !== readId.current) return;
    setReading(false);
    if (!res.ok || !loaded) {
      const reason = res.ok ? 'offline' : res.reason;
      setProblem(reason);
      if (reason === 'unreadable') setPasting(true);
      return;
    }
    focusNext.current = 'skills';
    adopt({ kind: 'file', name: file.name, text: res.text });
  }

  async function onPaste(text: string) {
    const id = ++readId.current;
    setProblem(null);
    const loaded = await engineReady();
    if (id !== readId.current) return;
    if (!loaded) return setProblem('offline');
    focusNext.current = 'skills';
    adopt({ kind: 'paste', text });
  }

  const closePaste = (open: boolean) => {
    if (!open) focusNext.current = 'paste';
    setPasting(open);
  };
  const startOver = () => {
    focusNext.current = 'choose';
    adopt({ kind: 'chat' });
  };

  const deviceBadge = <Badge icon={LockKeyhole} mono>{t('badge.device')}</Badge>;

  const toggle = (key: string) => {
    warm();
    setOff((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };

  return (
    <WidgetShell
      icon={ScanSearch}
      tone="maple"
      title={t('match.title')}
      subtitle={<SubtitleWithBadge badge={deviceBadge}>{resume?.kind === 'file' ? t('match.subtitleFile', { name: resume.name }) : t('match.subtitle')}</SubtitleWithBadge>}
      badge={deviceBadge}
      sources={data.sources}
      handoff={{ href: data.links.resumeBuilder, label: t('match.handoff'), note: t('match.handoffNote') }}
      footnote={t('match.footnote')}
      className="@container"
    >
      <WidgetSection
        className="pt-0"
        title={showing ? (fromChat ? t('match.youSaid') : t('match.weNoticed')) : undefined}
        aside={
          showing && !fromChat ? (
            <button
              type="button"
              onClick={startOver}
              className="-my-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium text-ink-2 hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t('match.clearFile')}
            </button>
          ) : undefined
        }
      >
        {showing ? (
          <>
            {skills.length ? (
              // Keyed by source: a resume's skills are a new list, and it takes the focus the paste box or file button had.
              <ul key={fromChat ? 'chat' : 'resume'} ref={claim('skills')} tabIndex={-1} className="m-0 flex list-none flex-wrap gap-1.5 rounded-field p-0 outline-none" aria-label={t('match.skillsAria')} onPointerEnter={warm} onFocus={warm}>
                {skills.map((s) => {
                  const on = !off.has(s.key);
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(s.key)}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-chip border px-3.5 text-[13.5px] transition-colors',
                          // On: filled, with a check mark. Off: an outline, still easy to read and to switch back on.
                          on && s.known ? 'border-maple/25 bg-maple-wash font-medium text-ink' : on ? 'border-hair-2 bg-card text-ink-2' : 'border-dashed border-hair-2 bg-transparent text-ink-2',
                        )}
                        title={s.known ? undefined : t('match.unknownSkill')}
                      >
                        {on ? <Check className={cn('-ms-0.5 size-3.5 shrink-0', s.known ? 'text-maple' : 'text-ink-3')} strokeWidth={2.4} aria-hidden /> : null}
                        {s.label}
                        {s.years ? (
                          <span className="font-normal text-ink-2">
                            · <bdi>{t('match.years', { count: s.years })}</bdi>
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-[14px] text-ink-3">{t('match.noSkills')}</p>
            )}
          </>
        ) : null}

        {problem ? (
          <Notice tone="warn" className="mb-2 mt-3" title={t(`match.problem.${problem}`)} live>
            {problem === 'unreadable' ? t('match.problem.unreadableBody') : problem === 'offline' ? t('match.problem.offlineBody') : t('match.problem.formats')}
          </Notice>
        ) : null}

        {!ready || pasting || reading ? <ResumeDrop reading={reading} pasting={pasting} onPasting={closePaste} onFile={onFile} onPaste={onPaste} {...entryRefs} /> : null}

      </WidgetSection>

      {showing ? (
        <WidgetSection title={t('match.results')}>
          {matches.length ? <p className="m-0 -mt-1 mb-3 text-[13px] leading-snug text-ink-2">{t('match.scoreLegend')}</p> : null}
          <LiveRegion delay={400} text={matches.length ? t('match.srTop', { title: matches[0].title, score: matches[0].score }) : t('match.none')} />
          {matches.length ? (
            <ol className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2.5 p-0">
              <AnimatePresence initial={false} mode="popLayout">
                {matches.map((m, i) => (
                  <motion.li
                    key={m.key}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                  >
                    <MatchCard m={m} rank={i + 1} text={baseText} chips={skills} lang={lang} province={data.province} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          ) : (
            <p className="m-0 rounded-tile bg-paper-2 px-4 py-5 text-[14.5px] text-ink-2">{t('match.none')}</p>
          )}
          {fromChat && !pasting ? (
            <div className="mt-4">
              <ResumeRefine onFile={onFile} onPaste={() => setPasting(true)} {...entryRefs} />
            </div>
          ) : null}
        </WidgetSection>
      ) : null}
    </WidgetShell>
  );
}
