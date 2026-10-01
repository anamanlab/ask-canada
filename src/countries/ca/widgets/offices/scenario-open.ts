/**
 * "Is Service Canada open today?" (EN + FR): one verdict, from one source. When the message names a place and
 * its nearest office resolves, the heading is that office's status right now (live closure, lunch break and
 * holiday included), so the heading and the paragraph about the office can never disagree. With no office to
 * name, the heading falls back to the general hours across the time zones. Facts: ./data.ts.
 */
import { addDays } from '@/lib/dates/business-days';
import { SC_CLOSURES } from './data';
import { holidayOn, localNow } from './hours';
import { clock, closedNote, describe, dist, end, nearestFor, placeOf, weekdayName, whenText, where, type Ctx, type L, type Nearest } from './scenario-helpers';
import { fsaOf, PROV_BY_LETTER } from './search';

const TZ: Record<string, string> = {
  NL: 'America/St_Johns', NS: 'America/Halifax', PE: 'America/Halifax', NB: 'America/Moncton', QC: 'America/Toronto',
  ON: 'America/Toronto', MB: 'America/Winnipeg', SK: 'America/Regina', AB: 'America/Edmonton', BC: 'America/Vancouver',
  YT: 'America/Whitehorse', NT: 'America/Yellowknife', NU: 'America/Iqaluit',
};
const ZONES = ['America/St_Johns', 'America/Halifax', 'America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver'];

/** True whether the card reuses a place searched earlier on this page or asks for one. */
const OPEN_BELOW = {
  en: 'The finder below shows which offices near you are open right now. If it asks where you are, enter your postal code or town, or share your location.',
  fr: 'L’outil ci-dessous montre quels bureaux près de chez vous sont ouverts en ce moment. S’il vous demande où vous êtes, entrez votre code postal ou votre ville, ou partagez votre position.',
};

type Verdict = { head: string; lead: string };
type OpenNow = 'open' | 'before' | 'after' | 'mixed' | 'weekend' | 'holiday';

/** Holiday names with their article: "the National Day for …" / "la Journée nationale …", "Canada Day" / "la fête du Canada". */
function holidayName(name: { en: string; fr: string }, lang: L): string {
  if (lang === 'en') return /^(National|Civic|Fête)\b/.test(name.en) ? `the ${name.en}` : name.en;
  const n = name.fr;
  if (/^(Journée|Fête)\b/.test(n)) return `la ${n}`;
  if (/^[AÉEIOU]/.test(n)) return `l’${n}`;
  if (n === 'Noël') return n;
  return `le ${n.charAt(0).toLowerCase()}${n.slice(1)}`;
}

const localWeekday = (iso: string) => {
  const w = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return w === 0 ? 7 : w;
};

/**
 * The verdict from the office the answer names: its status at this moment, and (when closed) when it opens
 * next. Null when that office has no visits scheduled, so the general verdict speaks instead.
 */
function officeVerdict(n: Nearest, lang: L): Verdict | null {
  const fr = lang === 'fr';
  const s = n.now;
  const who = describe(n, lang, '*');
  const when = s.next ? whenText(s.next, lang) : '';
  const opens = when ? (fr ? `Il ouvre ${when}, heure locale. ` : `It opens ${when} local time. `) : '';
  switch (s.state) {
    case 'open':
      return fr
        ? { head: `Oui : ${who} est ouvert en ce moment, jusqu’à ${clock(s.until ?? '16:00', lang)}.`, lead: '' }
        : { head: end(`Yes — ${who} is open now, until ${clock(s.until ?? '16:00', lang)}`), lead: '' };
    case 'closing-soon':
      return fr
        ? { head: `Oui, mais faites vite : ${who} ferme à ${clock(s.until ?? '16:00', lang)}.`, lead: '' }
        : { head: end(`Yes, but be quick — ${who} closes at ${clock(s.until ?? '16:00', lang)}`), lead: '' };
    case 'lunch':
      return fr
        ? { head: `Pas en ce moment : ${who} est fermé pour le dîner jusqu’à ${clock(s.until ?? '13:00', lang)}.`, lead: '' }
        : { head: end(`Not right now — ${who} is closed for lunch until ${clock(s.until ?? '13:00', lang)}`), lead: '' };
    case 'holiday': {
      const day = s.holiday ? holidayName(s.holiday.name, lang) : fr ? 'un jour férié' : 'a public holiday';
      const reopens = when ? (fr ? `Il rouvre ${when}, heure locale. ` : `It reopens ${when} local time. `) : '';
      return fr ? { head: `Non : ${who} est fermé aujourd’hui pour ${day}.`, lead: reopens } : { head: `No — ${who} is closed today for ${day}.`, lead: reopens };
    }
    case 'temp-closed':
      return fr
        ? { head: `Non : ${who} est fermé temporairement.`, lead: 'Consultez la page du bureau avant de vous déplacer. ' }
        : { head: `No — ${who} is temporarily closed.`, lead: 'Check the office page before you go. ' };
    case 'closed':
      if (s.next?.inDays === 0) {
        return fr ? { head: `Pas encore : ${who} ouvre ${when}.`, lead: '' } : { head: end(`Not yet — ${who} opens ${when}`), lead: '' };
      }
      return fr ? { head: `Non : ${who} est fermé en ce moment.`, lead: opens } : { head: `No — ${who} is closed right now.`, lead: opens };
    default:
      return null;
  }
}

/**
 * The general verdict (no office to name): the usual hours in the place's time zone, or across the country,
 * plus the reopening time (when closed) that leads the first paragraph.
 */
function generalVerdict(text: string, lang: L, now = new Date()): Verdict {
  const fr = lang === 'fr';
  const p = placeOf(text);
  const fsa = p ? fsaOf(p) : null;
  const prov = fsa ? PROV_BY_LETTER[fsa[0]] : undefined;
  const zones = prov ? [TZ[prov]] : ZONES;
  const at = zones.map((tz) => localNow(now, tz));
  const day = at[0];
  const nextBiz = (from: string) => {
    for (let i = 1; i < 10; i++) {
      const d = addDays(from, i);
      const wd = localWeekday(d);
      if (wd < 6 && !(prov ? holidayOn(d, prov) : SC_CLOSURES.find((c) => c.date === d && !c.only && !c.except))) return { d, i };
    }
    return { d: addDays(from, 1), i: 1 };
  };
  const reopen = () => {
    const { d, i } = nextBiz(day.date);
    const t = clock('08:30', lang);
    return i === 1 ? (fr ? `demain à ${t}` : `tomorrow at ${t}`) : fr ? `${weekdayName(d, lang)} à ${t}` : `${weekdayName(d, lang)} at ${t}`;
  };
  const reopenLead = () => (fr ? `Ils rouvrent ${reopen()}. ` : `${end(`They reopen ${reopen()}`)} `);

  // Holidays: respect regional rules (Aug 3 isn't a closure in Quebec; Jun 24 only is).
  const closure = SC_CLOSURES.find((c) => c.date === day.date);
  if (closure) {
    const applies = prov ? Boolean(holidayOn(day.date, prov)) : !closure.only;
    if (applies) {
      const except = !prov && closure.except?.length ? closure.except : null;
      return fr
        ? { head: `Non : les bureaux de Service Canada sont fermés aujourd’hui pour ${holidayName(closure.name, lang)}${except ? ', sauf au Québec' : ''}.`, lead: reopenLead() }
        : { head: `No — Service Canada offices are closed today for ${holidayName(closure.name, lang)}${except ? ', except in Quebec' : ''}.`, lead: reopenLead() };
    }
  }
  const state = ((): OpenNow => {
    if (day.weekday >= 6) return 'weekend';
    const s = at.map(({ minutes }) => (minutes < 510 ? 'before' : minutes >= 960 ? 'after' : 'open'));
    return s.every((x) => x === s[0]) ? (s[0] as OpenNow) : 'mixed';
  })();
  const open = clock('08:30', lang);
  const verdict = (head: string, lead = '') => ({ head, lead });
  const close = clock('16:00', lang);
  switch (state) {
    case 'weekend':
      return verdict(fr ? 'Non : les bureaux de Service Canada sont fermés la fin de semaine.' : 'No — Service Canada offices are closed on weekends.', reopenLead());
    case 'before':
      return verdict(fr ? `Pas encore : la plupart des bureaux ouvrent aujourd’hui à ${open}.` : end(`Not yet — most offices open today at ${open}`));
    case 'after':
      return verdict(fr ? 'Non : la plupart des bureaux sont fermés pour la journée.' : 'No — most offices have closed for the day.', reopenLead());
    case 'mixed':
      return verdict(
        fr
          ? `Ça dépend de votre fuseau horaire : les bureaux sont ouverts de ${open} à ${close}, heure locale.`
          : `It depends on your time zone — offices are open ${open} to ${close} local time.`,
      );
    default:
      return verdict(fr ? `Oui : la plupart des bureaux de Service Canada sont ouverts en ce moment, jusqu’à ${close}.` : end(`Yes — most Service Canada offices are open right now, until ${close}`));
  }
}

/** "Is Service Canada open today?": the verdict, when offices reopen, and the nearest office if a place is named. */
export async function openTodayVars({ text, lang }: Ctx) {
  const w = where(text, lang);
  const n = w ? await nearestFor(text, lang, 'any') : null;
  const named = n ? officeVerdict(n, lang) : null;
  const { head, lead } = named ?? generalVerdict(text, lang);
  // The heading already gave the named office's status; otherwise the office's own sentence follows its name.
  const status = n && !named && n.status ? `${n.status} ` : '';
  const tail = w
    ? n
      ? lang === 'fr'
        ? `${closedNote(n, lang)}Le plus proche de ${w} est ${describe(n, lang, '**', { street: true })}${dist(n, lang)}. ${status}Voici les bureaux autour, avec leur état en direct et leurs heures.`
        : `${closedNote(n, lang)}The closest to ${w} is ${describe(n, lang, '**', { street: true })}${dist(n, lang)}. ${status}Here are the offices around it, with live status and hours.`
      : lang === 'fr'
        ? `Voici les bureaux près de ${w}, avec leur état en direct et leurs heures.`
        : `Here are the offices near ${w}, with their live status and hours.`
    : OPEN_BELOW[lang];
  return { head, lead, tail };
}
