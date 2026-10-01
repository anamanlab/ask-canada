'use client';
/** Where the CRS points come from: one meter per group (core, spouse, skill transferability, additional). */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { CrsResult } from './crs';
import messages from './messages';
import { Meter } from './Shared';

export function Breakdown({ score }: { score: CrsResult }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const groups = [
    { key: 'core', g: score.core },
    ...(score.spouse ? [{ key: 'spouse', g: score.spouse }] : []),
    { key: 'transferability', g: score.transferability },
    { key: 'additional', g: score.additional },
  ];
  return (
    <ul className="m-0 grid list-none gap-4 p-0">
      {groups.map(({ key, g }) => (
        <li key={key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[14.5px] font-medium text-ink">{t(`crs.group.${key}`)}</span>
            <bdi dir="ltr" className="whitespace-nowrap text-[13.5px] tabular-nums text-ink-2">
              <b className="font-semibold text-ink">{fmt.number(g.total)}</b> / {fmt.number(g.max)}
            </bdi>
          </div>
          <Meter className="mt-2" value={g.total} max={g.max} tone={key === 'additional' ? 'amber' : key === 'transferability' ? 'glacier' : 'pine'} />
          <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-2">
            {g.lines
              .filter((l) => l.points > 0 || key === 'core')
              .map((l) => t('crs.line', { label: t(`crs.line.${l.key}`), points: fmt.number(l.points) }))
              .join(' · ') || t('crs.line.none')}
          </p>
        </li>
      ))}
    </ul>
  );
}
