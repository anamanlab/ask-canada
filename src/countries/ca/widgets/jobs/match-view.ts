/**
 * The career matcher's view model (pure): which chips to show and which occupations they rank, for what the
 * person told the assistant or for a resume read on the device. Matcher.tsx renders the result.
 */
import { fold, type Lang } from './data';
import { chipLabel, displayTerm } from './text';
import type { MatchOutput, OccupationMatch } from './types';

/** The scoring code (./match.ts), downloaded only when a chip is switched off or a resume arrives. */
export type Engine = typeof import('./match');
type SkillChip = { key: string; label: string; known: boolean; years?: number };
type MatchView = { chips: SkillChip[]; matches: OccupationMatch[] };

/** Chips shown for a resume: the strongest skills found, after its job titles. */
const RESUME_SKILLS = 16;
const MATCHES = 5;

/** What the person said, in their words, once each; ones we didn't recognise stay too (dimmed). */
function chatChips(given: MatchOutput['given'], known: Set<string>): SkillChip[] {
  const seen = new Set<string>();
  return [...given.titles, ...given.skills].flatMap((label) => {
    const key = fold(label);
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        key,
        label,
        known: known.has(key),
        // "retail · 3 years": the time spent, on the one line of work it belongs to.
        years: given.years && given.titles.length === 1 && label === given.titles[0] ? given.years : undefined,
      },
    ];
  });
}

/** Chips and ranked occupations for what the person told the assistant. Without the engine: the tool's own matches. */
export function chatView(engine: Engine | null, data: MatchOutput, off: Set<string>, lang: Lang): MatchView {
  const { given } = data;
  const said = [...given.titles, ...given.skills];
  const raw = engine?.scoreText(said.join(' | '), { years: given.years });
  const chips = chatChips(given, new Set(given.known ?? (engine && raw ? engine.knownTerms(said, raw) : said.map(fold))));
  // Titles and links follow the interface language, even when the answer came in the other one.
  if (!engine || !raw) return { chips, matches: data.matches.map((m) => ({ ...m, title: m.titles?.[lang] ?? m.title, searchUrl: m.searchUrls?.[lang] ?? m.searchUrl })) };
  // Same selection as the tool: strong fits first, and a named skill keeps a path outside their field.
  const signals = { years: given.years, named: given.skills.filter((s) => !off.has(fold(s))) };
  const scored = off.size ? engine.scoreText(said.filter((s) => !off.has(fold(s))).join(' | '), signals) : raw;
  return { chips, matches: engine.toMatches(scored, lang, data.province, MATCHES, signals) };
}

/** Chips (job titles, then skills) and ranked occupations for a resume read on the device. */
export function resumeView(engine: Engine, text: string, data: MatchOutput, off: Set<string>, lang: Lang): MatchView {
  const raw = engine.scoreText(text);
  const titles = engine.detectedTitles(raw);
  const skills = engine.detectedSkills(raw, RESUME_SKILLS);
  // "Forklift" is already said by the "Forklift operator" chip: a skill inside a job title found gets no chip of its own.
  const within = (skill: string, title: string) => ` ${title} `.includes(` ${skill} `);
  const keys = [...new Set([...titles, ...skills.filter((s) => !titles.some((title) => within(s, title)))])];
  // A chip switched off counts for no occupation, whether it is a job title or a skill (and a title takes the skills inside it along).
  const omit = new Set([...off, ...skills.filter((s) => titles.some((title) => off.has(title) && within(s, title)))]);
  const scored = off.size ? engine.scoreText(text, { omit }) : raw;
  return { chips: keys.map((key) => ({ key, label: chipLabel(displayTerm(text, key)), known: true })), matches: engine.toMatches(scored, lang, data.province, MATCHES) };
}
