/**
 * LiveRegion: one polite, screen-reader-only announcement that waits for the value to settle.
 * <LiveRegion text={t('summary', { total: fmt.money(total) })} />            // after 700 ms of quiet
 * <LiveRegion text={verdict} delay={400} />
 *
 * Sliders, steppers and tickers change many times a second; this updates a single sr-only sentence once the
 * text has been stable for `delay` ms. The first render is silent (a region's initial content isn't read), so a
 * conversation with several widgets doesn't read every verdict aloud when it loads.
 */
'use client';
import { useSettled } from '@/lib/hooks/settled';

export function LiveRegion({ text, delay = 700 }: { text: string; delay?: number }) {
  const settled = useSettled(text, delay);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {settled}
    </p>
  );
}
