import type { Scenario } from '@/lib/scripted/types';

export const scenarios: Scenario[] = [
  {
    id: 'holidays',
    match: [/holiday/i, /férié/i],
    reply: {
      en: '# The next public holiday is *Harvest Day*.\n\nHere are the next few. [1](https://example.org/holidays)',
      fr: '# Le prochain jour férié est le *Jour des récoltes*.\n\nVoici les prochains. [1](https://example.org/holidays)',
    },
    toolCalls: [{ toolName: 'holidaysNext', input: { count: 3 } }],
    followUps: { en: ['Is the tax office open?'], fr: ['Le bureau des impôts est-il ouvert?'] },
  },
  {
    id: 'fallback',
    match: [],
    reply: {
      en: '# I can help with services in the Republic of Example.\n\nTry asking about the next public holiday. [1](https://example.org)',
      fr: '# Je peux vous aider avec les services de la République d’Exemple.\n\nDemandez-moi le prochain jour férié. [1](https://example.org)',
    },
  },
];
