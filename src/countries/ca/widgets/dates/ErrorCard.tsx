'use client';
/**
 * The key dates widgets' error state: what went wrong in plain words, "Try again" (asks the question again) and the
 * official page to fall back on. Same layout as the core `WidgetError`, built from the same primitives with
 * 44px buttons (the default size, with the small size's type and padding so a long label stays on one line): the core one sets its two actions at `size="sm"` (40px, under the 44px target; reported to
 * core in rounds 2 to 4), and styling its buttons from outside would reach into a core component.
 */
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, Card, LinkButton, WidgetIcon } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';

const ACTION = 'px-4 text-sm';

export function ErrorCard({ title, message, onRetry, fallback }: { title: string; message: string; onRetry: () => void; fallback: { href: string; label: string } }) {
  const { t } = useLocale();
  return (
    <Card as="section" role="alert" className="text-start">
      <div className="flex gap-3.5 px-5 py-5 sm:px-6">
        <WidgetIcon icon={AlertTriangle} tone="amber" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[16px] font-semibold text-ink">{title}</p>
          <p className="m-0 mt-1 text-[14.5px] text-ink-2">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className={ACTION} icon={RotateCcw} onClick={onRetry}>
              {t('widget.retry')}
            </Button>
            <LinkButton className={ACTION} variant="secondary" href={fallback.href} external>
              {fallback.label}
            </LinkButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
