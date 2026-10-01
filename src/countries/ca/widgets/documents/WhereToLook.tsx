'use client';
/** "Where to look on your letter": numbered areas that light up the matching zone on the letter art. One row of the card's "more" group. */
import { useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { Disclosure } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { DocId } from './data';
import { LetterArt } from './LetterArt';
import messages from './messages';

export function WhereToLook({ doc, count }: { doc: DocId; count: number }) {
  const t = useMessages(messages);
  return (
    // The letter art mounts the first time the guide is opened, then stays (its lit area survives closing).
    <Disclosure
      lazy
      title={
        <>
          <ScanSearch className="size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
          {t('sec.look')}
        </>
      }
      summary={t('look.hint', { count })}
    >
      <Zones doc={doc} count={count} />
    </Disclosure>
  );
}

function Zones({ doc, count }: { doc: DocId; count: number }) {
  const t = useMessages(messages);
  // A tap or Enter keeps an area lit (announced as pressed); hover and keyboard focus only preview it.
  // Unpinning also drops the preview (focus stays on the button), so what is lit always matches `aria-pressed`.
  const [pinned, setPinned] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const lit = preview ?? pinned;
  const zones = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <div className="grid items-start gap-5 border-t border-hair pb-3 pt-4 @xl:grid-cols-[200px_1fr]">
      <div className="mx-auto w-full max-w-[200px]">
        <LetterArt doc={doc} active={lit} onZone={setPreview} />
        <p className="sr-only">{t('look.sr')}</p>
      </div>
      <ol className="m-0 grid list-none gap-1 p-0">
        {zones.map((n) => (
          <li key={n}>
            <button
              type="button"
              aria-pressed={pinned === n}
              onMouseEnter={() => setPreview(n)}
              onMouseLeave={() => setPreview(null)}
              onFocus={() => setPreview(n)}
              onBlur={() => setPreview(null)}
              onClick={() => {
                if (pinned === n) {
                  setPinned(null);
                  setPreview(null);
                } else setPinned(n);
              }}
              className={cn(
                'flex w-full gap-3 rounded-field px-2.5 py-2 text-start transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink',
                lit === n ? 'bg-glacier-wash' : 'hover:bg-card',
              )}
            >
              <span className={cn('mt-px grid size-6 shrink-0 place-items-center rounded-full font-sans text-[12px] font-semibold text-paper transition-colors', lit === n ? 'bg-glacier' : 'bg-ink')} aria-hidden>
                {n}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-snug text-ink">{t(`doc.${doc}.look.${n}.title`)}</span>
                <span className="mt-0.5 block text-[14.5px] leading-snug text-ink-2">{t(`doc.${doc}.look.${n}.detail`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
