/** Lab fixtures for the `passport` widget: every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { URLS } from './data';
import { offlineFeeds, planRenewal } from './plan';
import type { NoticeFeeds, PlannerInput } from './types';

const TODAY = '2026-09-30';

/** What canada.ca's Canadian passports page actually showed on 2026-09-30 (parsed by notices.ts). */
const WILDFIRE: NoticeFeeds = {
  en: {
    live: true,
    checked: TODAY,
    page: URLS.home.en,
    items: [
      {
        tone: 'warn',
        title: 'Wildfires in some parts of Canada may affect the mail delivery of passports or other travel documents',
        body: 'Contact us if you urgently need your passport or travel document and you:',
        list: ['can’t access your mail, and', 'asked to have your passport or other travel document mailed to you'],
        url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/contact-passport-program.html',
      },
    ],
  },
  fr: {
    live: true,
    checked: TODAY,
    page: URLS.home.fr,
    items: [
      {
        tone: 'warn',
        title: 'Les feux de forêt dans certaines régions du Canada peuvent affecter la livraison de passeports ou d’autres documents de voyage par courrier',
        body: 'Contactez-nous si vous avez besoin de votre passeport ou de votre document de voyage de toute urgence et que vous :',
        list: ['ne pouvez pas accéder à votre courrier; et', 'avez demandé à ce que votre passeport ou autre document de voyage vous soit livré.'],
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens/communiquer-programme-passeport.html',
      },
    ],
  },
};

/** The page was read (on the fixture's own date) and had no notices. */
const clear = (checked: string): NoticeFeeds => ({
  en: { live: true, checked, page: URLS.home.en, items: [] },
  fr: { live: true, checked, page: URLS.home.fr, items: [] },
});
const CLEAR = clear(TODAY);

/** Stable ids (fx-1, fx-2, …) in file order: the same on the server and in the browser. */
let seq = 0;
/**
 * Every output is pinned to its own date and time of day (`pinned`, see types.ts): the planner follows the
 * device's clock, and without the pin "today a statutory holiday" would be an ordinary Thursday a day later.
 */
type At = { today: string; hour: number };
const MORNING: At = { today: TODAY, hour: 10 };
const part = (
  input: PlannerInput,
  state: WidgetPart['state'] = 'output-available',
  feeds: NoticeFeeds = CLEAR,
  extra: Partial<WidgetPart> = {},
  { today, hour }: At = MORNING,
): WidgetPart => ({
  type: 'tool-passportPlanner',
  toolCallId: `fx-${++seq}`,
  state,
  input,
  output: state === 'output-available' ? { ...planRenewal(input, today, feeds, { hour }), pinned: { hour } } : undefined,
  ...extra,
});

const fixtures: Fixture[] = [
  { name: 'Streaming input (skeleton)', toolName: 'passportPlanner', part: part({ expiry: '2027-03' }, 'input-streaming') },
  { name: 'Input ready, running (skeleton)', toolName: 'passportPlanner', part: part({ expiry: '2027-03' }, 'input-available') },
  {
    name: 'Input ready with a trip date (trip skeleton)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2027-01', travelDate: '2026-10-21' }, 'input-available'),
    note: 'The departure date is known before the plan arrives, so the skeleton takes the height of the express or urgent plan (and of the taller call-the-Passport-Program card only when the trip is too close for urgent pick-up).',
  },
  {
    name: 'Input ready for a fee question (short skeleton)',
    toolName: 'passportPlanner',
    part: part({ focus: 'fees' }, 'input-available'),
    note: 'A fee, processing or online question gets a one-screen answer, so its skeleton is one screen too.',
  },
  {
    name: 'March expiry: online renewal open (hero case, live wildfire notice)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2027-03' }, 'output-available', WILDFIRE),
    note: 'The wildfire mail-delivery notice is the live alert on canadian-passports.html today; the tool reads it at request time.',
  },
  {
    name: 'No expiry yet (fee question): pick a month',
    toolName: 'passportPlanner',
    part: part({}),
    note: 'Defaults to in person and hands off to the renewal page until a month is picked. "Already expired" and "Later" ranges included.',
  },
  {
    name: 'Fee question (focus: fees): fee summary first',
    toolName: 'passportPlanner',
    part: part({ focus: 'fees' }, 'output-available', WILDFIRE),
    note: '“How much does a passport cost?” The verdict slot answers with the fees; picking an expiry is a smaller follow-on step.',
  },
  { name: 'Expires in 11 months: online not open yet', toolName: 'passportPlanner', part: part({ expiry: '2027-08-20' }) },
  { name: 'Already expired (6 months ago)', toolName: 'passportPlanner', part: part({ expiry: '2026-03' }) },
  {
    name: 'Expired long ago (timeline axis break)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2025-11' }),
    note: 'More than 6 months back: the axis starts 6 months back with a break mark, and the pin reads “‹ Expired Nov 2025”.',
  },
  {
    name: 'Travelling in 3 weeks: express pick-up',
    toolName: 'passportPlanner',
    part: part({ expiry: '2027-01', travelDate: '2026-10-21' }),
    note: 'Regular in-person processing arrives after the trip, so the plan points to express pick-up ($50) with proof of travel.',
  },
  {
    name: 'Trip in 3 weeks, expiry not given: express pick-up, no month picker',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-21' }),
    note: '“I need my passport for a trip in 3 weeks”: the trip is the answer, so the plan shows the day-by-day timeline and a small optional “add your expiry month” row instead of the full month picker.',
  },
  {
    name: 'Travelling in 4 days: urgent pick-up',
    toolName: 'passportPlanner',
    part: part({ expiry: '2026-11', travelDate: '2026-10-04' }),
  },
  {
    name: 'Flying tomorrow, today a statutory holiday: emergency service, phone lines closed for the holiday',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-01' }, 'output-available', WILDFIRE),
    note: '“I’m flying tomorrow” on Sept 30 (National Day for Truth and Reconciliation). Urgent pick-up is ready Oct 2, after the trip, so the plan says so and points to the Passport Program and emergency weekend or statutory holiday service ($383.50). The phone line follows the reader’s clock, and on a weekday holiday it is closed: the card says so, gives the day the lines open, and adds that leaving a message is still worth a try.',
  },
  {
    name: 'Flying Monday, today Saturday: leave a message for a call-back',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-05' }, 'output-available', clear('2026-10-03'), {}, { today: '2026-10-03', hour: 11 }),
    note: 'Pinned to Saturday, Oct 3 at 11 a.m. Offices open Monday, so urgent pick-up is ready Tuesday, after the trip. On a weekend the Passport Program takes messages and calls back between 9 a.m. and 5 p.m., so the card says to call now and leave one.',
  },
  {
    name: 'Flying in 2 days, 6:30 p.m. on the evening before a holiday: call-back',
    toolName: 'passportPlanner',
    part: part({ expiry: '2026-11', travelDate: '2026-10-01' }, 'output-available', clear('2026-09-29'), {}, { today: '2026-09-29', hour: 18.5 }),
    note: 'Pinned to Tuesday, Sept 29 at 6:30 p.m., the evening before the National Day for Truth and Reconciliation. It is too late to apply in person today and offices are closed tomorrow, so they next open Thursday, Oct 1 and urgent pick-up is ready by the end of Friday, Oct 2: after the trip. After 5 p.m. before a weekend or holiday, canada.ca offers the leave-a-message call-back.',
  },
  {
    name: 'Flying tomorrow, 6 p.m. on an ordinary weekday: lines closed until morning',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-02' }, 'output-available', clear('2026-10-01'), {}, { today: '2026-10-01', hour: 18 }),
    note: 'Pinned to Thursday, Oct 1 at 6 p.m. Offices next open Friday, Oct 2, so urgent pick-up is ready by the end of Monday, Oct 5 (not Oct 2). No call-back is offered on an ordinary weekday evening: the card gives the time the lines open the next morning.',
  },
  {
    name: 'Flying Saturday, 6 p.m. on Thursday: too late for urgent pick-up',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-03' }, 'output-available', clear('2026-10-01'), {}, { today: '2026-10-01', hour: 18 }),
    note: 'Pinned to Thursday, Oct 1 at 6 p.m., two business days before a Saturday departure. Counted from today, urgent pick-up (ready Friday) would seem to fit; offices next open Friday, so it is ready by the end of Monday, Oct 5. Expect the call-the-Passport-Program card and the weekend service fee.',
  },
  {
    name: 'Trip in 6 days, 6 p.m.: urgent pick-up, dates count from tomorrow',
    toolName: 'passportPlanner',
    part: part({ expiry: '2026-11', travelDate: '2026-10-07' }, 'output-available', clear('2026-10-01'), {}, { today: '2026-10-01', hour: 18 }),
    note: 'Pinned to Thursday, Oct 1 at 6 p.m. Apply Friday, Oct 2; urgent pick-up is ready by the end of Monday, Oct 5, two days before the trip. The card, the first step and the note under the timeline all say that in-person dates count from Oct 2.',
  },
  {
    name: 'Flying tomorrow, 10 a.m. on a weekday: lines open',
    toolName: 'passportPlanner',
    part: part({ travelDate: '2026-10-02' }, 'output-available', clear('2026-10-01'), {}, { today: '2026-10-01', hour: 10 }),
    note: 'Pinned to Thursday, Oct 1 at 10 a.m. The Passport Program is answering calls; after 5 p.m. tonight this is not a call-back evening, so nothing more is said.',
  },
  {
    name: 'Trip in 9 days: urgent pick-up, express may be enough',
    toolName: 'passportPlanner',
    part: part({ expiry: '2026-11', travelDate: '2026-10-09' }),
    note: 'Express pick-up (2 to 9 business days) could be ready before the trip but its latest date is after it. The plan recommends urgent pick-up, says express ($50) is worth asking about, and the tile shows both fees.',
  },
  {
    name: 'Trip in 2 days with expiry: urgent is too late (timeline)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2026-11', travelDate: '2026-10-02' }),
    note: 'Urgent pick-up is ready by the end of Oct 2, the departure day: the day-by-day timeline shows it landing after the trip (the trip at the start of the day, urgent pick-up at its end).',
  },
  {
    name: 'Trip in 3 months: online still fits',
    toolName: 'passportPlanner',
    part: part({ expiry: '2027-02', travelDate: '2026-12-18' }),
  },
  {
    name: 'Expires in 2029 (axis break at the end)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2029-06' }),
    note: 'More than 16 months out: the axis ends with a break mark, the pin reads “Expires Jun 2029 ›”, and the online window (off the axis) has no bar or legend entry.',
  },
  {
    name: 'Processing question (focus: processing)',
    toolName: 'passportPlanner',
    part: part({ focus: 'processing' }, 'output-available', WILDFIRE),
    note: '“How long does passport renewal take?” leads with business days by method.',
  },
  {
    name: 'Online question (focus: online)',
    toolName: 'passportPlanner',
    part: part({ focus: 'online' }, 'output-available', WILDFIRE),
    note: '“Can I renew my passport online?” leads with the 6-month rule and the other conditions.',
  },
  {
    name: 'Answer in French, whatever the interface language',
    toolName: 'passportPlanner',
    part: part({ focus: 'fees', lang: 'fr' }, 'output-available', WILDFIRE),
    note: '« Combien coûte un passeport? » asked in the English interface: the tool is called with lang "fr", so the whole planner (strings, fees, notice, source line) is French, like the answer around it.',
  },
  { name: 'Not eligible to renew (name change)', toolName: 'passportPlanner', part: part({ expiry: '2027-03', sameDetails: false }) },
  {
    name: 'Service notices unavailable (canada.ca unreachable)',
    toolName: 'passportPlanner',
    part: part({ expiry: '2027-03' }, 'output-available', offlineFeeds(TODAY)),
    note: 'No claim either way: the widget links to the page to check.',
  },
  { name: 'Error', toolName: 'passportPlanner', part: part({ expiry: '2027-03' }, 'output-error', CLEAR, { errorText: 'Upstream timeout' }) },
];

export default fixtures;
