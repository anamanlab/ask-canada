'use client';
/** Shown when the planner download fails (offline) after a switch or a new date: what happened, "Try again", and a way back. */
import { RotateCcw, WifiOff } from 'lucide-react';
import { Button, Notice } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

export function PlannerError({ onRetry, onBack }: { onRetry: () => void; onBack?: () => void }) {
  const t = useMessages(messages);
  return (
    <Notice tone="warn" icon={WifiOff} title={t('offline.title')} live className="mb-3">
      {t('offline.body')}
      <span className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" icon={RotateCcw} onClick={onRetry}>
          {t('offline.retry')}
        </Button>
        {onBack ? (
          <Button size="sm" variant="secondary" onClick={onBack}>
            {t('offline.back')}
          </Button>
        ) : null}
      </span>
    </Notice>
  );
}
