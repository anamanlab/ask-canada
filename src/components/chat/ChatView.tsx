'use client';
/**
 * The conversation screen: sticky header, thread, docked composer with a fade scrim, jump-to-latest,
 * on-device history, error + retry, and polite live-region announcements.
 *
 * The runtime drives it through a small handle (`ChatViewHandle`) instead of reaching into the DOM.
 */
import { memo, useCallback, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type Ref } from 'react';
import type { ChatStatus, UIMessage } from 'ai';
import { pack } from '@/countries/active';
import { SiteHeader } from '@/components/site/SiteHeader';
import type { SavedItem } from '@/lib/device-store';
import { disclaimerKey } from '@/lib/brand';
import { isFinePointer } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { ChatDock } from './ChatDock';
import { afterPaint, ChatLayoutContext } from './ChatLayout';
import type { ComposerHandle } from './Composer';
import { HistorySheet } from './HistorySheet';
import { PendingAnswer } from './ThinkingIndicator';
import { textOf, ThreadTurn } from './ThreadTurn';
import { UserBubble } from './UserBubble';
import { useThreadGeometry } from './useThreadGeometry';

export type ChatViewHandle = {
  /**
   * Keep focus in the conversation once the control that sent (hero composer, a chip, an "Ask next"
   * follow-up) is gone: with a keyboard/mouse, the caret moves to the docked "Ask a follow-up…" box; on
   * touch (keyboard dismissed), focus moves to the thread heading so the next swipe/Tab reads the answer.
   */
  focusAfterSend: () => void;
  /** The next question to appear scrolls itself to the top of the reading area. */
  revealNextTurn: () => void;
};

type Props = {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  /** The question from `/?q=` while its request is being sent. */
  pending?: string;
  onReset: () => void;
  onOpenHistory: (item: SavedItem) => void;
  /** Device-store key of the conversation on screen (marked as current in history). */
  currentKey?: string;
  onRegenerate: (messageId: string, answerLocale?: string) => void;
  /** Retry the last request after an error. */
  onRetry: () => void;
  ref?: Ref<ChatViewHandle>;
};

type Turn = { key: string; user?: UIMessage; ai?: UIMessage };

/** Group into turns: [user, assistant?]. */
function toTurns(messages: UIMessage[]): Turn[] {
  const out: Turn[] = [];
  for (const m of messages) {
    if (m.role === 'user') out.push({ user: m, key: m.id });
    else if (m.role === 'assistant') {
      const last = out[out.length - 1];
      if (last && !last.ai) last.ai = m;
      else out.push({ ai: m, key: m.id });
    }
  }
  return out;
}

/** The aurora behind the thread (light and dark art from the country pack). */
const GLOW_ART = { '--au': `url(${pack.art.hero.aurora})`, '--au-d': `url(${pack.art.hero.auroraDark ?? pack.art.hero.aurora})` } as CSSProperties;

/** The header re-renders only when its own props change, not on every streamed chunk. */
const ChatHeader = memo(SiteHeader);

export function ChatView({ messages, status, error, pending, onReset, onOpenHistory, currentKey, onRegenerate, onRetry, ref }: Props) {
  const { t } = useLocale();
  const [historyOpen, setHistoryOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const thread = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const dockInner = useRef<HTMLDivElement>(null);
  const latestAnswer = useRef<HTMLElement>(null);
  const firstBubble = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);
  const revealNext = useRef(false);
  const streaming = status === 'streaming' || status === 'submitted';

  const turns = useMemo(() => toTurns(messages), [messages]);
  const firstUser = messages.find((m) => m.role === 'user');
  const title = useMemo(() => {
    const s = firstUser ? textOf(firstUser) : (pending ?? '');
    return s.length > 56 ? s.slice(0, 54).trimEnd() + '…' : s;
  }, [firstUser, pending]);

  const { layout, scrim, jump, titleShown, onJump } = useThreadGeometry(
    { header, dockInner, thread, end, latestAnswer, firstBubble },
    { streaming, firstUserId: firstUser?.id },
  );

  useImperativeHandle(
    ref,
    () => ({
      focusAfterSend: () => {
        afterPaint(() => {
          const active = document.activeElement;
          if (active && active !== document.body) return; // focus already landed somewhere on purpose
          if (isFinePointer()) composer.current?.focus({ preventScroll: true });
          else titleRef.current?.focus({ preventScroll: true });
        });
      },
      revealNextTurn: () => {
        revealNext.current = true;
      },
    }),
    [],
  );

  const revealTurn = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !revealNext.current) return;
      revealNext.current = false;
      requestAnimationFrame(() => layout.scrollIntoBand(el));
    },
    [layout],
  );
  const editQuestion = useCallback((question: string) => composer.current?.setText(question), []);
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const openFromHistory = useCallback(
    (item: SavedItem) => {
      setHistoryOpen(false);
      if (item.key !== currentKey) onOpenHistory(item);
    },
    [currentKey, onOpenHistory],
  );

  // Live announcements (derived from status; the polite live region reads changes aloud)
  const announce = streaming ? t('chat.announceWorking') : status === 'error' ? t('error.generic') : messages.length ? t('chat.announceReady') : '';
  const lastId = messages[messages.length - 1]?.id;

  return (
    <ChatLayoutContext value={layout}>
      <div className="ac-chat">
        <a href="#thread" className="skip-link">
          {t('a11y.skipToConversation')}
        </a>
        <a href="#composer-dock" className="skip-link">
          {t('a11y.skipToComposer')}
        </a>
        <div
          className="ac-glow"
          aria-hidden
          style={GLOW_ART}
        >
          <div className="ac-glow__sky" />
        </div>
        <ChatHeader ref={header} variant="chat" title={title} titleShown={titleShown} onHome={onReset} onNewChat={onReset} onHistory={openHistory} historyOpen={historyOpen} />

        <main id="thread" ref={thread} className="ac-thread" tabIndex={-1}>
          <h1 ref={titleRef} className="sr-only" tabIndex={-1}>
            {t('chat.heading', { brand: pack.brand.name })}
          </h1>
          {pending && !messages.length ? (
            <section className="ac-turn is-last">
              <UserBubble text={pending} />
              <PendingAnswer ref={latestAnswer} />
            </section>
          ) : null}
          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            return (
              <ThreadTurn
                key={turn.key}
                user={turn.user}
                ai={turn.ai}
                lastOfMany={isLast && turns.length > 1}
                isLast={turn.ai?.id === lastId}
                streaming={streaming && turn.ai?.id === lastId}
                submitted={isLast && status === 'submitted'}
                error={isLast ? error : undefined}
                onRegenerate={onRegenerate}
                onEditQuestion={editQuestion}
                onRetry={onRetry}
                answerRef={isLast ? latestAnswer : undefined}
                bubbleRef={turn.user && turn.user === firstUser ? firstBubble : undefined}
                sectionRef={revealTurn}
              />
            );
          })}
          <div ref={end} className="h-px" aria-hidden />
          {status === 'ready' && messages.length ? <p className="ac-thread-foot">{t(disclaimerKey)}</p> : null}
        </main>

        <ChatDock scrim={scrim} jump={messages.length ? jump : null} onJump={onJump} innerRef={dockInner} composerRef={composer} />

        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>
        <HistorySheet open={historyOpen} currentKey={currentKey} onClose={closeHistory} onOpen={openFromHistory} />
      </div>
    </ChatLayoutContext>
  );
}
