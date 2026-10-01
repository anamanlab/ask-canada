'use client';
/**
 * "Checking official sources…": shown until an answer's first words arrive. When the model has said what it
 * is checking ("Checking Environment Canada's alerts for Halifax."), that sentence is shown instead.
 */
import type { Ref } from 'react';
import { useLocale } from '@/lib/i18n/provider';

export function ThinkingIndicator({ label }: { label?: string }) {
  const { t } = useLocale();
  return (
    <div className="ac-thinking" role="status">
      <span className="ac-thinking__dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span dir="auto">{label || t('chat.searching')}</span>
    </div>
  );
}

/** A placeholder answer (before the assistant message exists), laid out like a real one. */
export function PendingAnswer({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <article ref={ref} className="ac-msg-ai">
      <ThinkingIndicator />
    </article>
  );
}
