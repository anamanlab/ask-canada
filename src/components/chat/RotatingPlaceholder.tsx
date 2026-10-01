'use client';
/**
 * The composer's example placeholder: rotates through `placeholders` with a true crossfade (the outgoing
 * line fades out while the incoming one fades in), so there is never a blank frame, even mid-transition.
 *
 * <RotatingPlaceholder placeholders={[…]} compactPlaceholders={[…]} lang="fr" shown={!text} paused={focused} />
 * - Hidden once something is typed (`shown`); it comes back on the example it had reached.
 * - Stands still while `paused` (the box has focus), with reduced motion, or with a single example.
 */
import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { useMediaQuery } from '@/lib/hooks';

const ROTATE_MS = 3800;
/** A little longer than the 240 ms crossfade in composer.css. */
const CROSSFADE_MS = 280;

type Props = {
  placeholders: string[];
  /** Shorter lines for phones (same order as `placeholders`); used below 760px. */
  compactPlaceholders?: string[];
  lang?: string;
  shown: boolean;
  paused: boolean;
};

export function RotatingPlaceholder({ placeholders, compactPlaceholders, lang, shown, paused }: Props) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const current = useRef(0);
  const rotating = placeholders.length > 1 && shown && !paused && !reduceMotion;

  useEffect(() => {
    if (!rotating) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const from = current.current;
      current.current = (from + 1) % placeholders.length;
      setLeaving(from);
      setIndex(current.current);
      clearTimeout(settle);
      settle = setTimeout(() => setLeaving(null), CROSSFADE_MS);
    }, ROTATE_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(settle);
    };
  }, [rotating, placeholders.length]);

  if (!shown) return null;
  const line = (i: number) => (
    <>
      <span className={compactPlaceholders ? 'ac-ph-wide' : undefined}>{placeholders[i] ?? placeholders[0] ?? ''}</span>
      {compactPlaceholders ? <span className="ac-ph-compact">{compactPlaceholders[i] ?? compactPlaceholders[0]}</span> : null}
    </>
  );
  return (
    <div className="ac-composer__ph" aria-hidden lang={lang} dir="auto">
      {leaving != null ? (
        <span key={`out-${leaving}`} className="ac-composer__ph-text is-leaving">
          {line(leaving)}
        </span>
      ) : null}
      <span key={`in-${index}`} className={cx('ac-composer__ph-text', leaving != null && 'is-entering')}>
        {line(index)}
      </span>
    </div>
  );
}
