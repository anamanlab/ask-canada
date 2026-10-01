/**
 * The finder's answers as one reducer state: the profile, which answers are the person's own (the rest are shown
 * as assumed), and whether the children's ages are known. Also the shape saved on the device and how it loads back.
 */
import { DEFAULT_PROFILE, withAnswers, type Profile } from '../calc';
import type { FinderOutput } from '../build';
import type { Known } from './look';

/** The answer each profile field belongs to: changing it makes that answer the person's own. */
const KNOWN_BY: [field: keyof Profile, answer: keyof Known][] = [
  ['household', 'household'],
  ['age', 'age'],
  ['childrenUnder6', 'kids'],
  ['children6to17', 'kids'],
  ['income', 'income'],
  ['workIncome', 'work'],
];

/**
 * Whether we know how old the children are. `unknown`: a count was given without ages, so the results ask;
 * `prompt`: answered in that one question (it stays, marked done); `form`: set or seen in the questionnaire
 * (the question goes: the two child counters there are the answer).
 */
export type Ages = 'given' | 'unknown' | 'prompt' | 'form';

/** The answers, which of them are the person's own, and the children's ages: one state, so each change derives from the last. */
export type Answers = { profile: Profile; known: Known; ages: Ages };

/** What "Save my answers" keeps on the device: the answers and which of them were the person's own. No identifiers. */
export type Saved = Profile & { given?: Known };

export type Change =
  | { type: 'answer'; patch: Partial<Profile> }
  | { type: 'under6'; count: number }
  | { type: 'reviewed' }
  /** "Use my saved answers": the saved profile, with whatever this question said on top of it. */
  | { type: 'load'; saved: Saved; said: Partial<Profile> };

const ALL_KNOWN: Known = { household: true, age: true, kids: true, income: true, work: true };

function knownFrom(answered: string[]): Known {
  const a = new Set(answered);
  return {
    household: a.has('household'),
    age: a.has('age'),
    kids: a.has('childrenUnder6') || a.has('children6to17') || a.has('children'),
    income: a.has('income') || a.has('workIncome'),
    work: a.has('workIncome'),
  };
}

export const initialAnswers = (d: FinderOutput): Answers => ({ profile: d.profile, known: knownFrom(d.answered), ages: d.kidsAgesUnknown ? 'unknown' : 'given' });

/** The fields this question gave (a count of children without ages is not one: the saved answers have the ages). */
export function saidIn(d: FinderOutput): Partial<Profile> {
  const said: Partial<Profile> = {};
  for (const key of d.answered) if (key in DEFAULT_PROFILE || key === 'jobEarnings' || key === 'province') Object.assign(said, { [key]: d.profile[key as keyof Profile] });
  return said;
}

/** Saved answers are read back from storage: make sure they still have the shape this version works with. */
export function isSaved(v: unknown): v is Saved {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  const count = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  return (
    (p.household === 'single' || p.household === 'couple') &&
    ['under-19', '19-59', '60-64', '65-74', '75-plus'].includes(p.age as string) &&
    [p.childrenUnder6, p.children6to17, p.income, p.workIncome, p.childDisability, p.yearsInCanada].every(count)
  );
}

export function answers(state: Answers, change: Change): Answers {
  const { profile, known, ages } = state;
  switch (change.type) {
    case 'answer': {
      const { patch } = change;
      // Changing an answer makes it the person's own.
      const nextKnown = KNOWN_BY.reduce((n, [field, answer]) => (patch[field] !== undefined && !n[answer] ? { ...n, [answer]: true } : n), known);
      const setsAges = patch.childrenUnder6 !== undefined || patch.children6to17 !== undefined;
      // The work share follows the income until they have set it themselves (as it stood before this change).
      return { profile: withAnswers(profile, patch, known.work), known: nextKnown, ages: setsAges && ages !== 'given' ? 'form' : ages };
    }
    case 'under6': {
      const kids = profile.childrenUnder6 + profile.children6to17;
      const under6 = Math.min(Math.max(change.count, 0), kids);
      return { ...state, profile: { ...profile, childrenUnder6: under6, children6to17: kids - under6 }, ages: 'prompt' };
    }
    case 'reviewed':
      // They've seen every answer on the form, both child counters included: nothing is assumed any more, except
      // an income they never set (it stays "not given", so no amounts are made up) and the work share that
      // depends on it.
      return { profile, known: { household: true, age: true, kids: true, income: known.income, work: known.income }, ages: ages === 'given' ? ages : 'form' };
    case 'load': {
      const { given, ...saved } = change.saved;
      // Answers saved before `given` existed were all confirmed on the form.
      const was = given ?? ALL_KNOWN;
      const said = change.said;
      const next: Profile = { ...DEFAULT_PROFILE, ...saved, ...said };
      next.workIncome = Math.min(next.workIncome, next.income);
      return {
        profile: next,
        known: {
          household: was.household || said.household !== undefined,
          age: was.age || said.age !== undefined,
          kids: was.kids || said.childrenUnder6 !== undefined || said.children6to17 !== undefined,
          income: was.income || said.income !== undefined,
          work: was.work || said.workIncome !== undefined,
        },
        ages: 'given',
      };
    }
  }
}
