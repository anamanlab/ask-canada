'use client';
/**
 * What the person told us vs what we filled in. Both Express Entry widgets use this so that nobody gets a
 * score or an eligibility verdict built on answers they never gave:
 *  - `useAnswers` tracks the profile plus which answers were given (by the tool input or by editing).
 *  - `AnswersNeeded` is the neutral "Tell us about you" hero shown until age, education, language and work are known.
 *  - `useFieldTargets` lets each "still needed" chip jump to (scroll to and focus) its control in the editor.
 *  - `AssumedNote` lists, in words, every answer we assumed ("We assumed age 29 and no work outside Canada").
 *  - `useProfileSummary` writes the key answers on one line (under "Your answers" while it is closed).
 *  - `useEarlierAnswers` finds answers the person already gave (to the other widget in this conversation, or
 *    saved with their score) so `AnswersNeeded` can offer them back instead of asking again.
 *  - `useProfileQuestion` writes the answers out in a follow-up question, so the next answer starts from them.
 */
import { useRef, useState } from 'react';
import { ArrowDown, Check, History } from 'lucide-react';
import { Button, LiveRegion } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { prefersReducedMotion } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { assumedFields, changedKeys, missingAnswers, normalizeProfile, REQUIRED_ANSWERS, type AssumedField, type Profile, type RequiredAnswer } from './crs';
import { useRememberedAnswers, useShareAnswers, type EarlierAnswers, type Pinned } from './earlier';
import messages from './messages';
import { profileQuestion, type QuestionKey } from './parse';
import { Eyebrow, Hero } from './Shared';

/** A score saved on this device ("Save my score"), with the answers behind it and which of them the person gave. */
export type SavedScore = { score: number; profile: Profile; given?: (keyof Profile)[] };
export const SAVED_SCORE_KEY = 'immigration:crs';
/** The answers an older save (without `given`) is taken to carry: everything the result depends on. */
const SAVED_KEYS: (keyof Profile)[] = ['age', 'education', 'firstLanguage', 'firstClb', 'secondClb', 'canadianWork', 'foreignWork', 'occupation'];

export function useAnswers(initial: Profile, initialGiven: (keyof Profile)[], scope: 'crs' | 'eligibility', pinned?: Pinned) {
  // Profile and "given" travel together, so the pair shared with the conversation's memory has a stable identity.
  const [answers, setAnswers] = useState<EarlierAnswers>({ profile: initial, given: initialGiven });
  const { profile, given } = answers;
  const [confirmed, setConfirmed] = useState(false);
  const add = (g: (keyof Profile)[], keys: (keyof Profile)[]) => (keys.every((k) => g.includes(k)) ? g : [...new Set([...g, ...keys])]);
  // Functional updates: the editor reports an answer as a change and as "given" in the same event.
  const setProfile = (next: Profile) => setAnswers((a) => ({ profile: next, given: add(a.given, changedKeys(a.profile, next)) }));
  const touch = (keys: (keyof Profile)[]) => setAnswers((a) => (add(a.given, keys) === a.given ? a : { ...a, given: add(a.given, keys) }));
  const missing = missingAnswers(given);
  const complete = missing.length === 0;
  // Once the key answers are in, the other Express Entry widget in this conversation can offer them back.
  useShareAnswers(complete && !pinned ? answers : null);
  /** Takes over answers given elsewhere; what the person already said here wins. */
  const adopt = (from: { profile: Profile; given: (keyof Profile)[] }) => {
    const fresh = from.given.filter((k) => !given.includes(k));
    setAnswers({ profile: { ...profile, ...Object.fromEntries(fresh.map((k) => [k, from.profile[k]])) }, given: [...given, ...fresh] });
  };
  return {
    profile,
    setProfile,
    touch,
    adopt,
    given,
    missing,
    assumed: assumedFields(given, scope),
    ready: confirmed || missing.length === 0,
    confirm: () => setConfirmed(true),
  };
}
export type Answers = ReturnType<typeof useAnswers>;

/** "29 years old · Bachelor’s degree · CLB 9 · 1 year in Canada": the answers that drive the result, on one line. */
export function useProfileSummary() {
  const t = useMessages(messages);
  return (profile: Profile, opts: { secondLanguage?: boolean } = {}) =>
    [
      t('age.value', { count: profile.age }),
      t(`edu.${profile.education}`),
      profile.firstClb ? t('clb.option', { n: String(profile.firstClb) }) : t('clb.none'),
      ...(opts.secondLanguage && profile.secondClb > 0 ? [t('summary.secondLanguage', { n: String(profile.secondClb), lang: profile.firstLanguage === 'fr' ? 'en' : 'fr' })] : []),
      t('summary.canadianWork', { count: profile.canadianWork }),
      ...(profile.foreignWork > 0 ? [t('summary.foreignWork', { count: profile.foreignWork })] : []),
    ].join(' · ');
}

export type Earlier = { profile: Profile; given: (keyof Profile)[]; from: 'earlier' | 'saved' };

/**
 * Answers the person already gave that would fill in what is still missing here: first the ones from this
 * conversation (the other Express Entry widget), then the ones saved with their score. `null` when there is
 * nothing new to offer. `profile` is what the answers here would become.
 */
export function useEarlierAnswers(profile: Profile, given: readonly (keyof Profile)[], pinned?: Pinned): Earlier | null {
  const t = useMessages(messages);
  const remembered = useRememberedAnswers();
  const [saved] = useDeviceItem<SavedScore>(SAVED_SCORE_KEY, { label: t('crs.saved.label'), kind: 'plan' });
  const missing = missingAnswers(given).length;
  if (!missing) return null;
  const sources: Earlier[] = pinned
    ? pinned.earlier
      ? [{ ...pinned.earlier, from: 'earlier' }]
      : []
    : [
        ...(remembered ? [{ ...remembered, from: 'earlier' as const }] : []),
        ...(saved?.profile ? [{ profile: normalizeProfile(saved.profile), given: saved.given ?? SAVED_KEYS, from: 'saved' as const }] : []),
      ];
  const hit = sources.find((s) => missingAnswers([...given, ...s.given]).length < missing);
  if (!hit) return null;
  const fresh = hit.given.filter((k) => !given.includes(k));
  return { from: hit.from, given: hit.given, profile: { ...profile, ...Object.fromEntries(fresh.map((k) => [k, hit.profile[k]])) } };
}

/** `profileQuestion` (parse.ts) with this widget's messages: the follow-up question with the answers written out. */
export function useProfileQuestion() {
  const t = useMessages(messages);
  return (key: QuestionKey, profile: Profile, given: readonly (keyof Profile)[]) => profileQuestion(t, key, profile, given);
}

/**
 * The control behind each key answer, registered by the editor through a callback ref, so a chip in the hero can
 * scroll to it and move focus there (no DOM queries).
 */
export function useFieldTargets() {
  const targets = useRef<Partial<Record<RequiredAnswer, HTMLElement | null>>>({});
  return {
    register: (r: RequiredAnswer) => (el: HTMLElement | null) => {
      targets.current[r] = el;
    },
    jump: (r: RequiredAnswer) => {
      const el = targets.current[r];
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      el.focus({ preventScroll: true });
    },
  };
}

/**
 * Amber hero: which of the 4 key answers we still need, and a way to go on with the answers shown. Each missing
 * answer is a button that jumps to its control; answered ones are plain text. Only the progress line is live.
 */
export function AnswersNeeded({
  title,
  body,
  missing,
  earlier,
  onUseEarlier,
  onConfirm,
  onJump,
}: {
  title: string;
  body: string;
  missing: RequiredAnswer[];
  /** Answers given earlier that fill in what is missing: offered back with one button. */
  earlier?: Earlier | null;
  onUseEarlier?: () => void;
  onConfirm: () => void;
  onJump: (r: RequiredAnswer) => void;
}) {
  const t = useMessages(messages);
  const summary = useProfileSummary();
  const done = REQUIRED_ANSWERS.length - missing.length;
  return (
    <Hero tone="amber">
      <Eyebrow className="text-amber">{t('need.eyebrow')}</Eyebrow>
      <p className="m-0 mt-2 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{title}</p>
      <p className="m-0 mt-1.5 max-w-[58ch] text-[14.5px] leading-snug text-ink-2">{body}</p>
      <LiveRegion text={t('need.progress', { done, total: REQUIRED_ANSWERS.length })} delay={400} />
      <ul className="m-0 mt-4 flex list-none flex-wrap items-center gap-x-2 gap-y-3 p-0">
        {REQUIRED_ANSWERS.map((r) => {
          const ok = !missing.includes(r);
          return (
            <li key={r} className="flex">
              {ok ? (
                <span className="inline-flex min-h-8 items-center gap-1.5 px-2 text-[13px] font-medium text-pine">
                  <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
                  {t(`need.item.${r}`)}
                  <span className="sr-only">{t('need.done')}</span>
                </span>
              ) : (
                // 32px pill, 44px hit area (the row gap leaves room for it).
                <button
                  type="button"
                  onClick={() => onJump(r)}
                  aria-label={t('need.jump', { item: t(`need.item.${r}`) })}
                  className="group relative inline-flex min-h-8 items-center gap-1.5 rounded-chip border border-hair-2 bg-card px-3 text-[13px] font-medium text-ink shadow-sm transition-[border-color,box-shadow] duration-200 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hover:border-ink-3 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
                >
                  <span className="size-2 rounded-full border-[1.5px] border-amber" aria-hidden />
                  {t(`need.item.${r}`)}
                  <ArrowDown className="size-3.5 text-ink-3 transition-colors group-hover:text-ink" strokeWidth={2.2} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {earlier ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-tile border border-hair bg-card px-4 py-3 shadow-sm">
          <p className="m-0 min-w-[16ch] flex-1 text-[14px] leading-snug text-ink">
            <span className="block text-[12.5px] text-ink-3">{t(`need.earlier.${earlier.from}`)}</span>
            <bdi className="font-medium">{summary(earlier.profile)}</bdi>
          </p>
          <Button size="md" variant="primary" icon={History} className="@max-md:w-full" onClick={onUseEarlier}>
            {t('need.earlier.use')}
          </Button>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button size="md" variant="secondary" className="@max-md:w-full" onClick={onConfirm}>
          {t('need.confirm')}
        </Button>
        <span className="text-[12.5px] leading-snug text-ink-3">{t('need.confirmNote')}</span>
      </div>
    </Hero>
  );
}

/** "We assumed age 29, a bachelor’s degree and no work outside Canada. Change any answer below." */
export function AssumedNote({ profile, assumed, className }: { profile: Profile; assumed: AssumedField[]; className?: string }) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  if (!assumed.length) return null;
  const other = t(profile.firstLanguage === 'fr' ? 'langLower.en' : 'langLower.fr');
  const first = t(profile.firstLanguage === 'fr' ? 'langLower.fr' : 'langLower.en');
  const item = (f: AssumedField) => {
    switch (f) {
      case 'age':
        return t('assumed.age', { age: profile.age });
      case 'education':
        return t('assumed.education', { edu: profile.education });
      case 'firstClb':
        return profile.firstClb ? t('assumed.clb', { n: String(profile.firstClb), lang: first }) : t('assumed.noTest', { lang: first });
      case 'secondClb':
        return profile.secondClb ? t('assumed.clb', { n: String(profile.secondClb), lang: other }) : t('assumed.noTest', { lang: other });
      case 'canadianWork':
        return t('assumed.canadianWork', { count: profile.canadianWork });
      case 'foreignWork':
        return t('assumed.foreignWork', { count: profile.foreignWork });
      case 'occupation':
        return t('assumed.occupation', { occ: profile.occupation });
    }
  };
  let list: string;
  try {
    list = new Intl.ListFormat(intl, { type: 'conjunction' }).format(assumed.map(item));
  } catch {
    list = assumed.map(item).join(', ');
  }
  return (
    <p className={cn('m-0 flex items-start gap-2 text-[13px] leading-snug text-ink-2', className)}>
      <span className="mt-[5px] size-2 shrink-0 rounded-full bg-amber" aria-hidden />
      <span>{t('assumed.note', { list })}</span>
    </p>
  );
}
