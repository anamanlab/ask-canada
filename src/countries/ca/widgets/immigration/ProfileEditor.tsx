'use client';
/**
 * The answers behind the CRS and eligibility widgets, editable in place (every change recalculates).
 * Answers the person never gave are tagged "Assumed" until they change them.
 */
import { useId, type ReactNode, type Ref } from 'react';
import { Segmented, Toggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { AssumedField, CanadianEducation, Profile, RequiredAnswer } from './crs';
import { EDUCATION } from './data';
import messages from './messages';
import { Choice } from './Shared';

export type EditorField =
  | 'age' | 'education' | 'language' | 'secondLanguage' | 'canadianWork' | 'foreignWork' | 'occupation'
  | 'canadianEducation' | 'spouse' | 'sibling' | 'relative' | 'certificate' | 'jobOffer' | 'nomination';

/** The questions each widget asks (also used by its loading state, which lays out the same form). */
export const CRS_FIELDS: EditorField[] = ['age', 'education', 'language', 'secondLanguage', 'canadianWork', 'foreignWork', 'canadianEducation', 'spouse', 'sibling', 'certificate', 'nomination'];
export const ELIGIBILITY_FIELDS: EditorField[] = ['age', 'education', 'language', 'secondLanguage', 'occupation', 'canadianWork', 'foreignWork', 'canadianEducation', 'spouse', 'jobOffer', 'certificate', 'relative'];

const CLB_LEVELS = [0, 4, 5, 6, 7, 8, 9, 10];

/** Small amber tag next to a label: we filled this in, please check it. */
export function AssumedTag({ className = 'ms-2' }: { className?: string }) {
  const t = useMessages(messages);
  return (
    <span className={cn('inline-flex translate-y-[-1px] items-center rounded-chip bg-amber-wash px-2 py-[3px] align-middle text-[11.5px] font-medium leading-none text-amber', className)}>
      {t('assumed.tag')}
    </span>
  );
}

/**
 * Label on top, control pinned to the bottom: side-by-side fields keep their controls on one baseline even when
 * one label wraps (longer French labels, an "Assumed" tag). With `groupRef`, the field is a focusable group that
 * "still needed" chips can jump to (Tab then lands on the chosen option).
 */
function SegField({ label, tag, children, groupRef }: { label: string; tag?: ReactNode; children: ReactNode; groupRef?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={groupRef}
      {...(groupRef ? { role: 'group', 'aria-label': label, tabIndex: -1 } : {})}
      className="grid grid-rows-[1fr_auto] gap-1.5 rounded-field focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      {/* The tag stays beside the label's first line: a long label wraps under itself, never the tag alone. */}
      <span className="flex items-start gap-2 text-[14px] font-medium leading-snug text-ink">
        <span className="min-w-0">{label}</span>
        {tag}
      </span>
      {children}
    </div>
  );
}

/**
 * Local on purpose: the kit's Slider takes a plain string label and no ref, and this one needs a ReactNode label
 * (it carries the "Assumed" tag) and a ref (the "still needed" chips jump to it). Same markup and look
 * (`ac-range`); to be deleted once core's Slider accepts both.
 */
function AgeSlider({
  label,
  value,
  onChange,
  format,
  className,
  inputRef,
}: {
  label: ReactNode;
  value: number;
  onChange: (n: number) => void;
  format: (n: number) => string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const min = 17;
  const max = 50;
  const pct = ((Math.min(max, value) - min) / (max - min)) * 100;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-serif text-[22px] leading-none tracking-[-.02em] text-ink tabular-nums">
          {/* One isolated run: "29 years" keeps its order in a right-to-left page. */}
          <bdi>{format(value)}</bdi>
        </output>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="range"
        min={min}
        max={max}
        value={Math.min(max, value)}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ac-range h-11 w-full cursor-pointer appearance-none bg-transparent"
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </div>
  );
}

export function ProfileEditor({
  profile,
  onChange,
  fields,
  assumed = [],
  foreignScale = 'crs',
  onAnswer,
  fieldRef,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  /** Called for every answer the person picks, even when it equals the assumed value (so "0 years" can be confirmed). */
  onAnswer?: (keys: (keyof Profile)[]) => void;
  fields: EditorField[];
  /** Answers we filled in (tagged until changed). */
  assumed?: AssumedField[];
  /** CRS only distinguishes 0/1/2/3+ years abroad; the FSW grid also rewards 4–5 and 6+. */
  foreignScale?: 'crs' | 'fsw';
  /** Registers the control behind each key answer, so "still needed" chips can jump to it. */
  fieldRef?: (r: RequiredAnswer) => (el: HTMLElement | null) => void;
}) {
  const t = useMessages(messages);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    onChange({ ...profile, [k]: v });
    onAnswer?.([k]);
  };
  const has = (f: EditorField) => fields.includes(f);
  const tag = (f: AssumedField) => (assumed.includes(f) ? <AssumedTag /> : null);
  const clbOptions = CLB_LEVELS.map((n) => ({ value: String(n), label: n === 0 ? t('clb.none') : t('clb.option', { n: String(n) }) }));
  const eduOptions = EDUCATION.map((e) => ({ value: e, label: t(`edu.${e}`) }));
  const years = (max: number) => Array.from({ length: max + 1 }, (_, i) => ({ value: String(i), label: i === max ? t('years.plus', { n: String(i) }) : String(i) }));
  // Segments: isolated runs, so "3+" and "2 years" keep their order in a right-to-left page (not "+3", "years 2").
  const segments = (options: { value: string; label: string }[]): { value: string; label: ReactNode }[] => options.map((o) => ({ value: o.value, label: <bdi>{o.label}</bdi> }));
  const foreignOptions =
    foreignScale === 'fsw'
      ? [
          ...segments(years(3).map((o, i) => (i === 3 ? { ...o, label: '3' } : o))),
          { value: '4', label: <bdi dir="ltr" className="whitespace-nowrap">{t('years.range', { from: '4', to: '5' })}</bdi> },
          ...segments([{ value: '6', label: t('years.plus', { n: '6' }) }]),
        ]
      : segments(years(3));
  const foreignValue = foreignScale === 'fsw' ? (profile.foreignWork >= 6 ? 6 : profile.foreignWork >= 4 ? 4 : profile.foreignWork) : Math.min(3, profile.foreignWork);

  return (
    <div className="grid gap-x-5 gap-y-5 @xl:grid-cols-2">
      {has('age') ? (
        <AgeSlider
          label={
            <>
              {t('field.age')}
              {tag('age')}
            </>
          }
          value={profile.age}
          onChange={(n) => set('age', n)}
          format={(n) => (n >= 50 ? t('age.plus', { count: 50 }) : t('age.value', { count: n }))}
          inputRef={fieldRef?.('age')}
          className="@xl:col-span-2"
        />
      ) : null}
      {has('education') ? (
        <Choice
          label={
            <>
              {t('field.education')}
              {tag('education')}
            </>
          }
          hint={t('field.educationHint')}
          controlRef={fieldRef?.('education')}
          value={profile.education}
          onChange={(v) => set('education', v)}
          options={eduOptions}
        />
      ) : null}
      {has('language') ? (
        // Subgrid: both labels share one row and both selects the next. In a narrow column the "Assumed" tag
        // would wrap under its label and leave the pair ragged, so there it leads the hint line instead.
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-3">
          <Choice
            className="row-span-2 grid grid-rows-subgrid gap-y-1.5"
            label={t('field.testLanguage')}
            value={profile.firstLanguage}
            onChange={(v) => set('firstLanguage', v)}
            options={[
              { value: 'en', label: t('lang.en') },
              { value: 'fr', label: t('lang.fr') },
            ]}
          />
          <Choice
            className="row-span-2 grid grid-rows-subgrid gap-y-1.5"
            label={
              <>
                {t('field.level')}
                {assumed.includes('firstClb') ? <AssumedTag className="ms-2 @max-md:hidden" /> : null}
              </>
            }
            controlRef={fieldRef?.('language')}
            value={String(profile.firstClb)}
            onChange={(v) => set('firstClb', Number(v))}
            options={clbOptions}
          />
          <p className="col-span-2 m-0 -mt-1.5 text-[12.5px] leading-snug text-ink-3">
            {assumed.includes('firstClb') ? <AssumedTag className="me-2 @md:hidden" /> : null}
            {t('field.levelHint')}
          </p>
        </div>
      ) : null}
      {has('secondLanguage') ? (
        <Choice
          label={
            <>
              {t('field.secondLevel', { lang: t(profile.firstLanguage === 'fr' ? 'langLower.en' : 'langLower.fr') })}
              {tag('secondClb')}
            </>
          }
          hint={t('field.secondLevelHint')}
          value={String(profile.secondClb)}
          onChange={(v) => set('secondClb', Number(v))}
          options={clbOptions}
        />
      ) : null}
      {has('occupation') ? (
        <Choice
          label={
            <>
              {t('field.occupation')}
              {tag('occupation')}
            </>
          }
          hint={t('field.occupationHint')}
          value={profile.occupation}
          onChange={(v) => set('occupation', v)}
          options={(['teer01', 'teer23', 'trade', 'other'] as const).map((o) => ({ value: o, label: t(`occ.${o}`) }))}
        />
      ) : null}
      {has('canadianWork') ? (
        <SegField label={t('field.canadianWork')} tag={assumed.includes('canadianWork') ? <AssumedTag className="shrink-0" /> : null} groupRef={fieldRef?.('work')}>
          <Segmented label={t('field.canadianWork')} value={String(profile.canadianWork)} onChange={(v) => set('canadianWork', Number(v))} options={segments(years(5))} />
        </SegField>
      ) : null}
      {has('foreignWork') ? (
        <SegField label={t('field.foreignWork')} tag={assumed.includes('foreignWork') ? <AssumedTag className="shrink-0" /> : null}>
          <Segmented label={t('field.foreignWork')} value={String(foreignValue)} onChange={(v) => set('foreignWork', Number(v))} options={foreignOptions} />
        </SegField>
      ) : null}
      {has('canadianEducation') ? (
        <SegField label={t('field.canadianEducation')}>
          <Segmented
            label={t('field.canadianEducation')}
            value={profile.canadianEducation}
            onChange={(v) => set('canadianEducation', v)}
            options={(['none', 'short', 'two', 'long'] as CanadianEducation[]).map((v) => ({
              value: v,
              // Short visible label so the 4 segments never wrap (French "3 ans et plus"); full text for screen readers.
              label:
                v === 'long' ? (
                  <>
                    <bdi aria-hidden>{t('cedu.longShort')}</bdi>
                    <span className="sr-only">{t('cedu.long')}</span>
                  </>
                ) : (
                  <bdi>{t(`cedu.${v}`)}</bdi>
                ),
            }))}
          />
        </SegField>
      ) : null}

      <div className="flex flex-col divide-y divide-hair rounded-tile border border-hair px-4 @xl:col-span-2">
        {has('spouse') ? (
          <Toggle className="py-2" label={t('field.spouse')} description={t('field.spouseHint')} checked={profile.spouse} onChange={(v) => set('spouse', v)} />
        ) : null}
        {has('spouse') && profile.spouse ? (
          <div className="grid gap-3 py-3 @xl:grid-cols-2">
            <Choice className="@xl:col-span-2" label={t('field.spouseEducation')} value={profile.spouseEducation} onChange={(v) => set('spouseEducation', v)} options={eduOptions} />
            <Choice label={t('field.spouseLevel')} value={String(profile.spouseClb)} onChange={(v) => set('spouseClb', Number(v))} options={clbOptions} />
            <Choice label={t('field.spouseWork')} value={String(profile.spouseCanadianWork)} onChange={(v) => set('spouseCanadianWork', Number(v))} options={years(5)} />
          </div>
        ) : null}
        {has('jobOffer') ? <Toggle className="py-2" label={t('field.jobOffer')} description={t('field.jobOfferHint')} checked={profile.jobOffer} onChange={(v) => set('jobOffer', v)} /> : null}
        {has('certificate') ? (
          <Toggle className="py-2" label={t('field.certificate')} description={t('field.certificateHint')} checked={profile.certificate} onChange={(v) => set('certificate', v)} />
        ) : null}
        {has('sibling') ? <Toggle className="py-2" label={t('field.sibling')} description={t('field.siblingHint')} checked={profile.sibling} onChange={(v) => set('sibling', v)} /> : null}
        {has('relative') ? (
          <Toggle
            className="py-2"
            label={t('field.relative')}
            description={t('field.relativeHint')}
            checked={profile.relative || profile.sibling}
            onChange={(v) => onChange({ ...profile, relative: v, sibling: v ? profile.sibling : false })}
          />
        ) : null}
        {has('nomination') ? (
          <Toggle className="py-2" label={t('field.nomination')} description={t('field.nominationHint')} checked={profile.nomination} onChange={(v) => set('nomination', v)} />
        ) : null}
      </div>
    </div>
  );
}
