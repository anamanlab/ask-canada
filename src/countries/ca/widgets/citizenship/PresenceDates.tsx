'use client';
/** The dates that set the calculator's window: PR date, the day the application is signed, and time in Canada before PR. */
import { useId, useState, type ReactNode, type Ref } from 'react';
import { Field, Toggle } from '@/components/ui';
import { prefersReducedMotion } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { DateInput } from './DateInput';
import { isISO } from './presence';
import type { Details } from './PresenceTrips';

/** A Field whose label, hint and input share rows with its neighbour's. */
const SUBFIELD = '@md:row-span-3 @md:grid @md:grid-rows-subgrid @md:gap-y-1.5';

/**
 * A date the calculation depends on. What the person types is kept as a draft: only a date that passes
 * `check` is committed, and anything else (cleared, out of range) shows why under the field while the
 * calculation keeps the last good date.
 */
function DateRow({
  label,
  hint,
  value,
  min,
  max,
  check,
  onCommit,
  inputRef,
  className,
}: {
  label: ReactNode;
  hint: ReactNode;
  value: string;
  min?: string;
  max?: string;
  /** The message to show for this raw value ('' when cleared), or null to commit it. */
  check: (raw: string) => string | null;
  onCommit: (raw: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}) {
  const errId = useId();
  const [draft, setDraft] = useState<{ raw: string; error: string } | null>(null);
  return (
    <Field className={className} label={label} hint={hint}>
      {(p) => (
        // The message shares the input's cell, so the label, hint and input rows still line up with the neighbour's.
        <div>
          <DateInput
            {...p}
            ref={inputRef}
            value={draft?.raw ?? value}
            min={min}
            max={max}
            aria-invalid={draft ? true : undefined}
            aria-describedby={[p['aria-describedby'], draft ? errId : null].filter(Boolean).join(' ') || undefined}
            onChange={(e) => {
              const raw = e.target.value;
              const error = check(raw);
              if (error) return setDraft({ raw, error });
              setDraft(null);
              onCommit(raw);
            }}
          />
          {draft ? (
            <p id={errId} className="m-0 mt-1.5 text-[13px] font-medium text-maple-ink" role="alert">
              {draft.error}
            </p>
          ) : null}
        </div>
      )}
    </Field>
  );
}

/** A ref callback with a stable identity: the field it is given takes focus, in view, when it mounts. */
const revealOnMount = (el: HTMLInputElement | null) => {
  el?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  el?.focus({ preventScroll: true });
};

export function DatesFields({
  details,
  today,
  onChange,
  focusPr,
}: {
  details: Details;
  today: string;
  onChange: (p: Partial<Details>) => void;
  /** The person asked for the PR date field: it takes focus when these fields mount. */
  focusPr?: boolean;
}) {
  const t = useMessages(messages);
  // On when there is a date, until the person flips the switch themselves.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const tempOn = toggled ?? Boolean(details.tempStart);
  return (
    <>
      {/* Label, hint and input rows are shared across both fields (subgrid), so all three line up in any language. */}
      <div className="grid gap-3 @md:grid-cols-2 @md:gap-y-1.5">
        <DateRow
          className={SUBFIELD}
          label={t('presence.details.pr')}
          hint={t('presence.details.prHint')}
          inputRef={focusPr ? revealOnMount : undefined}
          value={details.prDate ?? ''}
          max={today}
          check={(raw) => (isISO(raw) && raw <= today ? null : t('presence.details.prError'))}
          onCommit={(prDate) => onChange({ prDate })}
        />
        <DateRow
          className={SUBFIELD}
          label={t('presence.details.apply')}
          hint={t('presence.details.applyHint')}
          value={details.applyDate ?? today}
          min={today}
          // Cleared means "today".
          check={(raw) => (raw === '' || (isISO(raw) && raw >= today) ? null : t('presence.details.applyError'))}
          onCommit={(raw) => onChange({ applyDate: raw && raw !== today ? raw : null })}
        />
      </div>
      <Toggle
        className="mt-3 text-pretty"
        label={t('presence.details.tempOn')}
        description={t('presence.details.tempDesc')}
        checked={tempOn}
        onChange={(v) => {
          setToggled(v);
          if (!v) onChange({ tempStart: null });
        }}
      />
      {tempOn ? (
        <DateRow
          className="mt-2"
          label={t('presence.details.temp')}
          hint={t('presence.details.tempHint')}
          value={details.tempStart ?? ''}
          max={details.prDate ?? today}
          // Optional: cleared means no time before PR.
          check={(raw) => (raw === '' || (isISO(raw) && raw < (details.prDate ?? today)) ? null : t('presence.details.tempError'))}
          onCommit={(raw) => onChange({ tempStart: raw || null })}
        />
      ) : null}
    </>
  );
}
