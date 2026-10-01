/**
 * Scripted scenarios for the `transport` widget (EN + FR). Facts and URLs: widgets/transport/data.ts.
 * Tool calls really run (live Transport Canada data where available). Copy per topic lives in
 * widgets/transport/scenario-copy/, the follow-up chips in widgets/transport/scenario-chips.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { withChips } from '../widgets/transport/scenario-chips';
import { boatingScenario } from '../widgets/transport/scenario-copy/boating';
import { droneScenario } from '../widgets/transport/scenario-copy/drone';
import { evScenario } from '../widgets/transport/scenario-copy/ev';
import { recallsScenario } from '../widgets/transport/scenario-copy/recalls';
import { frType } from '../widgets/transport/scenario-copy/text';
import { cannabisScenario, petsScenario } from '../widgets/transport/scenario-copy/travel';

const base: Scenario[] = [recallsScenario, droneScenario, boatingScenario, cannabisScenario, petsScenario, evScenario];

/** French typography on every French string: the reply, the French vars (…Fr) and the chips. */
function typeset(s: Scenario): Scenario {
  const vars = s.vars;
  return {
    ...s,
    reply: { ...s.reply, fr: frType(s.reply.fr) },
    followUps: s.followUps && { ...s.followUps, fr: s.followUps.fr.map(frType) },
    vars:
      vars &&
      (async (ctx) => {
        const v = await vars(ctx);
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k.endsWith('Fr') ? frType(x) : x]));
      }),
  };
}

const transport: Scenario[] = withChips(base).map(typeset);

export default transport;
