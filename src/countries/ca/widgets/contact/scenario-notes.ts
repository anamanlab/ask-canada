/**
 * The time-dependent sentences of the scripted contact answers ("open now", "back Monday at 8:30 a.m."), EN + FR.
 * Pure: every function takes `now` (ms), so each state can be checked at a fixed moment.
 *
 * A scenario's `vars` doesn't know the person's time zone (the card below the answer does), so each sentence
 * must be true from St. John's to Vancouver at once. Canada spans 4.5 hours: between 10:30 p.m. and 3 a.m. in
 * Ottawa the country is on two calendar dates, and "today", "early", "not yet" or a holiday's name would be
 * wrong for someone. In that window (`overnight`) the answer states the standing hours and leaves "right now"
 * to the card, unless both dates agree (a Saturday night is the weekend everywhere).
 */
import { addDays, type Holiday } from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { formatWeekday, OTTAWA, wallClock, zonedToInstant } from './hours';
import { URLS } from './urls';

type Lang = 'en' | 'fr';

/** The country's westernmost and easternmost clocks. */
const WEST = 'America/Vancouver';
const EAST = 'America/St_Johns';

const WJ = '⁠';
/**
 * Keep phone numbers ("1-800-959-8281", "9-8-8"), times and "assurance-emploi" on one line: a word joiner after each
 * hyphen stops the browser breaking there. Link targets `](…)` are left untouched.
 */
export function keepTogether(md: string) {
  return md
    .split(/(\]\([^)]*\))/)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/\b\d{1,3}(?:-\d{1,4}){2,3}\b/g, (m) => m.replace(/-/g, `-${WJ}`))
            .replace(/\b([Aa])ssurance-emploi\b/g, `$1ssurance-${WJ}emploi`)
            // "8 a.m." and "16 h 30" never split across lines.
            .replace(/(\d) (a\.m\.|p\.m\.|h\b)/g, '$1 $2')
            .replace(/(\d h) (\d{2})\b/g, '$1 $2'),
    )
    .join('');
}

const holidayOn = (date: string) => FEDERAL_HOLIDAYS.find((h) => h.date === date);
const isWeekend = (date: string) => {
  const wd = new Date(`${date}T12:00:00Z`).getUTCDay();
  return wd === 0 || wd === 6;
};
const isBusinessDay = (date: string) => !isWeekend(date) && !holidayOn(date);

type Day =
  /** One calendar date across the country. `minutes`: Ottawa's clock. */
  | { kind: 'holiday'; date: string; minutes: number; holiday: Holiday }
  | { kind: 'weekend'; date: string; minutes: number; relative: boolean }
  | { kind: 'weekday'; date: string; minutes: number }
  /** Two dates at once (10:30 p.m. to 3 a.m. in Ottawa) that don't agree: say nothing about "today". */
  | { kind: 'overnight'; minutes: number };

/** What day it is for everyone in Canada at `now`. */
function canadaDay(now: number): Day {
  const minutes = wallClock(now, OTTAWA).minutes;
  const west = wallClock(now, WEST).date;
  const east = wallClock(now, EAST).date;
  if (west !== east) {
    // "Monday", never "tomorrow": tomorrow is a different day on each coast.
    return isWeekend(west) && isWeekend(east) ? { kind: 'weekend', date: east, minutes, relative: false } : { kind: 'overnight', minutes };
  }
  const holiday = holidayOn(west);
  if (holiday) return { kind: 'holiday', date: west, minutes, holiday };
  return isWeekend(west) ? { kind: 'weekend', date: west, minutes, relative: true } : { kind: 'weekday', date: west, minutes };
}

/**
 * The next federal business day after `date`: "tomorrow" / "demain" when it is tomorrow (and `relative`),
 * otherwise the weekday ("Monday" / "lundi"). Same wording as the card's pills ("Opens tomorrow at 8:30 a.m.").
 */
function nextBusinessDay(date: string, lang: Lang, relative = true) {
  let next = addDays(date, 1);
  while (!isBusinessDay(next)) next = addDays(next, 1);
  if (relative && next === addDays(date, 1)) return lang === 'fr' ? 'demain' : 'tomorrow';
  return formatWeekday(zonedToInstant(next, 720, OTTAWA), OTTAWA, lang === 'fr' ? 'fr-CA' : 'en-CA');
}
type KnownDay = Exclude<Day, { kind: 'overnight' }>;
const nextDayOf = (day: KnownDay, lang: Lang) => nextBusinessDay(day.date, lang, day.kind !== 'weekend' || day.relative);

/** "Today is a federal holiday / the weekend" line of the directory answer. */
export function todayNote(lang: Lang, now: number) {
  const day = canadaDay(now);
  if (day.kind === 'holiday') {
    return lang === 'fr'
      ? `Aujourd’hui, c’est un jour férié fédéral (${day.holiday.name.fr}) : les agents ne répondent pas, mais les lignes automatisées et les services en ligne fonctionnent.`
      : `Today is a federal holiday (${day.holiday.name.en}), so agents aren’t answering, but automated lines and online services still work.`;
  }
  if (day.kind === 'weekend') {
    const next = nextDayOf(day, lang);
    return lang === 'fr'
      ? `C’est la fin de semaine : les agents sont de retour ${next}, et vous pouvez demander un rappel en ligne dès maintenant.`
      : `It’s the weekend, so agents are back ${next === 'tomorrow' ? next : `on ${next}`}. You can request a call back online now.`;
  }
  return lang === 'fr' ? 'Voici les lignes ouvertes en ce moment.' : 'Here’s what’s open right now.';
}

type OpenState = 'holiday' | 'weekend' | 'open' | 'before' | 'after' | 'depends';

/**
 * "Is Service Canada open right now?", answered for every Canadian time zone at once. Agents answer
 * 8:30 a.m.–4:30 p.m. local time, so every zone is open when Ottawa reads 11:30 a.m. (8:30 in Vancouver) to
 * 3 p.m. (4:30 in St. John's), none has started before 7 a.m. and all have finished after 7:30 p.m.
 */
function serviceCanadaState(day: KnownDay): OpenState {
  if (day.kind !== 'weekday') return day.kind;
  const min = day.minutes;
  return min >= 690 && min < 900 ? 'open' : min < 420 ? 'before' : min >= 1170 ? 'after' : 'depends';
}

/** Heading and first paragraph of "Is Service Canada open right now?". */
export function openNow(lang: Lang, now: number) {
  const day = canadaDay(now);
  const fr = lang === 'fr';
  const msca = `Mon dossier Service Canada fonctionne en tout temps. [1](${URLS.msca.fr})`;
  const mscaEn = `My Service Canada Account works any time. [1](${URLS.msca.en})`;
  if (day.kind === 'overnight') {
    return {
      heading: fr
        ? '# Service Canada répond de *8 h 30 à 16 h 30, heure locale*, du lundi au vendredi.'
        : '# Service Canada answers *8:30 a.m. to 4:30 p.m. local time*, Monday to Friday.',
      lead: fr
        ? `La carte ci-dessous indique si chaque ligne est ouverte pour vous en ce moment, et quand elle rouvre. ${msca}`
        : `The card below shows whether each line is open for you right now, and when it next opens. ${mscaEn}`,
    };
  }
  const state = serviceCanadaState(day);
  const nextDay = nextDayOf(day, lang);
  const holiday = day.kind === 'holiday' ? day.holiday.name[lang] : '';
  const heading = {
    holiday: fr ? `# Non, les centres d’appels fédéraux sont *fermés aujourd’hui* (${holiday}).` : `# No, federal call centres are *closed today* for ${holiday}.`,
    weekend: fr ? '# Non, les agents de Service Canada sont *en congé la fin de semaine*.' : '# No, Service Canada agents are *off for the weekend*.',
    open: fr ? '# Oui, les lignes de Service Canada sont *ouvertes en ce moment*, jusqu’à 16 h 30, heure locale.' : '# Yes, Service Canada lines are *open now*, until 4:30 p.m. your local time.',
    before: fr ? '# Pas encore : les lignes de Service Canada ouvrent à *8 h 30, heure locale*.' : '# Not yet: Service Canada lines open at *8:30 a.m. your local time*.',
    after: fr ? '# Non, les lignes de Service Canada sont *fermées pour aujourd’hui*.' : '# No, Service Canada lines are *closed for today*.',
    depends: fr
      ? '# Ça dépend de votre fuseau : Service Canada répond de *8 h 30 à 16 h 30, heure locale*.'
      : '# It depends on your time zone: Service Canada answers *8:30 a.m. to 4:30 p.m. local time*.',
  }[state];
  // 1 800 O-Canada opens at 8 a.m. local, the program lines at 8:30: say both, as the card's holiday notice does.
  const on = nextDay === 'tomorrow' ? nextDay : `on ${nextDay}`;
  const reopen = fr
    ? `1 800 O-Canada rouvre ${nextDay} à 8 h, heure locale, et les lignes des programmes à 8 h 30.`
    : `1 800 O-Canada reopens ${on} at 8 a.m. your local time, and the program lines at 8:30 a.m.`;
  const lead = {
    holiday: fr
      ? `Aujourd’hui est un jour férié fédéral : les agents de Service Canada et de l’ARC ne répondent pas. Les lignes automatisées et les services en ligne, comme Mon dossier Service Canada, fonctionnent toujours. [1](${URLS.msca.fr}) ${reopen}`
      : `It’s a federal public holiday, so Service Canada and CRA agents aren’t answering. Automated phone lines and online services like My Service Canada Account still work. [1](${URLS.msca.en}) ${reopen}`,
    weekend: fr
      ? `${reopen} D’ici là, vous pouvez utiliser Mon dossier Service Canada en tout temps [1](${URLS.msca.fr}) ou demander un rappel en ligne : un agent vous appellera dans les 2 jours ouvrables.`
      : `${reopen} Until then, My Service Canada Account works any time [1](${URLS.msca.en}), or you can request a call back online and an officer will call you within 2 business days.`,
    open: fr
      ? `C’est un jour de semaine, pendant les heures d’ouverture dans toutes les provinces et tous les territoires. Vous pouvez aussi utiliser Mon dossier Service Canada en tout temps. [1](${URLS.msca.fr})`
      : `It’s a weekday, during business hours in every province and territory. My Service Canada Account also works any time. [1](${URLS.msca.en})`,
    before: fr ? `Il est tôt : les agents commencent à répondre à 8 h 30 dans chaque fuseau horaire. ${msca}` : `It’s early: agents start answering at 8:30 a.m. in each time zone. ${mscaEn}`,
    after: fr
      ? `Les agents ont terminé leur journée dans tous les fuseaux horaires. ${reopen} ${msca}`
      : `Agents have finished for the day in every time zone. ${reopen} ${mscaEn}`,
    depends: fr
      ? `Les heures suivent l’heure locale : selon l’endroit où vous êtes, la journée peut être déjà commencée ou déjà terminée. La carte ci-dessous indique l’état pour votre fuseau. ${msca}`
      : `Hours follow local time, so depending on where you are, the day may have started or already ended. The card below shows the status for your time zone. ${mscaEn}`,
  }[state];
  return { heading, lead };
}

/**
 * CRA answer, second paragraph: where the CRA's agent day stands right now (8 a.m.–8 p.m. Eastern, weekdays),
 * so the answer and the live card below it describe the same moment.
 */
export function craNote(lang: Lang, now: number) {
  const fr = lang === 'fr';
  const day = canadaDay(now);
  if (day.kind === 'overnight') {
    return fr
      ? 'Les agents de l’ARC répondent de 8 h à 20 h, heure de l’Est, en semaine; la carte indique quand ils reprennent, selon votre fuseau.'
      : 'CRA agents answer 8 a.m. to 8 p.m. Eastern on weekdays; the card shows when they next open in your time.';
  }
  const min = day.minutes;
  const next = nextDayOf(day, lang);
  // Automated service: 6 a.m. to 3 a.m. Eastern, every day.
  const auto = min >= 360 || min < 180;
  const autoEn = auto ? ' The automated line and your CRA account still work.' : ' Your CRA account still works.';
  const autoFr = auto ? ' La ligne automatisée et votre compte de l’ARC fonctionnent toujours.' : ' Votre compte de l’ARC fonctionne toujours.';
  if (day.kind === 'holiday') {
    return fr
      ? `Aujourd’hui est un jour férié fédéral (${day.holiday.name.fr}) : les agents de l’ARC sont de retour ${next} à 8 h, heure de l’Est.${autoFr}`
      : `Today is a federal holiday (${day.holiday.name.en}), so CRA agents are back ${next} at 8 a.m. Eastern.${autoEn}`;
  }
  if (day.kind === 'weekend') {
    return fr
      ? `C’est la fin de semaine : les agents de l’ARC sont de retour ${next} à 8 h, heure de l’Est.${autoFr}`
      : `It’s the weekend, so CRA agents are back ${next} at 8 a.m. Eastern.${autoEn}`;
  }
  if (min < 480) return fr ? 'Les agents de l’ARC commencent à 8 h, heure de l’Est, aujourd’hui.' : 'CRA agents start at 8 a.m. Eastern today.';
  if (min >= 1200) {
    return fr ? `Les agents de l’ARC ont terminé pour aujourd’hui et sont de retour ${next} à 8 h, heure de l’Est.${autoFr}` : `CRA agents are done for today and back ${next} at 8 a.m. Eastern.${autoEn}`;
  }
  return fr ? 'Les agents de l’ARC répondent en ce moment, jusqu’à 20 h, heure de l’Est.' : 'CRA agents are answering now, until 8 p.m. Eastern.';
}

/**
 * EI answer: the verdict and second paragraph follow the same clock as "Is Service Canada open?" (agents
 * 8:30 a.m.–4:30 p.m. local time, weekdays), so on a holiday the answer doesn't say "call now" above a
 * card that says "closed".
 */
export function eiNow(lang: Lang, now: number) {
  const fr = lang === 'fr';
  const day = canadaDay(now);
  const num = fr ? '1-800-808-6352' : '1-800-206-7218';
  if (day.kind === 'overnight') {
    return {
      heading: fr ? `# Assurance-emploi : *${num}*, en semaine de 8 h 30 à 16 h 30, heure locale.` : `# Employment Insurance: *${num}*, weekdays 8:30 a.m. to 4:30 p.m. local time.`,
      todayNote: fr
        ? 'La carte ci-dessous indique si la ligne est ouverte pour vous en ce moment, et quand elle rouvre.'
        : 'The card below shows whether the line is open for you right now, and when it next opens.',
    };
  }
  const state = serviceCanadaState(day);
  const holiday = day.kind === 'holiday' ? day.holiday.name[lang] : '';
  const next = nextDayOf(day, lang);
  const heading =
    state === 'holiday' || state === 'weekend' || state === 'after'
      ? fr
        ? `# Assurance-emploi : *${num}*, agents de retour ${next} à 8 h 30.`
        : `# Employment Insurance: *${num}*, back ${next} at 8:30 a.m.`
      : state === 'before'
        ? fr
          ? `# Assurance-emploi : *${num}*, ouvert à 8 h 30, heure locale.`
          : `# Employment Insurance: *${num}*, open from 8:30 a.m. local time.`
        : fr
          ? `# Appelez l’assurance-emploi au *${num}*.`
          : `# Call Employment Insurance at *${num}*.`;
  const todayNote = {
    holiday: fr
      ? `La ligne est fermée aujourd’hui (${holiday}, jour férié fédéral) et rouvre ${next} à 8 h 30, heure locale.`
      : `The line is closed today for ${holiday}, a federal public holiday, and reopens ${next} at 8:30 a.m. your local time.`,
    weekend: fr ? `C’est la fin de semaine : la ligne rouvre ${next} à 8 h 30, heure locale.` : `It’s the weekend, so the line reopens ${next} at 8:30 a.m. your local time.`,
    after: fr
      ? `Les agents ont terminé leur journée dans tous les fuseaux horaires et sont de retour ${next} à 8 h 30, heure locale.`
      : `Agents have finished for the day in every time zone and are back ${next} at 8:30 a.m. your local time.`,
    before: fr ? 'Il est tôt : les agents commencent à 8 h 30 dans chaque fuseau horaire.' : 'It’s early: agents start at 8:30 a.m. in each time zone.',
    open: fr ? 'Les agents répondent en ce moment dans toutes les provinces et tous les territoires.' : 'Agents are answering now in every province and territory.',
    depends: fr
      ? 'Selon votre fuseau horaire, la journée des agents peut être commencée ou déjà terminée : la carte ci-dessous indique l’état pour vous.'
      : 'Depending on your time zone, agents may be answering or already done for the day. The card below shows your status.',
  }[state];
  return { heading, todayNote };
}
