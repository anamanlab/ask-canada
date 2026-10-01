/** "Ask next" chips for the scripted travel answers: written as the person would ask, about the place they named. */
import { findCountry } from '../countries';
import { frIn } from '../fr';
import type { Lang } from '../types';

/** "the United States", "the Bahamas", "Japan": English names that read with an article in a sentence. */
const enThe = (name: string) =>
  /^(united |dominican republic|netherlands|philippines|bahamas|maldives|gambia|comoros|seychelles|solomon|marshall|cayman|falkland|turks|british|faroe|cook islands|central african|democratic|republic|czech|vatican|holy see|azores|canary)/i.test(name)
    ? `the ${name}`
    : name;

type Ask = 'safe' | 'register' | 'help' | 'duty' | 'waits';
/** One "Ask next" question, written as the person would ask it, about the destination they named (if any). */
function ask(k: Ask, lang: Lang, name = ''): string {
  const fr = lang === 'fr';
  if (k === 'safe') return fr ? `Est-ce sécuritaire de voyager ${frIn(name)} en ce moment?` : `Is it safe to travel to ${enThe(name)} right now?`;
  // With a place, the question keeps it, so the next answer is about the same trip (Mexico's 911, its offices).
  if (k === 'register') return fr ? `Comment inscrire mon voyage${name ? ` ${frIn(name)}` : ''}?` : `How do I register my trip${name ? ` to ${enThe(name)}` : ''}?`;
  if (k === 'help')
    return fr
      ? `Qui peut m’aider si j’ai un problème ${name ? frIn(name) : 'à l’étranger'}?`
      : `Who do I call if something goes wrong ${name ? `in ${enThe(name)}` : 'abroad'}?`;
  if (k === 'duty') return fr ? 'Combien puis-je rapporter en franchise?' : 'How much can I bring back duty-free?';
  return fr ? 'Quels sont les temps d’attente à la frontière?' : 'What are the border wait times right now?';
}

/**
 * "Ask next" chips that follow the question: after "My passport was stolen in Japan", "Is it safe to travel
 * to Japan right now?", never another country. `named` lists the chips when a destination is named (its
 * `safe` chip is about that place); `none` when it isn't, destination-neutral.
 */
function followUps(named: Ask[], none: Ask[]) {
  const pick = (text: string, lang: Lang) => {
    const row = findCountry(text);
    const name = row ? (lang === 'fr' ? row[2] : row[1]) : '';
    return (name ? named : none).map((k) => ask(k, lang, name));
  };
  return {
    // Runs with the tool calls, so it sees the question; the chat shows the first suggestFollowUps it gets.
    call: { toolName: 'suggestFollowUps', input: ({ text, lang }: { text: string; lang: Lang }) => ({ questions: pick(text, lang) }) },
    // The destination-neutral set, for checks that read scenarios statically (scripts/check-scenarios.mjs).
    static: { en: none.map((k) => ask(k, 'en')), fr: none.map((k) => ask(k, 'fr')) },
  };
}
export const FU = {
  safety: followUps(['help', 'duty', 'register'], ['help', 'duty', 'waits']),
  entry: followUps(['register', 'help', 'duty'], ['register', 'help', 'duty']),
  lost: followUps(['safe', 'register', 'help'], ['register', 'help', 'duty']),
  emergency: followUps(['safe', 'register', 'duty'], ['register', 'duty', 'waits']),
  duty: followUps(['waits', 'safe', 'register'], ['waits', 'register', 'help']),
  register: followUps(['help', 'duty', 'waits'], ['help', 'duty', 'waits']),
};
