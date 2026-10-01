/**
 * Practice questions for the citizenship test, written from the official study guide
 * "Discover Canada: The Rights and Responsibilities of Citizenship" (every answer is stated in the
 * chapter linked on the question; chapters read 2026-09-30). Our own wording, in the style of the
 * guide's sample questions. Only stable facts: no questions that depend on who holds an office today.
 *
 * Used by the tool (server). The widget imports this module on demand (`import('./quiz-bank')`) when the
 * person asks for a new set, so the bank isn't part of the widget's first download.
 */
import { TEST, chapterUrl, testSources, type Lang } from './data';
import { TOPICS, choiceOrder, mulberry32, type Question, type QuizOutput, type Topic } from './quiz';
import { RIGHTS } from './bank/rights';
import { GOVERNMENT } from './bank/government';
import { HISTORY } from './bank/history';
import { SYMBOLS } from './bank/symbols';
import { GEOGRAPHY } from './bank/geography';
import { PEOPLES } from './bank/peoples';
import { DEMOCRACY } from './bank/democracy';
import { TIMELINE } from './bank/history-timeline';
import { EMBLEMS } from './bank/emblems';
import { PROVINCES } from './bank/provinces';

/** Order matters: a seed always draws the same set. */
export const BANK: Question[] = [...RIGHTS, ...GOVERNMENT, ...HISTORY, ...SYMBOLS, ...GEOGRAPHY, ...PEOPLES, ...DEMOCRACY, ...TIMELINE, ...EMBLEMS, ...PROVINCES];

/**
 * Pick `count` questions (mixed across topics unless one is given), deterministic for a seed. Questions in
 * `exclude` (the set just answered) are left out, unless too few others remain to fill the set.
 */
export function pickQuestions(count: number, topic: Topic | 'all', seed: number, exclude: string[] = []): string[] {
  const rand = mulberry32(seed);
  const all = BANK.filter((q) => topic === 'all' || q.topic === topic);
  const fresh = all.filter((q) => !exclude.includes(q.id));
  const pool = fresh.length >= Math.min(count, all.length) ? fresh : all;
  const shuffled = [...pool].map((q) => ({ q, k: rand() })).sort((a, b) => a.k - b.k).map((x) => x.q);
  const n = Math.max(1, Math.min(count, shuffled.length));
  if (topic !== 'all') return shuffled.slice(0, n).map((q) => q.id);
  // Round-robin across topics so a short set still covers history, government, symbols…
  const byTopic = TOPICS.map((t) => shuffled.filter((q) => q.topic === t));
  const out: string[] = [];
  for (let i = 0; out.length < n; i++) {
    const list = byTopic[i % byTopic.length];
    const next = list.shift();
    if (next) out.push(next.id);
    if (byTopic.every((l) => l.length === 0)) break;
  }
  return out;
}

/** The bank's questions for these ids, in the same order (unknown ids are dropped). */
export const questionsFor = (ids: string[]): Question[] => ids.flatMap((id) => BANK.find((q) => q.id === id) ?? []);

/** A fresh set, for "new questions" and the full-length mock test in the widget: none of `exclude` when the bank allows. */
export const drawQuestions = (count: number, topic: Topic | 'all', seed: number, exclude?: string[]) =>
  questionsFor(pickQuestions(count, topic, seed, exclude));

export function buildQuiz(input: { count?: number; topic?: Topic | 'all'; seed?: number; lang?: Lang }): QuizOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const topic = input.topic && (input.topic === 'all' || TOPICS.includes(input.topic)) ? input.topic : 'all';
  const count = Math.max(5, Math.min(TEST.questions, Math.round(input.count ?? 10)));
  const seed = Number.isFinite(input.seed) ? Math.abs(Math.floor(input.seed!)) % 2_147_483_647 : 1;
  const items = drawQuestions(count, topic, seed);
  const available = { all: BANK.length } as Record<Topic | 'all', number>;
  TOPICS.forEach((t) => (available[t] = BANK.filter((q) => q.topic === t).length));
  return {
    version: 1,
    lang,
    topic,
    seed,
    ids: items.map((q) => q.id),
    items,
    questions: items.map((q) => ({
      id: q.id,
      question: q.q[lang],
      choices: choiceOrder(q, seed).map((i) => q.choices[lang][i]),
      answer: q.choices[lang][q.answer],
      explanation: q.why[lang],
      source: chapterUrl(q.chapter, lang),
    })),
    test: TEST,
    available,
    sources: testSources(lang),
  };
}
