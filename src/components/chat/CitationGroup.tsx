'use client';
/**
 * One chip for adjacent citations ("2·3"): a single 44px target that opens a small list of the sources it
 * stands for (title and host from the answer's `CitationsProvider`). The list is a popover on `document.body`,
 * placed under the chip (above it near the dock), and closes on Esc, an outside press, scroll or resize.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { hostOf, normUrl } from '@/lib/url';
import { useCitations } from './citations';

export function CitationGroup({ cites }: { cites: { n: string; href: string }[] }) {
  const t = useT();
  const info = useCitations();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const id = useId();
  const nums = cites.map((c) => c.n);
  const label = t('chat.citations', { list: nums.join(', ') });

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    if (!b) return;
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, b.left + b.width / 2 - width / 2), window.innerWidth - width - 12);
    const h = pop.current?.offsetHeight ?? 0;
    const below = b.bottom + 8;
    const top = below + h > window.innerHeight - 140 && b.top - h - 8 > 72 ? b.top - h - 8 : below;
    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="ac-cite ac-cite--group"
        dir="ltr"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {nums.join('·')}
      </button>
      {open
        ? createPortal(
            <div
              ref={pop}
              id={id}
              role="group"
              aria-label={label}
              className="ac-citepop"
              style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { visibility: 'hidden', top: 0, left: 0 }}
            >
              <ul>
                {cites.map((c) => {
                  const s = info?.get(normUrl(c.href));
                  const host = s?.host || hostOf(c.href);
                  return (
                    <li key={c.n}>
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="ac-citepop__item" onClick={() => setOpen(false)}>
                        <span className="ac-src__num">{c.n}</span>
                        <span className="ac-citepop__body">
                          <span className="ac-citepop__title">{s?.title ?? host}</span>
                          <span className="ac-citepop__host">{host}</span>
                        </span>
                        <ArrowUpRight className="ac-citepop__go flip-rtl" aria-hidden />
                        <span className="sr-only"> {t('a11y.newTab')}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
