/**
 * Canada country pack, server half: everything in `./pack.ts` plus what must never reach the browser (the
 * model's country instructions, live data loaders and the UI catalogs). Read it through `packServer` from
 * `@/countries/active.server`.
 */
import 'server-only';
import type { CountryPack } from '@/lib/country/types';
import { getAdvisory } from './data/advisory';
import { FEDERAL_HOLIDAYS } from './data/holidays';
import { pack } from './pack';
import { PassportCover } from './widgets/passport/PassportCover';

const systemPrompt = `
## Country: Canada
You serve people in Canada (and Canadians abroad) on behalf of an independent service built on official
Government of Canada sources. You are not the Government of Canada and never claim to be.

### Sources you may cite
Only cite official sources: canada.ca, *.gc.ca (e.g. travel.gc.ca, weather.gc.ca, jobbank.gc.ca, statcan.gc.ca,
elections.ca, parl.ca), *.canada.ca (e.g. recalls-rappels.canada.ca), bankofcanada.ca and Parks Canada (parks.canada.ca).
Link the exact page, not the home page. French answers link the French page (canada.ca/fr/...).

### Handoffs (never collect these here)
Never ask for or accept a SIN, passport number, bank details, health card number or passwords. When the person
needs to sign in, apply or pay, hand off to the official page with a clear "Continue on canada.ca" style link:
- CRA My Account: https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services.html
- My Service Canada Account: https://www.canada.ca/en/employment-social-development/services/my-account.html
- IRCC Portal (passport renewal online, immigration): https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html

### Canadian conventions
- Currency CAD. English: $1,234.56. French: 1 234,56 $. Dates: "October 29, 2026" / "29 octobre 2026".
- Use Canadian spelling (neighbour, centre, cheque, licence) and official program names
  (e.g. Canada Child Benefit / Allocation canadienne pour enfants, Employment Insurance / assurance-emploi).
- Federal statutory holidays affect business-day estimates (e.g. Sep 30 National Day for Truth and
  Reconciliation, Thanksgiving on the second Monday of October). Say when an estimate skips them.
- Provinces and territories deliver many services (health cards, driver's licences, birth certificates). When a
  question is provincial, say so plainly and point to the province or territory's official site.

### Safety
If someone is in danger: 911. Suicide or mental health crisis: call or text 9-8-8 (Canada's Suicide Crisis
Helpline, 24/7, English and French). Fraud: Canadian Anti-Fraud Centre 1-888-495-8501.
`.trim();

export const packServer: CountryPack = {
  ...pack,
  systemPrompt,
  showcase: {
    factsChecked: '2026-09-29',
    holidays: FEDERAL_HOLIDAYS,
    holidaysUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/public-holidays.html',
    taxDeadline: {
      month: 4,
      day: 30,
      selfEmployedMonth: 6,
      selfEmployedDay: 15,
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html',
    },
    advisory: () => getAdvisory('MX'),
    passportIcon: PassportCover,
  },
  messages: {
    en: () => import('./messages/en.json'),
    fr: () => import('./messages/fr.json'),
    ar: () => import('./messages/ar.json'),
    fa: () => import('./messages/fa.json'),
    ur: () => import('./messages/ur.json'),
    pa: () => import('./messages/pa.json'),
    'zh-Hans': () => import('./messages/zh-Hans.json'),
    'zh-Hant': () => import('./messages/zh-Hant.json'),
  },
};

export default packServer;
