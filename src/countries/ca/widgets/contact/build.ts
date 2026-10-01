/**
 * Builds the contact tools' outputs (used by the tools on the server and by the lab fixtures; the cards never
 * import this file: their shared shapes live in types.ts and their selectors in pick.ts / sources.ts).
 * The card recomputes open/closed live in the browser; the text summary here is what the model reads.
 */
import type { Holiday } from '@/lib/dates/business-days';
import { addDays } from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { CRA_FRAUD_LINE, LINES, TOPIC_LINES, type Hours, type Lang } from './data';
import { URGENT, type UrgentId } from './urgent-data';
import { formatDays, formatTime, formatWeekday, holidayToday, isNorthZone, regionOf, safeZone, statusOf, zoneCity, typicalWindow, wallClock, type Status } from './hours';
import { sourcesFor, sourcesForUrgent } from './sources';
import { isUrgentSituation, type DirectoryInput, type DirectoryOutput, type LineSummary, type UrgentInput, type UrgentOutput, type UrgentSituation } from './types';

const intlOf = (lang: Lang) => (lang === 'fr' ? 'fr-CA' : 'en-CA');

/** Holidays near `now` (yesterday to +21 days), enough for every status and "opens on" date. */
function nearbyHolidays(all: Holiday[], nowMs: number) {
  const today = wallClock(nowMs, 'America/Toronto').date;
  const from = addDays(today, -1);
  const to = addDays(today, 21);
  return all.filter((h) => h.date >= from && h.date <= to);
}

function hoursText(rule: Hours, nowMs: number, tz: string, lang: Lang) {
  const intl = intlOf(lang);
  const w = typicalWindow(rule, nowMs, tz);
  const days = rule.days.length === 7 ? (lang === 'fr' ? 'tous les jours' : 'every day') : formatDays(rule.days, intl);
  if (rule.open === 0 && rule.close >= 1440) return lang === 'fr' ? '24 heures sur 24, 7 jours sur 7' : '24 hours a day, 7 days a week';
  const range = `${formatTime(w.start, tz, intl)}–${formatTime(w.end, tz, intl)}`;
  const city = zoneCity(tz, lang);
  return lang === 'fr' ? `${days}, ${range} (heure ${/^[aeiouyh]/i.test(city) ? 'd’' : 'de '}${city})` : `${days}, ${range} (${city} time)`;
}

function statusText(s: Status | null, tz: string, lang: Lang, nowMs: number): string | undefined {
  if (!s) return undefined;
  const intl = intlOf(lang);
  const fr = lang === 'fr';
  // French agrees with "la ligne", like the card's pills ("Ouverte", "Fermée").
  if (s.state === 'always') return fr ? 'Ouverte en tout temps' : 'Open 24/7';
  if (s.state === 'open' || s.state === 'closing') {
    const at = formatTime(s.closesAt, tz, intl);
    return fr ? `Ouverte maintenant, ferme à ${at}` : `Open now, closes at ${at}`;
  }
  const why = s.holiday ? (fr ? ` (${s.holiday.name.fr})` : ` (${s.holiday.name.en})`) : '';
  if (!s.opensAt) return (fr ? 'Fermée' : 'Closed') + why;
  const sameDay = wallClock(s.opensAt, tz).date === wallClock(nowMs, tz).date;
  const at = formatTime(s.opensAt, tz, intl);
  const when = sameDay ? at : `${formatWeekday(s.opensAt, tz, intl)} ${at}`;
  return fr ? `Fermée${why}, ouvre ${sameDay ? 'à ' : 'le '}${when}` : `Closed${why}, opens ${sameDay ? 'at ' : ''}${when}`;
}

export function buildDirectory(input: DirectoryInput, nowMs: number, holidays: Holiday[] = FEDERAL_HOLIDAYS, holidaysLive = false): DirectoryOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const tz = safeZone(input.timeZone);
  const topic = input.topic ?? 'all';
  const ids = TOPIC_LINES[topic] ?? TOPIC_LINES.all;
  const near = nearbyHolidays(holidays, nowMs);
  // The official pages split callers in three: Canada, the United States (toll-free numbers still work), elsewhere.
  const region = regionOf(tz);
  const abroad = input.abroad ?? region === 'intl';
  const us = !abroad && region === 'us';
  const tty = !!input.tty;
  const hol = holidayToday(nowMs, tz, near);

  const summary: LineSummary[] = ids.map((id) => {
    const l = LINES[id];
    const ttyAlt = l.alt?.find((a) => a.kind === 'tty');
    const number = lang === 'fr' && l.numberFr ? l.numberFr : l.number;
    const away = abroad || us ? l.alt?.find((a) => a.kind === 'abroad' && (abroad || a.outside === 'canada')) : undefined;
    // From abroad, 1 800 O-Canada is answered by its international service, on that service's hours.
    const agents = abroad && l.abroadPage ? l.abroadPage.hours : l.agents;
    return {
      id,
      name: l.name[lang],
      ...(number ? { number } : {}),
      ...(ttyAlt ? { tty: ttyAlt.number } : {}),
      ...(away ? { fromAbroad: `${away.number}${away.collect ? (lang === 'fr' ? ' (à frais virés)' : ' (call collect)') : ''}` } : {}),
      ...(abroad && l.abroadPage ? { fromAbroadPage: l.abroadPage.href[lang] } : {}),
      ...(agents ? { hours: hoursText(agents, nowMs, tz, lang), now: statusText(statusOf(agents, nowMs, tz, near), tz, lang, nowMs) } : {}),
      ...(l.automated
        ? { automated: `${lang === 'fr' ? 'Service automatisé' : 'Automated service'}: ${hoursText(l.automated, nowMs, tz, lang)}. ${statusText(statusOf(l.automated, nowMs, tz, near), tz, lang, nowMs)}` }
        : {}),
      page: l.page[lang],
    };
  });

  const guidance = [
    'Never state or estimate a phone wait time.',
    'Do not give any IRCC or Passport Program phone number: point to the status checker and the Passport Program contact page.',
    'For the CRA, mention self-service (CRA account, chat, automated lines) before the phone number.',
    'For Service Canada programs, always give the program number with its contact page; on weekends mention the call-back request (answer within 2 business days).',
    ...(us ? ['The person appears to be in the United States: the toll-free numbers work from there. Only give a "fromAbroad" number where one is listed.'] : []),
    ...(abroad ? ['The person appears to be outside Canada and the United States: give the "fromAbroad" number where one is listed. Where a line has "fromAbroadPage", its toll-free number differs by country: link to that page instead of giving the main number.'] : []),
  ];

  return {
    kind: 'directory',
    topic,
    lang,
    timeZone: tz,
    asOf: new Date(nowMs).toISOString(),
    lines: ids,
    tty,
    abroad,
    us,
    north: isNorthZone(tz),
    holidays: near,
    holidaysLive,
    today: { date: wallClock(nowMs, tz).date, ...(hol ? { holiday: hol.name[lang] } : {}) },
    summary,
    guidance,
    sources: sourcesFor(ids, lang),
  };
}

const URGENT_ORDER: Record<UrgentSituation, UrgentId[]> = {
  danger: ['911', '988', 'kids', 'hope'],
  crisis: ['988', '911', 'kids', 'hope'],
  fraud: ['cafc', '911'],
  suspected: ['cafc', '911'],
  all: ['911', '988', 'kids', 'hope', 'cafc'],
};

export function buildUrgent(input: UrgentInput, nowMs: number, holidays: Holiday[] = FEDERAL_HOLIDAYS, holidaysLive = false): UrgentOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const tz = safeZone(input.timeZone);
  const situation: UrgentSituation = isUrgentSituation(input.situation) ? input.situation : 'all';
  const order = URGENT_ORDER[situation] ?? URGENT_ORDER.all;
  const near = nearbyHolidays(holidays, nowMs);
  const fr = lang === 'fr';
  const summary = order.map((id) => {
    if (id === 'cafc') {
      const l = LINES.cafc;
      return {
        id,
        name: l.name[lang],
        how: [l.number, l.agents ? hoursText(l.agents, nowMs, tz, lang) : '', statusText(statusOf(l.agents, nowMs, tz, near), tz, lang, nowMs), fr ? 'signalement en ligne en tout temps' : 'report online any time']
          .filter(Boolean)
          .join(' · '),
      };
    }
    const u = URGENT[id];
    const text = u.text ? (u.text.keyword ? (fr ? `, ou textez ${u.text.keyword.fr} au ${u.text.to}` : `, or text ${u.text.keyword.en} to ${u.text.to}`) : fr ? ', appel ou texto' : ', call or text') : '';
    return { id, name: u.name[lang], how: `${u.number}${text} · ${fr ? '24 h sur 24, 7 jours sur 7' : '24/7'}` };
  });
  const guidance =
    situation === 'suspected'
      ? [
          'Say to hang up and verify through the CRA account or the CRA number on canada.ca, never a number the caller gave.',
          'The CRA never threatens arrest or deportation and never demands payment by gift card, prepaid card, cryptocurrency or e-Transfer. It may ask for a SIN to confirm identity on a real call, so do not say it never asks for one.',
          'Report the attempt to the Canadian Anti-Fraud Centre even if nothing was lost. Contact the bank only if money or banking details were given.',
          `If a SIN or CRA sign-in was shared, the CRA line for suspected fraud or identity theft is ${CRA_FRAUD_LINE.number}: ${hoursText(CRA_FRAUD_LINE.hours, nowMs, tz, 'en')} (${statusText(statusOf(CRA_FRAUD_LINE.hours, nowMs, tz, near), tz, 'en', nowMs)}). It can protect the account during the call. Never state a wait time.`,
        ]
      : undefined;
  return {
    kind: 'urgent',
    situation,
    lang,
    timeZone: tz,
    asOf: new Date(nowMs).toISOString(),
    order,
    holidays: near,
    holidaysLive,
    summary,
    ...(guidance ? { guidance } : {}),
    sources: sourcesForUrgent(situation, lang),
  };
}
