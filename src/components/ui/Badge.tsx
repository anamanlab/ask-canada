/**
 * Badge: small status pill.
 * <Badge tone="neutral|ok|warn|danger|info|live" icon={Icon}>Saved on this device only</Badge>
 * `live` shows a pulsing dot (for live data feeds).
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'live';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-paper-2 text-ink-2',
  ok: 'bg-pine-wash text-pine',
  warn: 'bg-amber-wash text-amber',
  danger: 'bg-maple-wash text-maple-ink',
  info: 'bg-glacier-wash text-glacier',
  live: 'bg-pine-wash text-pine',
};

export function Badge({
  tone = 'neutral',
  icon: Icon,
  mono,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  mono?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-chip px-2.5 py-1 text-[12.5px] font-medium leading-none',
        // `mono` is kept for API compatibility: badges are plain-language status, so they stay in the sans
        // (only figures line up, with tabular numerals). Monospace is reserved for domains and URLs.
        mono && 'tabular-nums',
        tones[tone],
        className,
      )}
    >
      {tone === 'live' ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-pine" />
        </span>
      ) : Icon ? (
        <Icon className="size-3.5" aria-hidden strokeWidth={2} />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
