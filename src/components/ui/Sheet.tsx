/**
 * Sheet + Dialog, built on the native <dialog> element (focus trap, Esc, inert page, top layer).
 *
 * <Sheet open={open} onClose={() => setOpen(false)} title="Menu" side="end|start|bottom" description="…">…</Sheet>
 * <Dialog open onClose title="Clear this device?" description="…" footer={<Button …/>}>…</Dialog>
 *
 * Returns focus to the element that opened it. Clicking the backdrop closes it.
 * Every side sheet shares one header: the title starts 40px from the top (same baseline for Menu, History,
 * Language…), content sits on the same 20px (phone) / 24px inset, and the scroll area fades out at the
 * bottom while more content sits below the fold.
 *
 * The body and footer render only once the dialog is first opened, and are kept (hidden, state intact, effects
 * paused) by `<Activity>` while it's closed, so closed dialogs cost nothing on the page. The page scroll lock is
 * shared and counted (a sheet opened from a sheet keeps the page locked until both close).
 */
'use client';
import { Activity, useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/hooks/media';
import { useScrollEdges } from '@/lib/hooks/scroll-edges';
import { lockScroll } from '@/lib/hooks/scroll-lock';
import { useT } from '@/lib/i18n/provider';
import { IconButton } from './Button';

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
};

/** Exit duration; matches the `[data-closing]` animations in globals.css. */
export const EXIT_MS = 200;

/**
 * Drives a native dialog from `open`. Returns its ref, `visible` (from the moment it opens until its exit
 * animation has finished) and `mounted` (it has been opened at least once).
 */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(open);
  const [mounted, setMounted] = useState(open);
  // Render-phase sync: the contents are there in the same commit that opens the dialog.
  if (open && !visible) setVisible(true);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      // Re-opened mid-exit: keep it on screen.
      if (closing.current) clearTimeout(closing.current);
      closing.current = null;
      delete d.dataset.closing;
    }
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
    }
    // Held while open (re-taken if an effect cleanup released it while the dialog stayed open).
    if (open) {
      if (!release.current) release.current = lockScroll();
    } else if (d.open && !closing.current) {
      // Exit: a short slide + fade (CSS `[data-closing]`), then the real close (focus returns to the opener).
      if (prefersReducedMotion()) d.close();
      else {
        d.dataset.closing = '';
        closing.current = setTimeout(() => {
          closing.current = null;
          delete d.dataset.closing;
          d.close();
        }, EXIT_MS);
      }
    }
  }, [open]);

  const onCancel = useEffectEvent((e: Event) => {
    e.preventDefault();
    onClose();
  });
  const onClosed = useEffectEvent(() => {
    release.current?.();
    release.current = null;
    setVisible(false);
    if (opener.current instanceof HTMLElement) opener.current.focus();
  });
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const cancel = (e: Event) => onCancel(e);
    const closed = () => onClosed();
    d.addEventListener('cancel', cancel);
    d.addEventListener('close', closed);
    return () => {
      d.removeEventListener('cancel', cancel);
      d.removeEventListener('close', closed);
      if (closing.current) clearTimeout(closing.current);
      release.current?.();
      release.current = null;
    };
  }, []);

  return { ref, visible, mounted };
}

/** Closed and never opened: nothing. Closed after being opened: hidden, state kept. */
function Contents({ visible, mounted, children }: { visible: boolean; mounted: boolean; children: ReactNode }) {
  if (!mounted) return null;
  return <Activity mode={visible ? 'visible' : 'hidden'}>{children}</Activity>;
}

export function Sheet({ open, onClose, title, description, children, footer, className, hideTitle, side = 'end' }: Props & { side?: 'end' | 'start' | 'bottom' }) {
  const { ref, visible, mounted } = useDialog(open, onClose);
  const id = useId();
  const t = useT();
  const { ref: scrollRef, end: more } = useScrollEdges<HTMLDivElement>({ axis: 'y', threshold: 4 });
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        'ac-sheet m-0 max-h-none max-w-none border-0 bg-transparent p-0 text-ink backdrop:bg-[rgba(8,14,26,.42)] backdrop:backdrop-blur-[3px]',
        side === 'bottom' ? 'ac-sheet-bottom inset-x-0 bottom-0 top-auto w-full' : 'inset-y-0 h-dvh w-[min(440px,100vw)]',
        side === 'end' && 'ac-sheet-end ms-auto',
        side === 'start' && 'ac-sheet-start me-auto',
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col bg-paper shadow-lg',
          side === 'bottom' ? 'max-h-[88dvh] rounded-t-[28px]' : 'border-hair',
          className,
        )}
      >
        <div
          className={cn('ac-sheet__head flex items-start justify-between gap-3 px-5 pb-2 sm:px-6', side === 'bottom' ? 'pt-4' : 'pt-8')}
        >
          <div className="min-w-0 pt-2">
            <h2 id={`${id}-t`} className={cn('m-0 font-serif text-[26px] font-normal leading-tight tracking-[-.02em]', hideTitle && 'sr-only')}>
              {title}
            </h2>
            {description ? (
              <p id={`${id}-d`} className="m-0 mt-1 text-[14px] text-ink-3">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label={t('action.close')} icon={X} onClick={onClose} autoFocus className="-me-2.5 shrink-0" />
        </div>
        <div ref={scrollRef} className={cn('ac-sheet__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6', more && 'has-more')}>
          <Contents visible={visible} mounted={mounted}>
            {children}
          </Contents>
        </div>
        {footer ? (
          <div className="border-t border-hair px-5 py-4 sm:px-6">
            <Contents visible={visible} mounted={mounted}>
              {footer}
            </Contents>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

export function Dialog({ open, onClose, title, description, children, footer, className }: Props) {
  const { ref, visible, mounted } = useDialog(open, onClose);
  const id = useId();
  const t = useT();
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="ac-dialog m-auto w-[min(480px,calc(100vw-32px))] rounded-panel border border-hair bg-card p-0 text-ink shadow-lg backdrop:bg-[rgba(8,14,26,.42)] backdrop:backdrop-blur-[3px]"
    >
      <div className={cn('p-6', className)}>
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-t`} className="m-0 font-serif text-[24px] font-normal leading-tight tracking-[-.02em]">
            {title}
          </h2>
          <IconButton label={t('action.close')} icon={X} onClick={onClose} size="sm" className="-me-2 -mt-2" />
        </div>
        {description ? (
          <p id={`${id}-d`} className="m-0 mt-2 text-[15px] text-ink-2">
            {description}
          </p>
        ) : null}
        <div className="mt-4">
          <Contents visible={visible} mounted={mounted}>
            {children}
          </Contents>
        </div>
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Contents visible={visible} mounted={mounted}>
              {footer}
            </Contents>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
