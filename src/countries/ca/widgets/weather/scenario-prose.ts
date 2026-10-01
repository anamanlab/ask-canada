/**
 * Scripted answers for alert questions (EN + FR), written from LIVE Environment and Climate Change Canada
 * data: each builder runs the same function as its tool (live.ts memoizes the feeds and the place lookup for
 * a minute, so the heading and the widget share one outcome) and states today's real numbers.
 * Each builder tells `note` which place or province the answer is about, for the follow-up questions.
 * Forecast questions: scenario-forecast.ts. Air quality and smoke: scenario-air.ts.
 */
import { URLS } from './data';
import { buildAlerts } from './live';
import { PROVINCE_SAY, alertTitle, base, cap, placeFrom, provinceIn, type Ctx, type Note } from './scenario-text';
import { whereVars } from './scenario-where';

export async function placeAlertVars({ text, lang }: Ctx, note: Note): Promise<Record<string, string>> {
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  try {
    const out = await buildAlerts({ location: placeFrom(text), lang });
    const need = { head: L('Pick a place to check for *weather alerts.*', 'Choisissez un endroit pour vérifier les *alertes météo.*'), body: L(`Alerts come live from Environment Canada. [1](${URLS.alertMap.en})`, `Les alertes viennent en direct d’Environnement Canada. [1](${URLS.alertMap.fr})`) };
    if (out.status === 'unavailable') {
      return {
        head: L('Environment Canada’s alert feed *isn’t answering* right now.', 'Le flux d’alertes d’Environnement Canada *ne répond pas* en ce moment.'),
        body: L(`The official alerts map shows every alert in effect. [1](${URLS.alertMap.en})`, `La carte officielle montre toutes les alertes en vigueur. [1](${URLS.alertMap.fr})`),
      };
    }
    if (out.status !== 'ok') return whereVars(out, lang, need);
    if (out.scope !== 'place') return need;
    const name = base(out.place.name);
    const n = out.alerts.length;
    note(name, n > 0);
    if (!n) {
      return {
        head: L(`No weather alerts are in effect for *${name}* right now.`, `Aucune alerte météo n’est en vigueur pour *${name}* en ce moment.`),
        body: L(
          `Environment Canada has no warnings, watches or advisories there at the moment. [1](${out.page}) Alerts can be issued at any time, day or night, so check again if the weather turns. [2](${URLS.alertTypes.en})`,
          `Environnement Canada n’a émis aucun avertissement, aucune veille ni aucun avis pour cet endroit. [1](${out.page}) Des alertes peuvent être émises à toute heure, alors vérifiez de nouveau si le temps change. [2](${URLS.alertTypes.fr})`,
        ),
      };
    }
    const first = out.alerts[0];
    // French: "une veille", "un avertissement", "un avis"; the sentence never depends on the city's gender.
    const une = first.type === 'watch' ? 'une' : 'un';
    return {
      head: L(
        `${name} is under ${n === 1 ? 'a' : `${n} alerts, led by a`} *${alertTitle(first, 'en')}.*`,
        n === 1 ? `${cap(une)} *${alertTitle(first, 'fr')}* est en vigueur pour ${name}.` : `${n} alertes sont en vigueur pour ${name}, dont ${une} *${alertTitle(first, 'fr')}.*`,
      ),
      body: L(
        `Here is Environment Canada’s alert in full. Colours go from yellow to orange to red as the risk increases, and every alert says what to do to stay safe. [1](${out.page}) [2](${URLS.colourCoded.en})`,
        `Voici l’alerte d’Environnement Canada au complet. Les couleurs passent du jaune à l’orange, puis au rouge, à mesure que le risque augmente, et chaque alerte indique quoi faire pour rester en sécurité. [1](${out.page}) [2](${URLS.colourCoded.fr})`,
      ),
    };
  } catch {
    return { head: L('Here are the *live weather alerts.*', 'Voici les *alertes météo en direct.*'), body: `[1](${URLS.alertMap[lang]})` };
  }
}

export async function wideAlertVars({ text, lang }: Ctx, note: Note): Promise<Record<string, string>> {
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  const province = provinceIn(text);
  const nearMe = /\b(near me|my area|where i am|around me|près de chez moi|pres de chez moi|mon secteur|ma région)\b/i.test(text);
  try {
    const out = await buildAlerts({ province, lang });
    if (out.status !== 'ok' || out.scope === 'place') throw new Error('no data');
    // `total` counts distinct areas under colour-coded alerts only: special weather statements are
    // "for information only, they are not an alert" (canada.ca weather-alerts.html, 2026-08-12).
    const n = out.total;
    const worst = out.counts.red ? 'red' : out.counts.orange ? 'orange' : out.counts.yellow ? 'yellow' : null;
    const colourWord = (c: 'red' | 'orange' | 'yellow', plural: boolean) =>
      ({ en: { red: 'red', orange: 'orange', yellow: 'yellow' }, fr: plural ? { red: 'rouges', orange: 'orange', yellow: 'jaunes' } : { red: 'rouge', orange: 'orange', yellow: 'jaune' } })[lang][c];
    if (province) note(province);
    const whereEn = province ? PROVINCE_SAY[province].en : 'across Canada';
    const whereFr = province ? PROVINCE_SAY[province].fr : 'au Canada';
    const head = n
      ? L(
          `*${n === 1 ? '1 area is under a weather alert' : `${n} areas are under weather alerts`}* ${whereEn} right now.`,
          `*${n === 1 ? '1 secteur est visé par une alerte météo' : `${n} secteurs sont visés par des alertes météo`}* ${whereFr} en ce moment.`,
        )
      : L(`There are *no weather alerts* in effect ${whereEn} right now.`, `Aucune *alerte météo* n’est en vigueur ${whereFr} en ce moment.`);
    const colours = (['red', 'orange', 'yellow'] as const).filter((c) => out.counts[c] > 0).length;
    const alertCount = out.groups.filter((g) => g.colour && g.type !== 'statement' && g.type !== 'other').length;
    const most =
      n && worst
        ? colours > 1
          ? L(`The most serious are ${colourWord(worst, true)}. `, `Les plus graves sont ${colourWord(worst, true)}. `)
          : alertCount === 1
            ? n === 1
              ? L(`It’s a ${colourWord(worst, false)} alert. `, `Il s’agit d’une alerte ${colourWord(worst, false)}. `)
              : L(`All are under one ${colourWord(worst, false)} alert. `, `Tous sont visés par une seule alerte ${colourWord(worst, false)}. `)
            : L(`All are ${colourWord(worst, true)}. `, `Ces alertes sont toutes ${colourWord(worst, true)}. `)
        : '';
    const s = out.statements;
    const statements = s
      ? L(
          `Special weather statements also cover ${s} ${s === 1 ? 'area' : 'areas'}: they are for information only, not alerts. [2](${URLS.alertTypes.en}) `,
          `Des bulletins météo spéciaux visent aussi ${s} ${s === 1 ? 'secteur' : 'secteurs'} : ils sont diffusés à titre indicatif seulement et ne constituent pas des alertes. [2](${URLS.alertTypes.fr}) `,
        )
      : '';
    // Explain only the alert types actually in effect (weather-alerts.html, 2026-08-12, re-checked 2026-09-30):
    // warnings and advisories mean act now (advisories: less severe but still significant); watches, get ready.
    const present = new Set(out.groups.filter((g) => g.colour && g.type !== 'statement' && g.type !== 'other').map((g) => g.type));
    const MEANS = {
      en: { warning: 'a warning means act now', advisory: 'an advisory means act now for weather that is less severe but still significant', watch: 'a watch means get ready' },
      fr: { warning: 'un avertissement veut dire d’agir maintenant', advisory: 'un avis veut dire d’agir maintenant pour un phénomène moins grave, mais tout de même important', watch: 'une veille veut dire de vous préparer' },
    }[lang];
    const kinds = (['warning', 'advisory', 'watch'] as const).filter((k) => present.has(k)).map((k) => MEANS[k]);
    const means = kinds.length ? ` ${cap(kinds.join('; '))}. [2](${URLS.alertTypes[lang]})` : '';
    return {
      head,
      body:
        most +
        statements +
        L(
          `This is Environment Canada’s live list, grouped by hazard. [1](${URLS.alertMap.en}) ${nearMe ? 'Tap **Use my location** to check the alerts where you are.' : 'Ask about any town to see the full alert text for it.'}`,
          `Voici la liste en direct d’Environnement Canada, regroupée par phénomène. [1](${URLS.alertMap.fr}) ${nearMe ? 'Touchez **Utiliser ma position** pour voir les alertes là où vous êtes.' : 'Nommez une localité pour voir le texte complet de ses alertes.'}`,
        ) +
        means,
    };
  } catch {
    return {
      head: L('Official weather alerts are *live on weather.gc.ca.*', 'Les alertes météo officielles sont *en direct sur meteo.gc.ca.*'),
      body: L(`Environment Canada’s map shows every warning, watch and advisory in effect. [1](${URLS.alertMap.en})`, `La carte d’Environnement Canada montre tous les avertissements, veilles et avis en vigueur. [1](${URLS.alertMap.fr})`),
    };
  }
}
