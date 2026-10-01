'use client';
/**
 * "Can you renew?": the four checks from canada.ca. Unticking any one turns the plan into a new application.
 * While all four are ticked the answer card already says "You can renew", so the checks fold under one row
 * (core Disclosure) and the plan stays short. Once one is unticked they are the reason for the answer: the
 * section stays open, with nothing to fold.
 */
import { Check, CircleAlert } from 'lucide-react';
import { Badge, Disclosure, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { PASSPORT } from './data';
import messages from './messages';
import { isolate } from './shared';
import type { PlannerOutput } from './types';

export type Criteria = PlannerOutput['eligibility'];
const CRITERIA: (keyof Criteria)[] = ['issuedAt16OrOlder', 'issuedWithin15Years', 'validFor5or10Years', 'sameDetails'];

type ChecksProps = { criteria: Criteria; onToggle: (c: keyof Criteria) => void };

function Checks({ criteria, onToggle }: ChecksProps) {
  const t = useMessages(messages);
  return (
    <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2">
      {CRITERIA.map((c) => {
        const on = criteria[c];
        return (
          <li key={c}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(c)}
              className={cn(
                'flex min-h-[52px] w-full items-center gap-3 rounded-field border px-3.5 py-3 text-start text-[14.5px] leading-snug transition-colors',
                on ? 'border-hair bg-card hover:border-hair-2' : 'border-maple/30 bg-maple-wash',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-[22px] shrink-0 place-items-center rounded-lg border-[1.5px] transition-colors',
                  on ? 'border-pine bg-pine text-card' : 'border-hair-2 text-transparent',
                )}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-ink">{t(`elig.${c}`, { years: PASSPORT.maxYearsSinceIssue })}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const NOTE = 'm-0 mt-3 text-[14px] leading-snug text-ink-2';

export function Eligibility({ criteria, canRenew, onToggle, headingLevel }: ChecksProps & { canRenew: boolean; headingLevel?: 4 | 5 }) {
  const t = useMessages(messages);
  if (canRenew) {
    return (
      <Disclosure title={isolate(t('elig.review'))} summary={isolate(t('elig.reviewSub'))} headingLevel={headingLevel}>
        <Checks criteria={criteria} onToggle={onToggle} />
        <p className={cn(NOTE, 'mb-3')}>{isolate(t('elig.skip'))}</p>
      </Disclosure>
    );
  }
  return (
    <WidgetSection
      title={isolate(t('elig.title'))}
      aside={
        <Badge tone="danger" icon={CircleAlert} className="shrink-0">
          {t('elig.no')}
        </Badge>
      }
    >
      <Checks criteria={criteria} onToggle={onToggle} />
      <p className={NOTE}>{isolate(t('elig.newNeeded'))}</p>
    </WidgetSection>
  );
}
