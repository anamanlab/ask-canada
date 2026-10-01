'use client';
/**
 * One assistant turn: meta line, streamed markdown, widgets (tool parts), numbered sources,
 * message actions and "Ask next" follow-ups.
 *
 * The parts arrive in whatever order the model produced them (a widget before the verdict, the official
 * button before the prose), but an answer always reads in one order: verdict and prose, then widgets, then
 * the official button, then sources, actions and follow-ups. Until the prose arrives, its place is held by
 * the status line ("Checking Environment Canada's alerts for Halifax."), and widgets whose results came in
 * first wait for the prose above them to be complete, so nothing on screen is pushed down while it is read.
 *
 * Memoized: callbacks take the message id, so the parent passes one stable handler for every answer and
 * earlier answers don't re-render while a new one streams.
 */
import { memo, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type { UIMessage } from 'ai';
import { ArrowRight, Globe, PenLine, RotateCcw, Scissors, Square } from 'lucide-react';
import { pack } from '@/countries/active';
import { CORE_SILENT_TOOLS } from '@/lib/ai/silent-tools';
import { SourceFooterContext } from '@/components/ui/WidgetShell';
import { cn } from '@/lib/cn';
import { localeInfo, type Locale } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/provider';
import { dirOfLocale, localeOfText, scriptOf } from '@/lib/i18n/script';
import type { WidgetPart } from '@/lib/widgets/types';
import { useChatCommands } from './actions';
import { answerText } from './answer-parts';
import { FollowUps } from './FollowUps';
import { HandoffAction } from './Handoff';
import { CitationsProvider } from './citations';
import { MessageActions } from './MessageActions';
import { Orb } from './Orb';
import { SourceList } from './SourceList';
import { collectSources } from './sources';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ToolPart } from './ToolPart';
import { useMarkdown } from './useMarkdown';

/** @deprecated Import it from `./Orb`: that module doesn't bring the answer renderer (markdown, widgets) with it. */
export { Orb };

type Props = {
  message: UIMessage;
  question?: string;
  /** This answer is the one streaming right now. */
  streaming: boolean;
  isLast: boolean;
  /** Regenerate this answer (optionally in another language). */
  onRegenerate: (messageId: string, answerLocale?: string) => void;
  /** Put the question back in the composer to rephrase it (offered on a stopped answer). */
  onEditQuestion?: (question: string) => void;
  /** The answer's `<article>`. */
  ref?: Ref<HTMLElement>;
};

/** Metadata the chat route attaches to an answer (and the client adds when an answer is stopped). */
export type AnswerMeta = {
  lang?: string;
  asked?: string;
  stopped?: boolean;
  /** A short note in the person's own language when the body that follows is in English/French. */
  note?: string;
  /** ISO date the answer's facts were verified; shown on cited pages that carry no date of their own. */
  checked?: string;
  /** Written by the model (it may open with a status line before its tools run). */
  engine?: 'model';
  /** The answer hit the length or time limit before it was finished. */
  truncated?: boolean;
};
export const metaOf = (m: UIMessage) => (m.metadata ?? {}) as AnswerMeta;

/**
 * The language of one block of an answer: its script decides for non-Latin text; Latin text uses the
 * language the answer was written in (metadata), else the interface language when it is Latin, else English.
 * Only then does the block get `lang`/`dir`, so English inside an Arabic page keeps the serif lead and LTR.
 */
function blockLang(text: string, ui: Locale, meta: AnswerMeta): { lang: string; dir: 'ltr' | 'rtl' } {
  const script = scriptOf(text);
  if (script && script !== 'latin') {
    const l = localeOfText(text, ui);
    return { lang: l, dir: dirOfLocale(l) };
  }
  const l = meta.lang && /^(en|fr|es|pt|it|de|vi|tl)$/.test(meta.lang) ? meta.lang : localeInfo(ui).script === 'latin' ? ui : 'en';
  return { lang: l, dir: 'ltr' };
}

/** A stopped or cut-off answer ends at its last complete sentence, never mid-word. */
export function trimToSentence(text: string) {
  // A citation or link the cut left unfinished ("[2](https://www.") goes first.
  const t = text.replace(/\s*\[[^\]\n]*(\]\([^)\n]*)?$/, '').trimEnd();
  if (/[.!?:…)»”]$/.test(t)) return t;
  const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('.\n'), t.lastIndexOf('? '), t.lastIndexOf('! '), t.lastIndexOf(':\n'), t.lastIndexOf('\n\n'));
  return cut > 0 ? t.slice(0, cut + 1).trimEnd() : '';
}

/**
 * The verdict line (`# …`) while its words are still arriving. It is balanced across its lines, so showing it
 * word by word would re-break it and move the line under the reader's eyes; it lands whole instead, where
 * "Checking official sources…" was.
 */
const UNFINISHED_LEAD = /^\s*#(?!#)[^\n]*$/;

const listedInAnswer = { listedInAnswer: true };
const HANDOFF = 'tool-officialHandoff';

const isWidgetPart = (type: string) =>
  type.startsWith('tool-') && type !== 'tool-suggestFollowUps' && !pack.silentTools?.includes(type.slice(5)) && !CORE_SILENT_TOOLS.includes(type.slice(5));

export const AssistantMessage = memo(function AssistantMessage({ message, question, streaming, isLast, onRegenerate, onEditQuestion, ref }: Props) {
  const { t, locale } = useLocale();
  const { continueAnswer } = useChatCommands();
  const Markdown = useMarkdown();
  const article = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => article.current!, []);
  // Whether this answer streamed in while on screen (render-phase "previous value"): only a live answer
  // plays widget entrances and nudges its follow-ups into view; one reopened from history doesn't.
  const [live, setLive] = useState(streaming);
  if (streaming && !live) setLive(true);

  const meta = metaOf(message);
  const stopped = Boolean(meta.stopped) && !streaming;
  const truncated = Boolean(meta.truncated) && !stopped && !streaming;
  const sources = useMemo(() => collectSources(message), [message]);
  const followUps = useMemo(() => {
    const p = message.parts.find((x) => x.type === 'tool-suggestFollowUps') as WidgetPart<{ questions: string[] }, { questions: string[] }> | undefined;
    return (p?.output?.questions ?? (p?.input as { questions?: string[] } | undefined)?.questions ?? []).filter(Boolean);
  }, [message]);
  const done = !streaming;
  const lastIndex = message.parts.length - 1;
  const { prose, status } = answerText(message.parts, streaming && meta.engine === 'model');
  const lastProse = prose.at(-1);
  /** What a text part shows right now: an interrupted answer ends on a sentence, a streaming one holds back a partial lead. */
  const shownText = (i: number) => {
    const text = (message.parts[i] as { text: string }).text;
    if ((stopped || truncated) && i === lastProse) return trimToSentence(text);
    if (streaming && i === lastIndex && UNFINISHED_LEAD.test(text)) return '';
    return text;
  };
  const blocks = prose.map((i) => ({ i, text: shownText(i) })).filter((b) => b.text.trim());
  const hasText = blocks.length > 0;
  // Widgets and the official button appear once the prose above them is complete (something follows it, or the
  // answer is over), and then stay: text streaming in above a widget would push it down the page.
  const [revealed, setRevealed] = useState(!streaming);
  if (!revealed && (!streaming || (hasText && lastProse !== lastIndex))) setRevealed(true);
  const widgets = message.parts.filter((p) => p.type !== HANDOFF && isWidgetPart(p.type)) as WidgetPart[];
  const handoffs = message.parts.filter((p) => p.type === HANDOFF) as WidgetPart[];
  const official = sources.filter((s) => s.official).length || sources.length;
  const noteLang = meta.asked && meta.asked !== meta.lang ? meta.asked : undefined;

  return (
    <article ref={article} className={cn('ac-msg-ai', streaming && isLast && 'is-streaming')} aria-label={t('chat.answerLabel')}>
      <div className="ac-ai-meta">
        <Orb />
        <span>{pack.brand.name}</span>
        {/* The page count appears once the answer is complete, so it never ticks up while streaming. */}
        <span className="ac-ai-meta__sub">{streaming ? `· ${t('chat.thinking')}` : sources.length ? `· ${t('chat.fromSources', { count: official })}` : ''}</span>
      </div>

      {meta.note && noteLang ? (
        <p className="ac-note" lang={noteLang} dir={dirOfLocale(noteLang as Locale)}>
          <Globe className="ac-note__icon" aria-hidden strokeWidth={1.8} />
          <span>{meta.note}</span>
        </p>
      ) : null}

      {/* Text waits for the markdown renderer (a chunk of its own): until then the answer is still "thinking". */}
      {(!hasText || !Markdown) && streaming ? <ThinkingIndicator label={status} /> : null}

      <CitationsProvider sources={sources}>
        <SourceFooterContext.Provider value={listedInAnswer}>
          {Markdown
            ? blocks.map(({ i, text }) => {
                const { lang, dir } = blockLang(text, locale, meta);
                return <Markdown key={`text-${i}`} text={text} lang={lang} dir={dir} streaming={streaming && i === lastIndex} />;
              })
            : null}
          {revealed ? widgets.map((part, i) => <ToolPart key={part.toolCallId ?? `widget-${i}`} part={part} appear={live} />) : null}
          {revealed ? handoffs.map((part, i) => <HandoffAction key={part.toolCallId ?? `handoff-${i}`} part={part} />) : null}
        </SourceFooterContext.Provider>
      </CitationsProvider>

      {stopped ? (
        <div className="ac-stopped no-print">
          <span className="ac-stopped__pill" role="status">
            <Square className="ac-stopped__icon" aria-hidden fill="currentColor" strokeWidth={0} />
            {t('chat.stopped')}
          </span>
          {isLast ? (
            <>
              {/* Phones show the short labels ("Continue", "Edit") so the row never wraps; the full label is the accessible name. */}
              <button type="button" className="ac-stopped__go" onClick={() => onRegenerate(message.id)} aria-label={t('chat.continue')}>
                <RotateCcw className="size-4" aria-hidden strokeWidth={1.9} />
                <span className="ac-stopped__long">{t('chat.continue')}</span>
                <span className="ac-stopped__short" aria-hidden>
                  {t('chat.continueShort')}
                </span>
              </button>
              {onEditQuestion && question ? (
                <button type="button" className="ac-stopped__alt" onClick={() => onEditQuestion(question)} aria-label={t('chat.editQuestion')}>
                  <PenLine className="size-4" aria-hidden strokeWidth={1.8} />
                  <span className="ac-stopped__long">{t('chat.editQuestion')}</span>
                  <span className="ac-stopped__short" aria-hidden>
                    {t('chat.editShort')}
                  </span>
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {truncated ? (
        <div className="ac-stopped no-print">
          <span className="ac-stopped__pill" role="status">
            <Scissors className="ac-stopped__icon ac-stopped__icon--line" aria-hidden strokeWidth={2} />
            {t('chat.truncated')}
          </span>
          {isLast ? (
            <button type="button" className="ac-stopped__go" onClick={() => continueAnswer(t('chat.continuePrompt'))} aria-label={t('chat.continueAnswer')}>
              <span className="ac-stopped__long">{t('chat.continueAnswer')}</span>
              <span className="ac-stopped__short" aria-hidden>
                {t('chat.continueShort')}
              </span>
              <ArrowRight className="size-4 flip-rtl" aria-hidden strokeWidth={1.9} />
            </button>
          ) : null}
        </div>
      ) : null}
      {done && !stopped && sources.length ? <SourceList sources={sources} official={official} checked={meta.checked} /> : null}
      {done && hasText && !stopped ? <MessageActions message={message} question={question} onRegenerate={onRegenerate} isLast={isLast} /> : null}
      {done && isLast && !stopped && followUps.length ? <FollowUps questions={followUps} nudge={live} answerRef={article} /> : null}
    </article>
  );
});
