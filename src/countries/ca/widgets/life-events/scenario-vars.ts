/**
 * Scripted scenarios for life events: the parts of an answer worked out from a date in the question (the 60-day
 * mark for the CPP death benefit, the final return's due date with its weekend and holiday rollover).
 */
import { addDays } from '@/lib/dates/business-days';
import { formatDate } from '@/lib/i18n/format';
import { todayInCanada } from '../../data/holidays';
import { ordinalDay } from './model';
import { finalReturnDue } from './plan';
import { dateIn, dateLine, type Lang } from './scenario-helpers';

/** Exact dates when the person gave the date of death; the general rules otherwise. */
export function deathVars({ text, lang }: { text: string; lang: Lang }): Record<string, string> {
  const line = dateLine(
    'death',
    'past',
    {
      en: 'Here’s a checklist. Add the date of death to see the exact dates.',
      fr: 'Voici une liste. Ajoutez la date du décès pour voir les dates exactes.',
    },
    { en: 'Here’s a checklist, with the exact dates for your situation.', fr: 'Voici une liste, avec les dates exactes pour votre situation.' },
  )({ text, lang });
  const today = todayInCanada();
  const death = dateIn(text, 'past', today);
  if (!death) {
    return {
      ...line,
      benefitDue:
        lang === 'fr' ? 'L’exécuteur testamentaire devrait faire la demande dans les 60 jours.' : 'The executor should apply within 60 days.',
      finalReturn:
        lang === 'fr'
          ? 'Sa **déclaration de revenus finale** est due le 30 avril de l’année suivante pour un décès de janvier à octobre, ou 6 mois après le décès pour novembre ou décembre. Une date limite qui tombe une fin de semaine ou un jour férié est reportée au jour ouvrable suivant.'
          : 'Their **final tax return** is due April 30 of the next year for a death from January to October, or 6 months after the death for November or December. A due date on a weekend or holiday moves to the next business day.',
    };
  }
  const intl = lang === 'fr' ? 'fr-CA' : 'en-CA';
  const f = (iso: string) => ordinalDay(formatDate(iso, intl, { month: 'long', day: 'numeric', year: 'numeric' }), intl);
  const sixty = addDays(death, 60);
  const { raw, due } = finalReturnDue(death);
  // CRA guidance: state the weekend and holiday rule with every due date, and name the rollover when it applies.
  const rolled =
    raw === due
      ? lang === 'fr'
        ? ' Une date limite qui tombe une fin de semaine ou un jour férié est reportée au jour ouvrable suivant.'
        : ' A due date on a weekend or holiday moves to the next business day.'
      : lang === 'fr'
        ? ` La date d’échéance, le ${f(raw)}, ${due < today ? 'n’était' : 'n’est'} pas un jour ouvrable : la production ${due < today ? 'était' : 'est'} donc à temps jusqu’au ${f(due)}.`
        : ` The due date, ${f(raw)}, ${due < today ? 'wasn’t' : 'isn’t'} a business day, so filing ${due < today ? 'was' : 'is'} on time until ${f(due)}.`;
  const benefitDue =
    sixty >= today
      ? lang === 'fr'
        ? `L’exécuteur testamentaire devrait faire la demande dans les 60 jours, soit d’ici le ${f(sixty)}.`
        : `The executor should apply within 60 days, so by ${f(sixty)}.`
      : lang === 'fr'
        ? `L’exécuteur testamentaire devrait faire la demande dans les 60 jours. Ce délai a pris fin le ${f(sixty)}, alors faites-la dès que possible.`
        : `The executor should apply within 60 days. That time ended on ${f(sixty)}, so apply as soon as you can.`;
  const late = due < today;
  const finalReturn =
    lang === 'fr'
      ? `Pour un décès survenu le ${f(death)}, sa **déclaration de revenus finale** ${late ? 'était due' : 'est due'} le ${f(due)}.${rolled} ${late ? 'Produisez-la dès que possible.' : 'Si la personne, ou l’époux ou le conjoint de fait qui vivait avec elle, exploitait une entreprise, la production peut être plus tardive, mais le solde dû reste exigible à cette date.'}`
      : `For a death on ${f(death)}, their **final tax return** ${late ? 'was due' : 'is due'} ${f(due)}.${rolled} ${late ? 'File it as soon as you can.' : 'If they, or a spouse or partner living with them, ran a business, filing can be later, but any balance owing is still due then.'}`;
  return { ...line, benefitDue, finalReturn };
}

/** The exact due date of the final return, for a question that gives the date of death. */
export function finalReturnVars({ text, lang }: { text: string; lang: Lang }): Record<string, string> {
  const today = todayInCanada();
  const death = dateIn(text, 'past', today);
  if (!death) return { due: '', death: '', rolled: '' };
  const intl = lang === 'fr' ? 'fr-CA' : 'en-CA';
  const f = (iso: string) => ordinalDay(formatDate(iso, intl, { month: 'long', day: 'numeric', year: 'numeric' }), intl);
  const { raw, due } = finalReturnDue(death);
  const rolled =
    raw === due
      ? lang === 'fr'
        ? 'Une date limite qui tombe une fin de semaine ou un jour férié est reportée au jour ouvrable suivant. '
        : 'A due date on a weekend or holiday moves to the next business day. '
      : lang === 'fr'
        ? `La date d’échéance, le ${f(raw)}, ${due < today ? 'n’était' : 'n’est'} pas un jour ouvrable : la production ${due < today ? 'était' : 'est'} donc à temps jusqu’au ${f(due)}. `
        : `The due date, ${f(raw)}, ${due < today ? 'wasn’t' : 'isn’t'} a business day, so filing ${due < today ? 'was' : 'is'} on time until ${f(due)}. `;
  return { due: f(due), death: f(death), rolled };
}
