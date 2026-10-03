/**
 * Starter-question aliases for the scripted engine (core, server only).
 *
 * The interface offers starter questions (hero chips, the service directory, the flag example) in every
 * translated language. The scripted engine matches intents with patterns in the pack's official languages,
 * so a translated starter in a language the pack has no patterns for is mapped back to its English original
 * by catalog key: same key, same intent. The answer still opens in the person's language (see engine BRIDGE)
 * and never depends on hand-written patterns per language.
 */
import 'server-only';
import { packServer as pack } from '@/countries/active.server';
import { normalizeQuestion } from './engine';

const STARTER_KEY = /^(chip\.[^.]+\.q|services\.[^.]+\.starter|flag\.demo\.q)$/;

let cache: Promise<Map<string, string>> | null = null;

export function starterAliases(): Promise<Map<string, string>> {
  cache ??= (async () => {
    const map = new Map<string, string>();
    const en = (await pack.messages.en()).default;
    // Official languages are matched by the scenarios' own patterns, so only the others need mapping.
    const foreign = new Set<string>(['en', ...pack.locales.official]);
    for (const [locale, load] of Object.entries(pack.messages)) {
      if (foreign.has(locale) || !load) continue;
      try {
        const messages = (await load()).default;
        for (const [key, text] of Object.entries(messages)) {
          if (STARTER_KEY.test(key) && en[key]) map.set(normalizeQuestion(text), en[key]);
        }
      } catch {
        /* a missing catalog only means no aliases for that language */
      }
    }
    return map;
  })();
  return cache;
}
