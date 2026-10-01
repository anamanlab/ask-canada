/**
 * "My passport expires in March": the answer runs the same planner the widget shows, so the text can never
 * contradict the card under it: online renewal open now, open if it expires by a date, opening on a date, or
 * the passport already expired.
 */
import { URLS } from '../data';
import { planRenewal } from '../plan';
import type { PlannerOutput } from '../types';
import { agreed, readerDays } from './days';
import { cite, dayMonth, longDate, monthYear } from './format';
import { planOutro, renewReply } from './general';
import { expiryFrom, type L } from './parse';

const planFor = (text: string, lang: L, today: string) => planRenewal({ expiry: expiryFrom(text, today), lang }, today);

const NO_GUARANTOR = {
  en: 'Renewing is simpler than applying for a new passport: you **don’t need a guarantor, proof of citizenship or supporting ID**. You’ll still need **2 references**.',
  fr: 'Renouveler est plus simple que présenter une nouvelle demande : vous **n’avez pas besoin de répondant, de preuve de citoyenneté ni de pièce d’identité**. Il vous faudra tout de même **2 références**.',
};
const CANCELS = {
  en: 'One catch: applying online **cancels your current passport right away**. If you’re travelling in the next 20 business days, apply in person instead.',
  fr: 'Attention : une demande en ligne **annule immédiatement votre passeport actuel**. Si vous voyagez dans les 20 prochains jours ouvrables, faites plutôt la demande en personne.',
};

function expiredAnswer(lang: L, month: string) {
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  return lang === 'fr'
    ? `# Vous pouvez encore renouveler un passeport expiré, et même *en ligne*.

Votre passeport a expiré en ${month}. S’il s’agissait d’un passeport pour adulte délivré au cours des 15 dernières années, vous pouvez le renouveler plutôt que de présenter une nouvelle demande, sans répondant, preuve de citoyenneté ni pièce d’identité. Il vous faudra **2 références**. [1](${u('renew')}) [2](${u('whoCanRenew')})

Le **renouvellement en ligne** est possible quand votre passeport expire dans les 6 prochains mois ou qu’il est déjà expiré. Le traitement prend jusqu’à **20 jours ouvrables, plus la livraison**. [3](${u('online')}) [4](${u('processing')})

Vous devez voyager bientôt? Présentez plutôt votre demande en personne à un bureau des passeports, où le service de retrait urgent ou express est offert. [5](${u('urgent')})

${planOutro(lang)}`
    : `# You can still renew an expired passport, and you can do it *online*.

Your passport expired in ${month}. If it was an adult passport issued in the last 15 years, you can renew it instead of applying for a new one, with no guarantor, proof of citizenship or supporting ID. You’ll need **2 references**. [1](${u('renew')}) [2](${u('whoCanRenew')})

**Online renewal** is open when your passport expires in the next 6 months or is already expired. It takes up to **20 business days, plus mailing**. [3](${u('online')}) [4](${u('processing')})

Need to travel soon? Apply in person at a passport office instead, where urgent and express service are available. [5](${u('urgent')})

${planOutro(lang)}`;
}

/**
 * Online renewal is open. `edge` is how sure the text can be about this passport:
 * - 'inside': the whole expiry month is within 6 months ("and yours is");
 * - 'by': the 6-month line falls inside the month, so it's open "if it expires by {date}", like the widget;
 * - 'near': the line is within a day of the month and the reader's date isn't known for sure, so the text
 *   states the rule and leaves the exact date to the planner.
 */
function openAnswer(lang: L, month: string, edge: 'inside' | 'by' | 'near', by: string) {
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  const fr = lang === 'fr';
  const head = fr
    ? { inside: `Vous pouvez renouveler votre passeport *en ligne* : il expire en ${month}, dans les 6 prochains mois.`, by: `Vous pouvez renouveler votre passeport, et *en ligne* s’il expire au plus tard le ${dayMonth(by, lang)}.`, near: 'Vous pouvez renouveler votre passeport, et *en ligne* dès qu’il expire dans les 6 prochains mois.' }
    : { inside: `You can renew your passport *online*: it expires in ${month}, within the next 6 months.`, by: `You can renew your passport, and *online* if it expires by ${dayMonth(by, lang)}.`, near: 'You can renew your passport, and *online* once it’s within 6 months of expiring.' };
  const rule = fr
    ? { inside: 'Le **renouvellement en ligne** est possible quand votre passeport expire dans les 6 prochains mois, et c’est votre cas.', by: `Le **renouvellement en ligne** est possible quand votre passeport expire dans les 6 prochains mois, donc c’est possible pour vous s’il expire au plus tard le ${longDate(by, lang)}.`, near: `Le **renouvellement en ligne** est possible quand votre passeport expire dans les 6 prochains mois. Un passeport qui expire en ${month} y arrive ces jours-ci : le planificateur ci-dessous indique la date limite exacte pour vous.` }
    : { inside: '**Online renewal** is open once your passport is within 6 months of expiring, and yours is.', by: `**Online renewal** is open once your passport is within 6 months of expiring, so it’s open to you if it expires by ${longDate(by, lang)}.`, near: `**Online renewal** is open once your passport is within 6 months of expiring. A passport that expires in ${month} is reaching that point right about now: the planner below shows the exact cut-off date for you.` };
  const takes = fr ? 'Le traitement prend jusqu’à **20 jours ouvrables, plus la livraison**.' : 'It takes up to **20 business days, plus mailing**.';
  return `# ${head[edge]}

${NO_GUARANTOR[lang]} [1](${u('renew')})

${rule[edge]} ${takes} [2](${u('online')}) [3](${u('processing')})

${CANCELS[lang]} [2](${u('online')})

${planOutro(lang)}`;
}

function laterAnswer(lang: L, month: string, opens: string) {
  const u = (k: keyof typeof URLS) => URLS[k][lang];
  return lang === 'fr'
    ? `# Vous pouvez renouveler votre passeport, et le *renouvellement en ligne* sera possible dès le ${opens}.

${NO_GUARANTOR.fr} [1](${u('renew')})

Votre passeport expire en ${month}. Le renouvellement en ligne est possible quand il expire dans les 6 prochains mois, donc à partir du ${opens}. [2](${u('online')})

Pas besoin d’attendre : vous pouvez présenter votre demande en personne ou par la poste en tout temps. Dans un bureau des passeports, le traitement prend 10 jours ouvrables; par la poste, 20 jours ouvrables, plus la livraison. [3](${u('processing')})

${planOutro(lang)}`
    : `# You can renew your passport, and *online renewal* opens on ${opens}.

${NO_GUARANTOR.en} [1](${u('renew')})

Your passport expires in ${month}. You can renew online once it’s within 6 months of expiring, so from ${opens}. [2](${u('online')})

You don’t have to wait: you can apply in person or by mail at any time. At a passport office it takes 10 business days; by mail, 20 business days plus mailing. [3](${u('processing')})

${planOutro(lang)}`;
}

const monthOf = (plan: PlannerOutput, lang: L) => monthYear(plan.expiry!.start.slice(0, 7), lang);

function answerOn(text: string, lang: L, today: string) {
  const plan = planFor(text, lang, today);
  const exp = plan.expiry!;
  const month = monthOf(plan, lang);
  if (plan.expired) return expiredAnswer(lang, month);
  if (!plan.methods.online.available) return laterAnswer(lang, month, longDate(plan.onlineOpensOn!, lang));
  // The 6-month line can fall inside the month ("if it expires by March 30"): the answer says so, like the widget.
  const straddles = exp.start <= plan.onlineOpenIfExpiresBy && plan.onlineOpenIfExpiresBy < exp.end;
  return openAnswer(lang, month, straddles ? 'by' : 'inside', plan.onlineOpenIfExpiresBy);
}

/** `timeZone` is the reader's, when the question came with it: the answer then counts from their date. */
export function monthAnswer(text: string, lang: L, timeZone?: string) {
  const days = readerDays(timeZone);
  const sure = agreed(days, (today) => answerOn(text, lang, today));
  if (sure) return cite(sure);
  // The reader's date decides the wording and we can't be sure of it: say only what's true on every one of them.
  const plans = days.map((today) => planFor(text, lang, today));
  const sameMonth = plans.every((p) => p.expiry!.start === plans[0].expiry!.start);
  if (sameMonth && plans.every((p) => !p.expired && p.methods.online.available)) return cite(openAnswer(lang, monthOf(plans[0], lang), 'near', plans[0].onlineOpenIfExpiresBy));
  return cite(renewReply(lang, 'plan'));
}
