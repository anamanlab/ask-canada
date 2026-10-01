'use client';
/**
 * Copy a number. If the browser blocks copying, a small bubble shows the number already selected, with the
 * right hint for touch ("press and hold") or keyboard (Ctrl+C), so the button never silently does nothing.
 */
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

export function CopyButton({ value, label, doneLabel, ariaLabel }: { value: string; label: string; doneLabel: string; ariaLabel: string }) {
  const t = useMessages(messages);
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const touch = useMediaQuery('(pointer: coarse)');
  const timer = useRef<number | undefined>(undefined);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const reset = (ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), ms);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('done');
      reset(1800);
      return;
    } catch {
      // Blocked (permissions, an insecure context, an embedded frame): fall through to the bubble.
    }
    // Show the bubble now, so the number in it can be focused and selected in the same tap.
    flushSync(() => setState('failed'));
    field.current?.focus();
    field.current?.select();
    reset(9000);
  };
  const failHint = touch ? t('copy.failedTouch') : t('copy.failedKey');
  return (
    // No positioning here: the bubble anchors to the button group (the nearest positioned ancestor), so on
    // phones it opens from the group's start edge and never runs off the card.
    <span className="inline-flex">
      <Button
        variant="secondary"
        size="sm"
        icon={state === 'done' ? Check : Copy}
        onClick={copy}
        title={t('copy.tip')}
        aria-label={ariaLabel}
        // Phone-width cards (the container, not the window) keep the icon alone.
        className={cn('min-h-11 min-w-11 px-3.5 @max-sm:px-0', state === 'done' && '[&>svg]:text-pine')}
      >
        <span aria-hidden className="@max-sm:hidden">
          {state === 'done' ? doneLabel : label}
        </span>
      </Button>
      {state === 'failed' ? (
        <span className="absolute bottom-full start-0 z-10 mb-2 w-64 max-w-[calc(100cqw-40px)] rounded-field border border-hair bg-card p-3 text-start shadow-lg @xl:start-auto @xl:end-0">
          <span className="block text-[12.5px] leading-snug text-ink-2">{failHint}</span>
          <input
            ref={field}
            readOnly
            value={value}
            dir="ltr"
            aria-label={ariaLabel}
            onKeyDown={(e) => e.key === 'Escape' && setState('idle')}
            onBlur={() => reset(400)}
            className="mt-2 w-full rounded-field border border-hair-2 bg-paper-2 px-2.5 py-1.5 font-serif text-[18px] tabular-nums text-ink outline-none focus-visible:outline-2 focus-visible:outline-ink"
          />
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {state === 'done' ? doneLabel : state === 'failed' ? failHint : ''}
      </span>
    </span>
  );
}
