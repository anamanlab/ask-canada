/**
 * Scripted scenarios for the `veterans-defence` widget (EN + FR). Facts: widgets/veterans-defence/data.ts
 * (verified 2026-09-30). Tool calls are real: CAF careers come live from forces.ca.
 * The copy lives next to the widget: widgets/veterans-defence/scenario-copy/{join,vac}.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { CHECKED } from '../widgets/veterans-defence/data';
import { joinScenarios } from '../widgets/veterans-defence/scenario-copy/join';
import { uni } from '../widgets/veterans-defence/scenario-copy/shared';
import { vacScenarios } from '../widgets/veterans-defence/scenario-copy/vac';

const veteransDefence: Scenario[] = [...joinScenarios, ...vacScenarios];

/** Phone numbers never break across lines ("9-8-" / "8"): use non-breaking hyphens (U+2011). */
const keepPhones = (t: string) => t.replace(/\b(?:1-\d{3}-\d{3}-\d{4}|9-8-8)\b/g, (m) => m.replace(/-/g, '\u2011'));

for (const s of veteransDefence) {
  // Citations in the reply carry the same verified date as the tool's sources (not the pack default).
  s.checked = CHECKED;
  s.match = s.match.map(uni);
  if (s.exclude) s.exclude = s.exclude.map(uni);
  s.reply = { en: keepPhones(s.reply.en), fr: keepPhones(s.reply.fr) };
}

export default veteransDefence;
