/**
 * Scripted scenario `dates-key-dates` (EN + FR). "What are the key dates?": the next payment, deadline and holiday
 * together. "What are the key tax dates?": the tax deadlines alone, and the calendar opens on taxes only.
 */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../../../data/holidays';
import type { Program, TaxKind } from '../data';
import { PROGRAM_NAMES, TAX_NAMES } from '../fallback';
import { taxDates } from '../build';
import { dayOff, nextHoliday } from '../select';
import { provinceIn, programsIn, fmt, fmtY, payments, holidays, C } from './shared';

/** A question about taxes alone ("key tax dates", « calendrier fiscal »), not about benefits, payments or holidays. */
const TAX_WORDS = /\btax(es)?\b|\bRRSP\b|\bimp[oô]ts?\b|\bfisca(l|le|ux)\b|\bREER\b/i;
const OTHER_WORDS = /\b(benefits?|payments?|pay ?days?|holidays?|days? off)\b|prestations?|versements?|paiements?|férié|congés?/i;
const taxAsk = (text: string) => TAX_WORDS.test(text) && !OTHER_WORDS.test(text) && !programsIn(text).length;

export const keyDatesScenario: Scenario = {
  id: 'dates-key-dates',
  priority: 7,
  checked: '2026-09-30',
  match: [
    /\b(key|important) (tax |government |benefit )?dates\b/i,
    /\b(tax|government|benefits?) calendar\b/i,
    /\bwhat dates should i (know|remember)\b/i,
    /\bdates (clés|importantes)\b/i,
    /\bcalendrier (fiscal|des impôts)\b/i,
  ],
  reply: {
    en: `# {head}

{lines}

{body}`,
    fr: `# {head}

{lines}

{body}`,
  },
  vars: async ({ text, lang }) => {
    const today = todayInCanada();
    const fr = lang === 'fr';
    const sep = fr ? ' :' : ':';
    const day = (iso: string) => fmtY(iso, lang, { month: 'long', day: 'numeric' });
    const bullets = (items: { d: string; what: string }[]) => items.map((i) => `- **${day(i.d)}**${sep} ${i.what}`).join('\n');
    const ahead = taxDates().filter((t) => t.date >= today);
    const next = (kind: TaxKind) => ahead.find((t) => t.kind === kind);
    const file = next('file');
    const self = next('selfEmployed');
    const rrsp = next('rrsp');
    const year = String(file?.year ?? rrsp?.year ?? today.slice(0, 4));
    // What the filing rule and the RRSP rule say, with this year's dates (both answers close on them).
    const filing = file
      ? fr
        ? `Pour vos impôts de ${year}, la date limite de production et de paiement est le **${day(file.date)}**${self ? `, ou le ${day(self.date)} pour produire si vous ou votre époux ou conjoint de fait étiez travailleur autonome (le solde dû reste exigible le ${fmt(file.date, 'fr', { month: 'long', day: 'numeric' })})` : ''}. [1](${C.filing.fr})`
        : `For your ${year} taxes, the filing and payment deadline is **${day(file.date)}**${self ? `, or ${day(self.date)} to file if you or your spouse or partner were self-employed (any balance is still due ${fmt(file.date, 'en', { month: 'long', day: 'numeric' })})` : ''}. [1](${C.filing.en})`
      : '';
    const rrspLine = rrsp
      ? fr
        ? `Les cotisations au REER versées dans les 60 premiers jours de ${rrsp.date.slice(0, 4)} (jusqu’au **${day(rrsp.date)}**${rrsp.expected ? ', date prévue' : ''}) comptent pour ${rrsp.year}. [2](${(rrsp.expected ? C.rrspRule : C.rrsp).fr})`
        : `RRSP contributions made in the first 60 days of ${rrsp.date.slice(0, 4)} (up to **${day(rrsp.date)}**${rrsp.expected ? ', expected' : ''}) count for ${rrsp.year}. [2](${(rrsp.expected ? C.rrspRule : C.rrsp).en})`
      : '';

    if (taxAsk(text)) {
      // Every deadline up to the next self-employed filing date, in order, named as the calendar names them.
      const until = self?.date ?? file?.date ?? ahead.at(-1)?.date ?? today;
      const items = ahead
        .filter((t) => t.date <= until)
        .map((t) => ({
          d: t.date,
          what:
            TAX_NAMES[t.kind][lang] +
            (t.kind === 'instalment' ? (fr ? ' (si vous payez par acomptes)' : ' (if you pay by instalments)') : '') +
            (t.expected ? (fr ? ' (date prévue)' : ' (expected)') : '') +
            (t.onTimeBy ? (fr ? ` (à temps jusqu’au ${day(t.onTimeBy)})` : ` (on time until ${day(t.onTimeBy)})`) : ''),
        }));
      const head = file
        ? fr
          ? `Pour la plupart des gens, la prochaine échéance fiscale est le *${day(file.date)}*.`
          : `For most people, the next tax deadline is *${day(file.date)}*.`
        : fr
          ? 'Voici vos prochaines *échéances fiscales*.'
          : 'Here are your next *tax deadlines*.';
      const instalments = fr
        ? `Si vous payez votre impôt par acomptes provisionnels, ils sont dus le 15 mars, le 15 juin, le 15 septembre et le 15 décembre. [3](${C.instalments.fr})`
        : `If you pay your tax by instalments, they are due March 15, June 15, September 15 and December 15. [3](${C.instalments.en})`;
      const outro = fr
        ? 'Le calendrier ci-dessous ne montre que les échéances fiscales : ajoutez-les à votre calendrier, avec un rappel la veille.'
        : 'The calendar below shows only the tax deadlines: add them to your calendar with a reminder the day before.';
      return { head, lines: bullets(items), body: [`${filing} ${rrspLine}`.trim(), instalments, outro].join('\n\n') };
    }

    const [pay, all] = await Promise.all([payments(), holidays()]);
    const p = provinceIn(text) ?? null;
    const items: { d: string; what: string }[] = [];
    const nextPay = (['cgeb', 'ccb', 'oas'] as Program[]).map((k) => ({ k, d: pay[k].find((x) => x >= today) })).filter((x) => x.d);
    for (const x of nextPay) items.push({ d: x.d!, what: PROGRAM_NAMES[x.k][lang] });
    const hol = nextHoliday(all, p, today);
    if (hol) items.push({ d: dayOff(hol), what: hol.name[lang] });
    const tax = ahead[0];
    if (tax) items.push({ d: tax.date, what: fr ? (tax.kind === 'instalment' ? 'Acompte provisionnel d’impôt (si vous payez par acomptes)' : 'Échéance fiscale') : tax.kind === 'instalment' ? 'Tax instalment due (if you pay by instalments)' : 'Tax deadline' });
    items.sort((a, b) => a.d.localeCompare(b.d));
    const calendar = fr
      ? `Les versements de prestations sont émis aux dates du calendrier officiel et peuvent prendre quelques jours à arriver. [3](${C.payCal.fr})`
      : `Benefit payments are issued on the dates in the official calendar and can take a few days to arrive. [3](${C.payCal.en})`;
    return {
      head: fr ? 'Voici votre année en un coup d’œil : versements, échéances et *congés*.' : 'Here’s your year at a glance: payments, deadlines and *days off*.',
      lines: bullets(items),
      body: [`${filing} ${rrspLine}`.trim(), calendar].join('\n\n'),
    };
  },
  toolCalls: [
    {
      toolName: 'datesCalendar',
      input: ({ text, lang, timeZone }: { text: string; lang: 'en' | 'fr'; timeZone?: string }) => ({ focus: taxAsk(text) ? 'taxes' : 'all', province: provinceIn(text), lang, timeZone }),
    },
  ],
  followUps: {
    en: ['Add my tax deadlines to my calendar', 'When is the next long weekend?', 'When is the tax deadline?'],
    fr: ['Ajouter mes échéances fiscales à mon calendrier', 'À quand la prochaine longue fin de semaine?', 'Quelle est la date limite pour les impôts?'],
  },
};
