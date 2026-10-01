/** civicVoterCheck builder (pure; also used by the fixtures). */
import { CHECKED, ELECTIONS_CANADA, QUEBEC_ELECTION, SOURCES, URLS, torontoToday, type Lang } from '../data';
import { voterVerdict } from '../select';
import type { VoterInput, VoterOutput } from '../types';

/** Which Élections Québec notice to show on a given day (YYYY-MM-DD, Eastern time). */
const quebecNoticeFor = (province: string | undefined, today: string): VoterOutput['quebecNotice'] =>
  province === 'QC' ? (today <= QUEBEC_ELECTION ? 'election' : 'generic') : null;

export function voterCheck(input: VoterInput = {}, today: string = torontoToday()): VoterOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const verdict = voterVerdict(input);
  const province = input.province?.toUpperCase();
  const future = SOURCES.futureElectors(lang);
  const abroad = verdict === 'abroad' || verdict === 'future-abroad' || input.livesAbroad ? SOURCES.abroad(lang) : null;
  const sources = [
    SOURCES.register(lang),
    SOURCES.voterId(lang),
    SOURCES.waysToVote(lang),
    // Always listed: the answer mentions the Register of Future Electors for 14-to-17-year-olds.
    future,
    ...(abroad ? [abroad] : []),
    SOURCES.ereg(lang),
  ];
  // Put the page that completes the task first (it shows in the widget footer, under the handoff button).
  const lead =
    verdict === 'future-elector' || verdict === 'too-young'
      ? future
      : abroad && (verdict === 'abroad' || verdict === 'future-abroad')
        ? abroad
        : input.focus === 'id'
          ? sources[1]
          : input.focus === 'ways'
            ? sources[2]
            : sources[0];
  sources.unshift(...sources.splice(sources.indexOf(lead), 1));
  const quebecNotice = quebecNoticeFor(province, today);
  return {
    verdict,
    ...(input.age != null ? { age: input.age } : {}),
    ...(input.citizen != null ? { citizen: input.citizen } : {}),
    ...(input.livesAbroad != null ? { livesAbroad: input.livesAbroad } : {}),
    ...(province ? { province } : {}),
    focus: input.focus ?? 'register',
    lang,
    today,
    quebecNotice,
    ...(quebecNotice === 'election' ? { quebecElection: QUEBEC_ELECTION } : {}),
    links: {
      ereg: URLS.ereg[lang],
      register: URLS.register[lang],
      voterId: URLS.voterId[lang],
      waysToVote: URLS.waysToVote[lang],
      futureElectors: URLS.futureElectors[lang],
      abroad: URLS.abroad[lang],
      contact: URLS.contactEc[lang],
    },
    phone: ELECTIONS_CANADA.phone,
    tty: ELECTIONS_CANADA.tty,
    checked: CHECKED,
    sources,
  };
}
