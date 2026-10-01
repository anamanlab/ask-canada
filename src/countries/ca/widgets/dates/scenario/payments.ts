/** Scripted scenario `dates-payment-calendar` (EN + FR). "When is my payment?": the next payment date for the programs named, with the wait before calling. */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../../../data/holidays';
import { URLS, type Program } from '../data';
import { PROGRAM_NAMES } from '../fallback';
// The button's own label, so the answer names the control exactly as it reads on screen.
import widgetEn from '../messages/en.json';
import widgetFr from '../messages/fr.json';
import { QPP_RE, CPP_NAMED, programsIn, provinceIn, monthIn, fmt, ofProgram, waitLine, list, cap, payments, C, PAY_PROGRAMS_EN, PAY_PROGRAMS_FR } from './shared';

export const paymentCalendarScenario: Scenario = {
  id: 'dates-payment-calendar',
  priority: 8,
  checked: '2026-09-30',
  exclude: [
    /\b(new ?comers?|new to canada|just (arrived|moved)|immigra\w*|nouvel(le)? arrivante?|je viens d[’']arriver)\b/i,
  ],
  match: [
    /\b(benefits?|payments?|pay ?days?) (calendar|schedule)\b/i,
    /\b(all|every|full list of|list of|20\d\d)\b.*\b(benefit |government )?payment dates?\b/i,
    /\bpayment dates?\b.*\b(for )?20\d\d\b/i,
    new RegExp(`\\b(${PAY_PROGRAMS_EN})\\b.*\\b(pay(ment)?s? ?(dates?|days?)|paid|deposit(ed)?|come in|arrive|payments?|cheques?)\\b`, 'i'),
    // "When is my next CCB payment?", "next GST deposit", "When do I get my child benefit?"
    new RegExp(`\\bnext (${PAY_PROGRAMS_EN})\\b`, 'i'),
    /\bwhen\b.*\b(do|does|will|is|am)\b.*\b(pension|OAS|CPP|QPP|CCB|child benefits?|GST|HST|CGEB)\b.*\b(paid|come|deposited|arrive|get)\b/i,
    /\bwhen (do|will) i get (my )?(CCB|child benefits?|GST|HST|CGEB|OAS|CPP|pension)\b/i,
    /\bcalendrier des (versements|paiements|prestations)\b/i,
    /\b(toutes les|liste des|calendrier des)\b.*\bdates de (versement|paiement)/i,
    /\bdates de (versement|paiement)s?\b.*\b20\d\d\b/i,
    new RegExp(`(${PAY_PROGRAMS_FR})[\\s\\S]*\\b(versements?|versée?s?|paiements?|payée?s?|dépôts?|déposée?s?)`, 'i'),
    // « Quand est le prochain versement de l’allocation canadienne pour enfants? »: the payment word comes first.
    new RegExp(`\\b(prochain|prochaine|quand)\\b[\\s\\S]*\\b(versements?|paiements?|dépôts?)\\b[\\s\\S]*(${PAY_PROGRAMS_FR})`, 'i'),
    /\bquand\b[\s\S]*\b(rente|pension)\b[\s\S]*\b(versée?s?|payée?s?|déposée?s?)/i,
  ],
  reply: {
    en: `# {head}

{lines}

{amount}Payments are issued on these dates but can take a few days to reach you, and cheques take longer than direct deposit. [1](${C.payCal.en})

{wait}

{qpp}The calendar below has every date. Choose what you follow, then add the dates to your phone’s calendar with a reminder the day before.`,
    fr: `# {head}

{lines}

{amount}Les versements sont émis à ces dates, mais peuvent prendre quelques jours à arriver, et les chèques prennent plus de temps que le dépôt direct. [1](${C.payCal.fr})

{wait}

{qpp}Le calendrier ci-dessous présente toutes les dates. Choisissez ce que vous suivez, puis ajoutez les dates au calendrier de votre téléphone, avec un rappel la veille.`,
  },
  vars: async ({ text, lang }) => {
    const today = todayInCanada();
    const pay = await payments();
    const asked = programsIn(text);
    const month = monthIn(text, today);
    // Quebec: the Quebec Pension Plan (Retraite Québec) pays most retirement pensions, so the CPP isn't assumed.
    const qppNamed = QPP_RE.test(text) && !CPP_NAMED.test(text);
    const quebec = provinceIn(text) === 'QC' || qppNamed || /\brente\b/i.test(text);
    const progs: Program[] = asked.length ? asked : (['cgeb', 'cwb', 'cdb', 'ccb', 'oas', 'cpp'] as Program[]).filter((x) => !(quebec && x === 'cpp'));
    const short = (iso: string) => fmt(iso, lang, { month: 'long', day: 'numeric' });
    const sep = lang === 'fr' ? '\u00a0:' : ':';
    // Dates in the month they asked about, or the next one(s) from today.
    const pick = (p: Program) => (month ? pay[p].filter((d) => d.startsWith(month)) : pay[p].filter((d) => d >= today));
    const next = progs.map((p) => ({ p, d: pick(p)[0] })).filter((x): x is { p: Program; d: string } => Boolean(x.d));
    next.sort((a, b) => a.d.localeCompare(b.d));
    const wait = waitLine(asked.length ? asked : progs, lang, { cra: `[2](${C.craPay[lang]})`, cal: `[1](${C.payCal[lang]})` });
    // Cited after the wait line, so its number follows the CRA page's when that one is cited.
    const qn = `[${wait.includes('[2](') ? 3 : 2}](${URLS.cppQuebec[lang]})`;
    const who =
      lang === 'fr'
        ? 'si vous avez travaillé uniquement au Québec, ou au Québec et ailleurs et que vous y vivez maintenant'
        : 'if you worked only in Quebec, or worked there and elsewhere and live in Quebec now';
    const qpp = qppNamed
      ? lang === 'fr'
        ? `Le calendrier ci-dessous couvre les programmes fédéraux : pour les dates du Régime de rentes du Québec, vérifiez auprès de Retraite Québec. C’est Retraite Québec qui verse votre rente de retraite ${who}. ${qn}\n\n`
        : `The calendar below covers federal programs: for Quebec Pension Plan dates, check with Retraite Québec. Retraite Québec pays your retirement pension ${who}. ${qn}\n\n`
      : quebec && progs.includes('cpp')
        ? lang === 'fr'
          ? `Vous vivez au Québec? ${cap(who)}, c’est le Régime de rentes du Québec, versé par Retraite Québec, qui paie votre rente de retraite, pas le RPC. ${qn}\n\n`
          : `Living in Quebec? ${cap(who)}, your retirement pension comes from the Quebec Pension Plan, paid by Retraite Québec, not the CPP. ${qn}\n\n`
        : '';
    if (!next.length) {
      return lang === 'fr'
        ? { head: 'Ces dates de versement ne sont *pas encore publiées*.', lines: 'Le calendrier officiel les affichera dès leur publication.', wait, qpp, amount: '' }
        : { head: 'Those payment dates *aren’t published yet*.', lines: 'The official calendar will list them as soon as they’re out.', wait, qpp, amount: '' };
    }
    const first = next[0];
    const sameP = next.filter((x) => x.d === first.d).map((x) => x.p);
    const same = sameP.map((p) => PROGRAM_NAMES[p][lang]);
    const day = fmt(first.d, lang);
    // French: « Le prochain versement de l’Allocation canadienne pour enfants est le mardi 20 octobre. »
    const deFr = list(sameP.map(ofProgram), 'fr');
    const many = sameP.length > 1;
    // « Ma rente » from Quebec, without naming the CPP: most likely the Quebec plan, so that leads.
    // "How much is my next CCB payment?": the date is here, the amount is only in their own account (the widget's handoff).
    const amount = /\b(how much|amount|combien|montant)\b/i.test(text)
      ? lang === 'fr'
        ? `Le montant dépend de votre situation, alors il n’est pas affiché ici : touchez **${widgetFr['handoff.label']}** ci-dessous pour ouvrir une session et voir le vôtre.\n\n`
        : `Amounts depend on your situation, so they aren’t shown here: tap **${widgetEn['handoff.label']}** below to sign in and see yours.\n\n`
      : '';
    const renteInQuebec = provinceIn(text) === 'QC' && asked.includes('cpp') && !CPP_NAMED.test(text);
    const head = qppNamed && !asked.length
      ? lang === 'fr'
        ? 'Le Régime de rentes du Québec est versé par *Retraite Québec*, pas par le RPC.'
        : 'The Quebec Pension Plan is paid by *Retraite Québec*, not the CPP.'
      : renteInQuebec
      ? lang === 'fr'
        ? 'Au Québec, votre rente vient sans doute du *Régime de rentes du Québec*, pas du RPC.'
        : 'In Quebec, your pension most likely comes from the *Quebec Pension Plan*, not the CPP.'
      : asked.length
      ? month
        ? lang === 'fr'
          ? `${many ? 'Les versements' : 'Le versement'} ${deFr} ${many ? 'sont' : 'est'} le *${day}*.`
          : `${list(same, 'en')} ${many ? 'are' : 'is'} paid on *${day}*.`
        : lang === 'fr'
          ? `${many ? 'Les prochains versements' : 'Le prochain versement'} ${deFr} ${many ? 'sont' : 'est'} le *${day}*.`
          : `Your next ${list(same, 'en')} payment${many ? 's land' : ' lands'} on *${day}*.`
      : lang === 'fr'
        ? 'Toutes les dates de versement de 2026, *dans un seul calendrier*.'
        : 'Every 2026 benefit payment date, *in one calendar*.';
    // "… dates for 2026": every date that year; otherwise the next three.
    const year = month ? undefined : text.match(/\b(20\d\d)\b/)?.[1];
    const lines = asked.length
      ? asked
          .map((p) => {
            const ds = year ? pay[p].filter((d) => d.startsWith(year)) : pay[p].filter((d) => d >= today).slice(0, 3);
            return ds.length ? `- **${PROGRAM_NAMES[p][lang]}**${sep} ${list(ds.map(short), lang)}` : '';
          })
          .filter(Boolean)
          .join('\n')
      : next.map((x) => `- **${PROGRAM_NAMES[x.p][lang]}**${sep} ${fmt(x.d, lang)}`).join('\n');
    const intro = renteInQuebec
      ? lang === 'fr'
        ? 'Si vous recevez le RPC, les prochaines dates'
        : 'If you get the CPP, the next dates'
      : asked.length
      ? year
        ? lang === 'fr'
          ? `Toutes les dates de ${year}`
          : `Every date in ${year}`
        : lang === 'fr'
          ? 'Les prochaines dates'
          : 'The next dates'
      : lang === 'fr'
        ? 'Prochaines dates'
        : 'Next dates';
    return { head, lines: `${intro}${sep}\n\n${lines}`, wait, qpp, amount };
  },
  toolCalls: [
    {
      toolName: 'datesCalendar',
      input: ({ text, lang, timeZone }: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => ({
        programs: programsIn(text).length ? programsIn(text) : undefined,
        focus: 'payments',
        month: monthIn(text, todayInCanada()),
        province: provinceIn(text) ?? (QPP_RE.test(text) && !CPP_NAMED.test(text) ? 'QC' : undefined),
        lang,
        timeZone,
      }),
    },
  ],
  followUps: {
    en: ['When is the next long weekend?', 'Add my tax deadlines to my calendar', 'Is Remembrance Day a stat holiday in Ontario?'],
    fr: ['À quand la prochaine longue fin de semaine?', 'Ajouter mes échéances fiscales à mon calendrier', 'Le jour du Souvenir est-il férié en Ontario?'],
  },
};
