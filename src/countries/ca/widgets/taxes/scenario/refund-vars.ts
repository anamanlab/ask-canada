/**
 * The refund-status and deadline answers: the verdict heading and dates, from the same computation as the widget.
 */
import { addDays } from '@/lib/dates/business-days';
import { todayInCanada } from '../../../data/holidays';
import { onTime, planDeadlines } from '../calc/deadlines';
import { refundStatus } from '../calc/refund';
import { REFUND } from '../data';
import { d, refundInput, selfEmployed, type Lang } from './parse-question';

export function refundVars(text: string, lang: Lang) {
  const fr = lang === 'fr';
  const i = refundInput(text);
  const paper = i.method === 'paper';
  const today = todayInCanada();
  const on = (day: string) => refundStatus({ filedOn: i.filedOn ?? null, method: i.method ?? 'online', abroad: !!i.abroad, onTime: i.onTime ?? null, today: day });
  const r = on(today);
  // The reader's own date can be a day either side of the capital's, and the widget follows the reader. Only
  // give a verdict that holds on all three days; on the day a stage turns over, the general rule is the answer.
  const steady = on(addDays(today, -1)).stage === r.stage && on(addDays(today, 1)).stage === r.stage;
  const weeksAgo = r.elapsedDays != null ? Math.round(r.elapsedDays / 7) : 0;
  // Whole weeks only: a day count could be one off from the reader's own calendar.
  const since = r.elapsedDays == null || r.elapsedDays < 14 ? '' : fr ? `Cela fait ${weeksAgo} semaines` : `It’s been ${weeksAgo} weeks`;
  const closingKnown = fr
    ? 'Votre échéancier est ci-dessous. Changez la date ou le mode de production s’ils ne sont pas exacts.'
    : 'Your timeline is below. Change the date or how you filed if they’re not right.';
  const closingUnknown = fr
    ? 'Le suivi ci-dessous place votre déclaration sur le calendrier de l’ARC dès que vous indiquez quand vous l’avez produite.'
    : 'The tracker below places your return on the CRA’s timeline once you tell it when you filed.';
  const general = paper
    ? fr ? `Pour une déclaration papier produite à temps, comptez jusqu’à *${REFUND.paperWeeks} semaines*.` : `Paper returns filed on time can take up to *${REFUND.paperWeeks} weeks* to assess.`
    : fr ? `Les déclarations produites en ligne à temps sont habituellement traitées en *${REFUND.digitalWeeks} semaines*.` : `Returns filed online on time are usually assessed within *${REFUND.digitalWeeks} weeks*.`;
  let heading = general;
  if (steady) {
    switch (r.stage) {
      case 'late':
        // Short verdict; the "late returns have no set timeline" explanation lives in the body and the widget.
        heading = fr ? `Vous pourrez communiquer avec l’ARC après le *${d(r.contactAfter!, lang)}*.` : `You can contact the CRA after *${d(r.contactAfter!, lang)}*.`;
        break;
      case 'processing':
        heading = fr ? `Vous devriez recevoir votre avis de cotisation d’ici le *${d(r.expectedBy!, lang)}*.` : `Expect your notice of assessment by *${d(r.expectedBy!, lang)}*.`;
        break;
      case 'due':
        heading = fr
          ? `${since}, soit plus que le délai habituel de *${r.weeks} semaines* pour les déclarations en ligne produites à temps.`
          : `${since}, past the usual *${r.weeks}-week* window for on-time online returns.`;
        break;
      case 'contact':
        heading = fr ? `${since}. Vous pouvez maintenant *communiquer avec l’ARC*.` : `${since}, so you can now *contact the CRA*.`;
        break;
    }
  }
  const lead = steady && r.stage === 'late' && since ? (fr ? `${since} que vous avez produit votre déclaration. ` : `${since} since you filed. `) : '';
  return { heading, closing: r.filedOn && r.stage !== 'future' ? lead + closingKnown : closingUnknown };
}

/** "When is the RRSP deadline?" without "return" / "file": the RRSP date is the answer, not April 30. */
export function rrspDeadlineVars(lang: Lang) {
  const p = planDeadlines({ today: todayInCanada(), lang });
  const get = (k: string) => p.deadlines.find((x) => x.kind === k)!.onTimeBy;
  // Contributions after last year's RRSP deadline and up to this one count for this return.
  const from = addDays(onTime(addDays(`${p.taxYear}-01-01`, 59)), 1);
  return { rrsp: d(get('rrsp'), lang), from: d(from, lang), file: d(get('file'), lang), year: String(p.taxYear), income: String(p.taxYear - 1) };
}

/** "When are taxes due?": the filing date, the RRSP date, and the June 15 line (theirs, or the general rule). */
export function deadlineVars(text: string, lang: Lang) {
  const p = planDeadlines({ today: todayInCanada(), selfEmployed: true, lang });
  const get = (k: string) => p.deadlines.find((x) => x.kind === k)!.onTimeBy;
  const self = d(get('selfEmployed'), lang);
  const selfLine = selfEmployed(text)
    ? lang === 'fr'
      ? `Comme vous êtes travailleur autonome, vous avez jusqu’au **${self}** pour produire.`
      : `Because you’re self-employed, you have until **${self}** to file.`
    : lang === 'fr'
      ? `Si vous ou votre époux ou conjoint de fait êtes travailleur autonome, vous avez jusqu’au **${self}** pour produire.`
      : `If you or your spouse or partner is self-employed, you have until **${self}** to file.`;
  return { file: d(get('file'), lang), rrsp: d(get('rrsp'), lang), selfLine };
}
