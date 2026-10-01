/** Scripted scenario `dates-holidays` (EN + FR). Statutory holidays: one holiday in one province, a province's list, or the next long weekend. */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../../../data/holidays';
import { HOLIDAYS_SITE, isAllowlisted, isChoiceIn, type Province } from '../data';
import { PROVINCE_SOURCES } from '../sources';
import { findHoliday } from '../build';
import { askedView, dayOff, holidaysFor, longWeekend, nextHoliday, nextLongWeekend, offDaysFor } from '../select';
import { holidayName, inSentence } from '../names';
import { provinceIn, holidayIn, fmt, fmtY, PROV_NAME, le, em, c, numbered, cap, type Ctx, guessed, basedOnZone, listFor, names, holidays, C } from './shared';

export const holidaysScenario: Scenario = {
  id: 'dates-holidays',
  priority: 8,
  checked: '2026-09-30',
  match: [
    /\b(stat(utory)?|public|general|bank|paid) holidays?\b/i,
    /\bstats?\b.*\b(holiday|day off|in (ontario|quebec|bc|alberta|manitoba|saskatchewan|nova scotia|new brunswick|pei|newfoundland|yukon|nunavut))\b/i,
    /\blong weekends?\b/i,
    /\b(next|upcoming) (holiday|day off)\b/i,
    /\bholidays? (in|for) (20\d\d|ontario|quebec|b\.?c|british columbia|alberta|manitoba|saskatchewan|nova scotia|new brunswick|p\.?e\.?i|prince edward island|newfoundland|yukon|nunavut|the northwest territories|canada)\b/i,
    /\bis\b.*\b(day|thanksgiving|christmas|boxing day|good friday|easter monday)\b.*\ba (stat|holiday)\b/i,
    /\bjours? férié/i,
    /\bcongés? férié/i,
    /\b(longue fin de semaine|long week-end|longs week-ends|longues fins de semaine)\b/i,
    /\b(prochain|prochaine)\b.*\b(congé|jour de congé)/i,
    /férié/i,
  ],
  reply: {
    en: `# {head}

{text}

{outro}`,
    fr: `# {head}

{text}

{outro}`,
  },
  vars: async ({ text, lang, timeZone }: Ctx) => {
    const today = todayInCanada();
    const all = await holidays();
    const p = provinceIn(text) ?? null;
    const fr = lang === 'fr';
    const d = (iso: string) => fmtY(iso, lang);
    // A province's own page is cited only when the chat treats its domain as official; otherwise the facts cite
    // canada-holidays.ca (the live feed, which links each province's page) and the province's page is the widget's
    // handoff button, so no citation is ever flagged "not an official source". The Canada Labour Code page (who each
    // rule covers) always comes first, so an official canada.ca page is source [1] and the community feed follows.
    const prov = p ? PROVINCE_SOURCES[p][lang].url : null;
    const provCite = prov && isAllowlisted(prov) ? prov : HOLIDAYS_SITE[lang];
    // Who each rule covers (cites canada.ca).
    const rules = fr
      ? `Les jours fériés dépendent de votre milieu de travail : les règles provinciales et territoriales s’appliquent à la plupart des milieux de travail, et le Code canadien du travail s’applique aux employeurs sous réglementation fédérale, comme les banques, les sociétés aériennes et les chemins de fer. ${c(C.federal.fr)}`
      : `Holidays and days off depend on where you work: provincial and territorial rules cover most workplaces, and the Canada Labour Code covers federally regulated employers such as banks, airlines and railways. ${c(C.federal.en)}`;
    // French typography: a non-breaking space before « : ; ? ! » and inside guillemets.
    const nb = (x: string) => (fr ? x.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0') : x);
    // The widget may open on a province guessed from the time zone, so the closing line fits either way.
    const g = guessed(text, timeZone);
    const outro = p
      ? fr
        ? `La liste complète ${PROV_NAME[p].of} est ci-dessous : ajoutez-la à votre calendrier en un geste.`
        : `The full list for ${PROV_NAME[p].en} is below, ready to add to your calendar.`
      : fr
        ? g
          ? listFor(g, lang)
          : 'Vérifiez votre province ou territoire ci-dessous pour voir tous les jours fériés de l’année, puis ajoutez-les à votre calendrier.'
        : g
          ? listFor(g, lang)
          : 'Check your province or territory below to see every holiday this year, then add them to your calendar.';
    const out = (head: string, body: string[]) => ({ head: nb(head), text: nb(numbered([rules, ...body])), outro: nb(outro) });

    // "Is Easter Monday a stat holiday in Quebec?" and other questions about one holiday.
    const askedName = holidayIn(text);
    const hit = askedName ? findHoliday(all, askedName, today, p) : null;
    // Without a place the answer is the federal one: a Canada Labour Code holiday on a weekend keeps its date, and
    // the day off is the scheduled work day before or after (see `clcView`).
    // With a place, the province's view: a weekend holiday keeps its date (see `provView`), and a provincial
    // government's own day never carries a day off its schedule hasn't published (see `askedView`).
    const h = hit ? askedView(hit, p) : null;
    if (h) {
      const name = h.name[lang];
      const wd = (iso: string) => fmt(iso, lang, { weekday: 'long' });
      const govDay = Boolean(p && !h.provinces.includes(p) && h.government?.includes(p));
      const year = h.date.slice(0, 4);
      const when = h.unscheduled
        ? h.floating
          ? fr
            ? `Le gouvernement provincial n’a pas encore publié son calendrier de ${year} : la prochaine date n’est pas fixée.`
            : `The provincial government hasn’t published its ${year} schedule yet, so the next date isn’t set.`
          : fr
            ? `Prochaine date : ${d(h.date)}. Le gouvernement provincial n’a pas encore publié son calendrier de ${year} : le jour de congé de ses employés n’est pas confirmé.`
            : `Next: ${d(h.date)}. The provincial government hasn’t published its ${year} schedule yet, so the day its employees get off isn’t confirmed.`
        : h.clcWeekend
        ? fr
          ? `Prochaine date : ${d(h.date)}. Il tombe un ${wd(h.date)} : les employés sous réglementation fédérale ont droit à un congé payé le jour ouvrable prévu qui précède ou qui suit. ${c(C.federal.fr)}`
          : `Next: ${d(h.date)}. It falls on a ${wd(h.date)}, so federally regulated employees get the scheduled work day before or after, with pay. ${c(C.federal.en)}`
        : h.substitute && p
        ? fr
          ? `Prochaine date : ${d(h.date)}. Il tombe un ${wd(h.date)} : si ce n’est pas un jour de travail pour vous, les règles ${PROV_NAME[p].of} peuvent vous donner un autre jour de congé. La fonction publique fédérale le prend le ${d(h.substitute)}.`
          : `Next: ${d(h.date)}. It falls on a ${wd(h.date)}, so if that isn’t a working day for you, the rules ${PROV_NAME[p].in.en} may give you a substitute day off. The federal public service takes ${d(h.substitute)}.`
        : h.observed && govDay
        ? fr
          ? `Prochaine date : ${d(h.date)}. Les employés du gouvernement provincial ont congé le ${d(h.observed)}.`
          : `Next: ${d(h.date)}. Provincial government employees get ${d(h.observed)} off.`
        : h.observed
        ? fr
          ? `Prochaine date : ${d(h.date)}, avec congé le ${d(h.observed)}.`
          : `Next: ${d(h.date)}, with the day off on ${d(h.observed)}.`
        : fr
          ? `Prochaine date : ${d(h.date)}.`
          : `Next: ${d(h.date)}.`;
      const inList = (codes: Province[]) =>
        fr ? `C’est un jour férié dans ces provinces et territoires : ${names(codes, 'fr')}.` : `It’s a statutory holiday in ${names(codes, 'en')}.`;
      const choiceIn = h.choice?.provinces ?? [];
      const whereAll = h.provinces.length
        ? inList(h.provinces)
        : choiceIn.length
          ? fr
            ? `Aucune province ni aucun territoire n’en fait un jour férié à part entière, mais ${PROV_NAME[choiceIn[0]].in.fr}, l’employeur accorde soit le Vendredi saint, soit le lundi de Pâques.`
            : `No province or territory lists it on its own, but ${PROV_NAME[choiceIn[0]].in.en}, employers give either Good Friday or Easter Monday.`
          : fr
            ? 'Aucune province ni aucun territoire n’en fait un jour férié.'
            : 'No province or territory lists it as a statutory holiday.';
      // Canada Labour Code holidays apply to federally regulated workplaces; Easter Monday and Civic Holiday are
      // only federal public-service days (CRA public holidays page).
      const clcLine = fr
        ? `C’est aussi un jour férié au sens du Code canadien du travail. ${c(C.federal.fr)}`
        : `It’s also a general holiday under the Canada Labour Code. ${c(C.federal.en)}`;
      const psLine = fr
        ? `C’est un congé pour la fonction publique fédérale, mais pas un jour férié au sens du Code canadien du travail : les employeurs sous réglementation fédérale, comme les banques, ne sont pas tenus de l’accorder. ${c(C.cra.fr)}`
        : `It’s a day off for the federal public service, but not a general holiday under the Canada Labour Code, so federally regulated employers, such as banks, don’t have to give it. ${c(C.cra.en)}`;
      const fedLine = h.clc ? clcLine : h.federal ? psLine : '';

      if (p) {
        const yes = h.provinces.includes(p);
        const choice = isChoiceIn(h, p);
        // Quebec: "le Vendredi saint ou le lundi de Pâques, au choix de l’employeur" (CNESST). The same answer for
        // both days: a worker whose employer picked the other one must never read a plain yes. The CNESST page is the
        // widget's handoff (its domain isn't on the chat's official-source list), so this sentence names it instead.
        if (choice) {
          const cnesst = fr
            ? `Les normes du travail du Québec (CNESST, lien ci-dessous) prévoient « le Vendredi saint ou le lundi de Pâques, au choix de l’employeur » : c’est un seul jour férié. Demandez à votre employeur quel jour vous aurez congé.`
            : `Quebec’s labour standards (CNESST, linked below) list “Good Friday or Easter Monday, at the employer’s option” as one statutory holiday. Ask your employer which day you get.`;
          const head = fr
            ? `Vendredi saint ou lundi de Pâques : au Québec, votre employeur choisit *lequel est le jour férié*.`
            : `Good Friday or Easter Monday: in Quebec, your employer chooses *which one is the statutory holiday*.`;
          // Both days of the pair, in order: « Prochaines dates : le vendredi 26 mars 2027 ou le lundi 29 mars 2027. »
          const other = all.find((x) => x !== h && x.choice && x.date.slice(0, 4) === h.date.slice(0, 4));
          const pair = other ? [dayOff(h), dayOff(other)].sort() : null;
          const whenBoth = pair ? (fr ? `Prochaines dates : le ${d(pair[0])} ou le ${d(pair[1])}.` : `Next: ${d(pair[0])} or ${d(pair[1])}.`) : when;
          return out(head, [cnesst, `${whenBoth} ${c(provCite)}`, fedLine]);
        }
        const head = fr
          ? yes
            ? `${name} : oui, c’est un jour férié *${PROV_NAME[p].in.fr}*.`
            : `${name} : non, ce n’est pas un jour férié *${PROV_NAME[p].in.fr}*.`
          : yes
            ? `Yes, ${inSentence(name, 'en')} is a statutory holiday *${PROV_NAME[p].in.en}*.`
            : `No, ${inSentence(name, 'en')} isn’t a statutory holiday *${PROV_NAME[p].in.en}*.`;
        const clcNo = fr
          ? `C’est toutefois un jour férié au sens du Code canadien du travail : si vous travaillez pour un employeur sous réglementation fédérale, comme une banque ou une société aérienne, vous avez droit à ce congé payé. ${c(C.federal.fr)}`
          : `It is a general holiday under the Canada Labour Code, though: if you work for a federally regulated employer, such as a bank or an airline, you get the day off with pay. ${c(C.federal.en)}`;
        // N.L.: the provincial government's own employee holidays aren't paid public holidays under the Labour Standards Act.
        const govLine = fr
          ? `Le gouvernement provincial accorde ce congé à ses propres employés, mais ce n’est pas un jour férié payé prévu par les normes du travail ${PROV_NAME[p].of} (lien ci-dessous) : les autres employeurs ne sont pas tenus de l’accorder.`
          : `The provincial government gives its own employees the day, but it isn’t a paid public holiday under ${PROV_NAME[p].en}’s labour standards (linked below), so other employers don’t have to give it.`;
        // N.L.'s Victoria Day, National Day for Truth and Reconciliation, Thanksgiving and Boxing Day are both: the
        // provincial government's own days and Canada Labour Code holidays. Say both, the federal rule first.
        const gov = h.government?.includes(p);
        const extra = yes ? '' : gov && h.clc ? `${clcNo} ${govLine}` : gov ? govLine : h.clc ? clcNo : h.federal ? psLine : '';
        return out(head, [`${yes ? '' : whereAll} ${when} ${c(provCite)}`, extra]);
      }
      const head = h.provinces.length
        ? fr
          ? `${name} : jour férié dans *${h.provinces.length} provinces et territoires*.`
          : `${cap(inSentence(name, 'en'))} is a statutory holiday in *${h.provinces.length} provinces and territories*.`
        : fr
          ? `${name} n’est un jour férié *dans aucune province ni aucun territoire*${choiceIn.length ? ', sauf au choix de l’employeur au Québec' : ''}.`
          : `${cap(inSentence(name, 'en'))} isn’t a statutory holiday *in any province or territory*${choiceIn.length ? ', except at the employer’s choice in Quebec' : ''}.`;
      const gLine = g
        ? isChoiceIn(h, g)
          ? fr
            ? `${basedOnZone(g, 'fr')}, l’employeur choisit entre le Vendredi saint et le lundi de Pâques.`
            : `${basedOnZone(g, 'en')}, the employer chooses Good Friday or Easter Monday.`
          : h.provinces.includes(g)
            ? fr
              ? `${basedOnZone(g, 'fr')}, c’est un jour férié.`
              : `${basedOnZone(g, 'en')}, it’s a statutory holiday.`
            : fr
              ? `${basedOnZone(g, 'fr')}, ce n’est pas un jour férié.`
              : `${basedOnZone(g, 'en')}, it isn’t a statutory holiday.`
        : '';
      return out(head, [`${whereAll} ${when} ${c(HOLIDAYS_SITE[lang])}`, fedLine, gLine]);
    }

    const here = holidaysFor(all, p).stat;
    const todayH = here.find((x) => dayOff(x) === today) ?? null;
    const inP = p ? PROV_NAME[p].in[lang] : '';
    const todayLine = todayH
      ? fr
        ? `Aujourd’hui, c’est ${inSentence(holidayName(todayH, p, 'fr'), 'fr')}${p ? `, un jour férié ${inP}` : ', un jour férié fédéral'}.`
        : `Today is ${inSentence(holidayName(todayH, p, 'en'), 'en')}${p ? `, a statutory holiday ${inP}` : ', a federal holiday'}.`
      : '';
    const count = p ? holidaysFor(all, p, Number(today.slice(0, 4))).stat.length : 0;
    const countLine = p
      ? fr
        ? `Il y a ${count} jours fériés ${inP} cette année. ${c(provCite)}`
        : `There are ${count} statutory holidays ${inP} this year. ${c(provCite)}`
      : '';

    // "When is the next long weekend?": the next holiday (after today) that makes 3 days or more off.
    if (/\blong weekends?\b|longues? fins? de semaine|long(s)? week-ends?/i.test(text)) {
      const lw = nextLongWeekend(all, p, today);
      if (lw) {
        const name = holidayName(lw.holiday, p, lang);
        const range = fr
          ? `du ${fmt(lw.start, 'fr')} au ${fmt(lw.end, 'fr')}`
          : `${fmt(lw.start, 'en')} to ${fmt(lw.end, 'en')}`;
        const head = fr
          ? `La prochaine longue fin de semaine${p ? ` ${inP}` : ''} est celle ${le(name) === 'l’' ? 'de l’' : le(name) === 'le ' ? 'du ' : le(name) ? 'de la ' : 'de '}*${inSentence(name, 'fr').slice(le(name).length)}* : ${range}.`
          : `The next long weekend${p ? ` ${inP}` : ''} is ${em(name, 'en')}: ${range}.`;
        const where = p
          ? countLine
          : fr
            ? `${cap(inSentence(name, 'fr'))} est un jour férié fédéral et un jour férié dans ${lw.holiday.provinces.length} provinces et territoires. ${c(HOLIDAYS_SITE.fr)}`
            : `${cap(inSentence(name, 'en'))} is a federal holiday and a statutory holiday in ${lw.holiday.provinces.length} provinces and territories. ${c(HOLIDAYS_SITE.en)}`;
        const days = fr ? `Cela fait ${lw.days} jours de congé d’affilée.` : `That’s ${lw.days} days off in a row.`;
        const glw = g ? nextLongWeekend(all, g, today) : null;
        const gLw =
          g && glw
            ? fr
              ? `${basedOnZone(g, 'fr')}, la prochaine est du ${fmt(glw.start, 'fr')} au ${fmt(glw.end, 'fr')}.`
              : `${basedOnZone(g, 'en')}, the next one is ${fmt(glw.start, 'en')} to ${fmt(glw.end, 'en')}.`
            : '';
        return out(head, [`${days} ${where}`, todayLine
          ? `${todayLine}${longWeekend(today, offDaysFor(all, p)) ? '' : fr ? ' Il tombe en semaine : ce n’est pas une longue fin de semaine.' : ' It falls midweek, so it isn’t a long weekend.'}`
          : '', gLw]);
      }
    }

    const nx = here.find((x) => dayOff(x) > today) ?? nextHoliday(all, p, today);
    if (!nx) return out(fr ? 'Voici les *jours fériés* de l’année.' : 'Here are this year’s *statutory holidays*.', [countLine]);
    const name = holidayName(nx, p, lang);
    const lw = longWeekend(dayOff(nx), offDaysFor(all, p));
    const nextPhrase = fr
      ? `${p ? `le prochain jour férié ${inP}` : 'le prochain jour férié fédéral'} est ${em(name, 'fr')}, le ${d(dayOff(nx))}`
      : `${p ? `the next statutory holiday ${inP}` : 'the next federal holiday'} is ${em(name, 'en')}, on ${d(dayOff(nx))}`;
    // Today's holiday is never "next": it leads, and the next one follows.
    const head = todayH ? todayLine : `${cap(nextPhrase)}.`;
    const lwLine = lw
      ? fr
        ? `C’est une longue fin de semaine de ${lw.days} jours, du ${fmt(lw.start, 'fr', { day: 'numeric', month: 'long' })} au ${fmt(lw.end, 'fr', { day: 'numeric', month: 'long' })}.`
        : `That’s a ${lw.days}-day long weekend, ${fmt(lw.start, 'en', { month: 'long', day: 'numeric' })} to ${fmt(lw.end, 'en', { month: 'long', day: 'numeric' })}.`
      : '';
    const gNext = g ? holidaysFor(all, g).stat.find((x) => dayOff(x) > today) : undefined;
    const gLine =
      g && gNext
        ? fr
          ? `${basedOnZone(g, 'fr')}, le prochain jour férié est ${inSentence(holidayName(gNext, g, 'fr'), 'fr')}, le ${d(dayOff(gNext))}.`
          : `${basedOnZone(g, 'en')}, the next statutory holiday is ${inSentence(holidayName(gNext, g, 'en'), 'en')}, on ${d(dayOff(gNext))}.`
        : '';
    const vary = fr ? `Les jours fériés varient selon la province ou le territoire. ${c(HOLIDAYS_SITE.fr)}` : `Statutory holidays vary by province and territory. ${c(HOLIDAYS_SITE.en)}`;
    return out(head, [`${todayH ? `${cap(nextPhrase.replace(/\*/g, ''))}.` : ''} ${lwLine} ${p ? countLine : vary}`, gLine]);
  },
  toolCalls: [
    {
      toolName: 'datesHolidays',
      input: ({ text, lang, timeZone }: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => ({
        province: provinceIn(text),
        holiday: holidayIn(text),
        year: /\b2027\b/.test(text) ? 2027 : undefined,
        longWeekend: /\blong weekends?\b|longues? fins? de semaine|long(s)? week-ends?/i.test(text) || undefined,
        lang,
        // The time zone lets the widget open on the same province the payments calendar guessed (marked "Based on
        // your time zone"); the answer above stays federal unless the question names a place.
        timeZone,
      }),
    },
  ],
  followUps: {
    en: ['Is today a holiday?', 'Add the holidays to my calendar', 'Show me the 2026 benefit payment dates'],
    fr: ['Est-ce férié aujourd’hui?', 'Ajouter les jours fériés à mon calendrier', 'Afficher les dates de versement des prestations de 2026'],
  },
};
