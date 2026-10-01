'use client';
/**
 * One turn of the conversation: the question, then its answer (or "Checking official sources…"), and the
 * error notice when the latest request failed. Memoized: while an answer streams, earlier turns keep
 * their message objects and stable callbacks, so they don't re-render.
 */
import { memo, type Ref } from 'react';
import type { UIMessage } from 'ai';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { AssistantMessage } from './AssistantMessage';
import { PendingAnswer } from './ThinkingIndicator';
import { UserBubble } from './UserBubble';

export const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ').trim();

type Translate = (k: string, v?: Record<string, string | number>) => string;

function errorText(err: Error, t: Translate) {
  try {
    const body = JSON.parse(err.message) as { error?: string; retryAfter?: number };
    switch (body.error) {
      case 'rate_limited':
        return t('error.rateLimited', { seconds: body.retryAfter ?? 30 });
      case 'too_long':
        return t('error.tooLong');
      case 'file_type':
      case 'file_size':
      case 'too_many_files':
        return t('error.file');
    }
  } catch {}
  return navigator.onLine === false ? t('error.offline') : t('error.generic');
}

type Props = {
  user?: UIMessage;
  ai?: UIMessage;
  /** The last turn of a conversation that has more than one (it gets room to scroll to the top). */
  lastOfMany: boolean;
  isLast: boolean;
  /** This turn's answer is streaming. */
  streaming: boolean;
  /** The request for this turn was sent and no answer has started yet. */
  submitted: boolean;
  error?: Error;
  onRegenerate: (messageId: string, answerLocale?: string) => void;
  onEditQuestion: (question: string) => void;
  onRetry: () => void;
  /** Receives the answer element when this is the latest turn. */
  answerRef?: Ref<HTMLElement>;
  /** Receives the question bubble when this is the first turn. */
  bubbleRef?: Ref<HTMLDivElement>;
  /** Called with the section when it mounts (a new question scrolls itself into view). */
  sectionRef: (el: HTMLElement | null) => void;
};

export const ThreadTurn = memo(function ThreadTurn({
  user,
  ai,
  lastOfMany,
  isLast,
  streaming,
  submitted,
  error,
  onRegenerate,
  onEditQuestion,
  onRetry,
  answerRef,
  bubbleRef,
  sectionRef,
}: Props) {
  const { t } = useLocale();
  const question = user ? textOf(user) : undefined;
  return (
    <section ref={sectionRef} className={cn('ac-turn', lastOfMany && 'is-last')}>
      {user ? <UserBubble text={question ?? ''} message={user} bubbleRef={bubbleRef} /> : null}
      {ai ? (
        <AssistantMessage
          ref={answerRef}
          message={ai}
          question={question}
          streaming={streaming}
          isLast={isLast}
          onRegenerate={onRegenerate}
          onEditQuestion={onEditQuestion}
        />
      ) : submitted ? (
        <PendingAnswer ref={answerRef} />
      ) : null}
      {error ? (
        <div className="mt-4">
          <Notice tone="warn" title={t('error.title')}>
            {errorText(error, t)}
          </Notice>
          <Button className="mt-3" size="sm" icon={RotateCcw} onClick={onRetry}>
            {t('widget.retry')}
          </Button>
        </div>
      ) : null}
    </section>
  );
});
