/** Republic of Example mark: a simple eight-point star. Replace with your country's mark. */
import type { MarkProps } from '@/lib/country/types';

export const STAR_PATH = 'M12 1.5l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 15.8l-5.8 3.5 1.6-6.6-5.2-4.4 6.8-.5z';

export function Mark({ className, title }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d={STAR_PATH} />
    </svg>
  );
}
