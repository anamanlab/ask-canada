/**
 * Practice test: the types and the seeded shuffle, shared by the tool (server) and the widget (client).
 * The question bank itself lives in quiz-bank.ts and stays out of the widget's first download: the tool
 * sends the picked questions in both languages, and the widget fetches the bank only to draw a new set.
 *
 * Both the question order and the order of the choices are shuffled from a seed (`choiceOrder`), the same
 * way in EN and FR, so the right answer isn't always in the same spot. True/false and year-only choices
 * keep their order.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { TEST, ChapterId, Lang } from './data';

export type Topic = 'rights' | 'history' | 'government' | 'symbols' | 'geography';
export const TOPICS: Topic[] = ['rights', 'history', 'government', 'symbols', 'geography'];

type B = { en: string; fr: string };
export type Question = {
  id: string;
  topic: Topic;
  chapter: ChapterId;
  q: B;
  /** Choices in both languages, same order. True/false questions have 2 choices. */
  choices: { en: string[]; fr: string[] };
  answer: number;
  why: B;
};

export const TF = { en: ['True', 'False'], fr: ['Vrai', 'Faux'] };

export type QuizOutput = {
  version: 1;
  lang: Lang;
  topic: Topic | 'all';
  /** Shuffles the question order and each question's choices (see `choiceOrder`). */
  seed: number;
  ids: string[];
  /** The picked questions in both languages, for the screen (kept out of the model's context). */
  items?: Question[];
  /** The questions in the answer's language, so the assistant can talk about them. */
  questions: { id: string; question: string; choices: string[]; answer: string; explanation: string; source: string }[];
  test: typeof TEST;
  available: Record<Topic | 'all', number>;
  sources: ToolSource[];
};

/** Small deterministic PRNG so a set can be reproduced (lab, screenshots, "retry this set"). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string, to give each question its own shuffle from one seed. */
const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

/** Choices that read best in a fixed order: true/false, and lists of years (kept ascending). */
const keepsOrder = (q: Question) => q.choices.en.length < 3 || q.choices.en.every((c) => /^\d{4}$/.test(c));

/**
 * Display order of a question's choices for a seed: a permutation of the original indexes
 * (display position -> index in `choices`). Same permutation for EN and FR.
 */
export function choiceOrder(q: Question, seed: number): number[] {
  const order = q.choices.en.map((_, i) => i);
  if (keepsOrder(q)) return order;
  const rand = mulberry32((seed ^ hash(q.id)) >>> 0);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
