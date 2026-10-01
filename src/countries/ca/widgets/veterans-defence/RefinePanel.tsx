'use client';
/**
 * "Refine" for the career matcher: environment, hours, education and role, folded away under a one-line
 * summary of the current answers. The controls mount on first open.
 */
import { SlidersHorizontal } from 'lucide-react';
import { Badge, Disclosure, Segmented, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { Answers, Education } from './careers';
import messages from './messages';
import { Question } from './parts';

const ENVS = ['any', 'army', 'navy', 'air'] as const;
const HOURS = ['either', 'full-time', 'part-time'] as const;
const PATHS = ['either', 'ncm', 'officer'] as const;
const LEVELS: Education[] = [1, 2, 3, 4, 5];
/** A 3-option Segmented below @sm: one column of three equal rows, so the options read as peers in both languages. */
const THREE = '@max-sm:grid @max-sm:grid-cols-1';
/** In the two-column refine grid (@xl), options take their content width, so a long label stays on one line. */
const FIT = '@xl:[&>button]:flex-auto';

const isLevel = (n: number): n is Education => (LEVELS as number[]).includes(n);

/** How many of the four answers narrow the list. */
export const refinementCount = (a: Answers) => [a.env !== 'any', a.hours !== 'either', a.education != null, a.path !== 'either'].filter(Boolean).length;

export function RefinePanel({ answers, onChange }: { answers: Answers; onChange: (patch: Partial<Answers>) => void }) {
  const t = useMessages(messages);
  const refinements = refinementCount(answers);
  const summary = [
    answers.env === 'any' ? t('sum.env.any') : t(`env.${answers.env}`),
    t(`sum.hours.${answers.hours}`),
    answers.education != null ? t(`ed.${answers.education}`) : t('sum.ed.any'),
    t(`sum.path.${answers.path}`),
  ];
  return (
    <div className="mt-4 rounded-tile border border-hair bg-card px-4">
      <Disclosure
        lazy
        className="border-t-0"
        title={
          // One wrapping row: in a narrow column the count drops under a long (French) title instead of squeezing it.
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <SlidersHorizontal className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
            {t('refine.title')}
            {refinements ? <Badge tone="info">{t('refine.count', { count: refinements })}</Badge> : null}
          </span>
        }
        // Lines break only between answers, and each "·" stays with the answer before it.
        summary={summary.map((item, i) => (
          <span key={i}>
            <span className="whitespace-nowrap">
              {item}
              {i < summary.length - 1 ? ' ·' : ''}
            </span>
            {i < summary.length - 1 ? ' ' : ''}
          </span>
        ))}
      >
        <div className="grid gap-5 border-t border-hair pb-3 pt-4 @xl:grid-cols-2">
          <Question title={t('careers.q.env')}>
            <Segmented
              label={t('careers.q.env')}
              value={answers.env}
              onChange={(v) => onChange({ env: v })}
              className="@max-sm:grid @max-sm:grid-cols-2"
              options={ENVS.map((k) => ({ value: k, label: t(`env.${k}`) }))}
            />
          </Question>
          <Question title={t('careers.q.hours')} hint={t('careers.q.hoursHint')} hintBelow>
            <Segmented
              label={t('careers.q.hours')}
              value={answers.hours}
              onChange={(v) => onChange({ hours: v })}
              className={cn(THREE, FIT)}
              options={HOURS.map((k) => ({ value: k, label: t(`hours.${k}`) }))}
            />
          </Question>
          <Question title={t('careers.q.education')}>
            {(labelId) => (
              <Select
                aria-labelledby={labelId}
                value={answers.education != null ? String(answers.education) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange({ education: isLevel(n) ? n : undefined });
                }}
                options={[{ value: '', label: t('ed.any') }, ...LEVELS.map((n) => ({ value: String(n), label: t(`ed.${n}`) }))]}
              />
            )}
          </Question>
          <Question title={t('careers.q.path')}>
            <Segmented
              label={t('careers.q.path')}
              value={answers.path}
              onChange={(v) => onChange({ path: v })}
              className={cn(THREE, FIT)}
              options={PATHS.map((k) => ({ value: k, label: t(`path.${k}`) }))}
            />
          </Question>
        </div>
      </Disclosure>
    </div>
  );
}
