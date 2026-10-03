/** Example country pack, server half: `./pack.ts` plus the model's country instructions, UI catalogs and showcase data. */
import 'server-only';
import type { CountryPack } from '@/lib/country/types';
import { pack } from './pack';

const HOLIDAYS = [
  { date: '2026-10-12', name: { en: 'Harvest Day', fr: 'Jour des récoltes' } },
  { date: '2026-12-25', name: { en: 'Winter Holiday', fr: 'Fête d’hiver' } },
  { date: '2027-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' } },
];

export const packServer: CountryPack = {
  ...pack,
  messages: { en: () => import('./messages/en.json'), fr: () => import('./messages/fr.json') },
  showcase: {
    factsChecked: '2026-09-29',
    holidays: HOLIDAYS,
    holidaysUrl: 'https://example.org/holidays',
    taxDeadline: { month: 4, day: 30, selfEmployedMonth: 6, selfEmployedDay: 15, url: 'https://example.org/taxes', source: 'example.org/taxes' },
  },
  systemPrompt: '## Country: Republic of Example\nA fictional country used to demonstrate country packs. Only cite example.org.',
};

export { HOLIDAYS };
export default packServer;
