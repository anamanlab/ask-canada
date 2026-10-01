/**
 * Scripted answers for air quality and wildfire smoke questions (EN + FR), from the same live data as the
 * weatherAirQuality tool. The advice wording is the official AQHI health message for each risk category
 * (data.ts records the source pages).
 */
import { URLS, type Lang } from './data';
import { buildAir } from './live';
import { base, cap, clock, intl, list, placeFrom, presDeFr, staleObs, type Ctx, type Note } from './scenario-text';
import { whereVars } from './scenario-where';

const CAT = {
  en: { low: 'low risk', moderate: 'moderate risk', high: 'high risk', 'very-high': 'very high risk' },
  fr: { low: 'risque faible', moderate: 'risque modéré', high: 'risque élevé', 'very-high': 'risque très élevé' },
};

export async function airVars({ text, lang }: Ctx, smokeFocus: boolean, note: Note): Promise<Record<string, string>> {
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  try {
    const out = await buildAir({ location: placeFrom(text), lang, focus: smokeFocus ? 'smoke' : 'aqhi' });
    if (out.status !== 'ok') {
      return whereVars(out, lang, {
        head: smokeFocus ? L('Pick a place to check for *wildfire smoke.*', 'Choisissez un endroit pour vérifier la *fumée des feux de forêt.*') : L('Pick a place to check the *air quality.*', 'Choisissez un endroit pour vérifier la *qualité de l’air.*'),
        body: L(
          `Use your location or search for a town below. Air quality comes live from Environment Canada’s Air Quality Health Index. [1](${URLS.aqhiLocal.en})`,
          `Utilisez votre position ou cherchez une localité ci-dessous. La qualité de l’air vient en direct de la cote air santé d’Environnement Canada. [1](${URLS.aqhiLocal.fr})`,
        ),
      });
    }
    const name = base(out.place.name);
    note(name);
    const a = out.aqhi;
    const v = a ? (a.value ?? a.forecast[0]?.value ?? null) : null;
    const cat = a?.category;
    // Same rule as the widget: an observation inside the freshness window is "right now"; an older one is "the latest
    // reading, at 12 p.m."; with none, the widget shows today's forecast period maximum, and so does the heading.
    const observed = a?.value != null;
    const stale = observed && staleObs(a?.observedAt, out.fetchedAt);
    const at = stale && a?.observedAt ? clock(a.observedAt, out.place.tz, lang) : '';
    const head =
      v != null && cat
        ? observed
          ? stale
            ? L(`The latest Air Quality Health Index reading for ${name} is *${CAT.en[cat]}* (AQHI ${v}, at ${at}).`, `La plus récente cote air santé pour ${name} indique un *${CAT.fr[cat]}* (CAS de ${v}, à ${at}).`)
            : L(`The air in ${name} is *${CAT.en[cat]}* right now (AQHI ${v}).`, `L’air à ${name} présente un *${CAT.fr[cat]}* en ce moment (CAS de ${v}).`)
          : L(`Today’s air quality forecast for ${name} is *${CAT.en[cat]}* (AQHI ${v}).`, `La prévision de la qualité de l’air pour ${name} aujourd’hui indique un *${CAT.fr[cat]}* (CAS de ${v}).`)
        : out.gap === 'quebec'
          ? L(`${name} uses *Info-Smog* for air quality.`, `${name} utilise *Info-Smog* pour la qualité de l’air.`)
          : L(`There’s no Air Quality Health Index reading *close to ${name}.*`, `Il n’y a pas de cote air santé *près de ${name}.*`);
    const advice =
      cat === 'low'
        ? L('That means everyone can enjoy their usual outdoor activities.', 'Tout le monde peut donc profiter de ses activités habituelles en plein air.')
        : cat === 'moderate'
          ? L(
              'Most people can continue their usual outdoor activities unless they have symptoms like coughing and throat irritation. People at risk (children, people over 65 and people with health conditions) should consider reducing or rescheduling strenuous outdoor activities if they have symptoms.',
              'La plupart des gens peuvent poursuivre leurs activités habituelles en plein air, sauf en cas de symptômes comme de la toux ou une irritation de la gorge. Les personnes à risque (enfants, personnes de plus de 65 ans et personnes qui ont des problèmes de santé) devraient envisager de réduire ou de reporter les activités exténuantes en plein air si elles ont des symptômes.',
            )
          : cat === 'high'
            ? L(
                'If you have symptoms like coughing and throat irritation, consider reducing or rescheduling strenuous outdoor activities. People at risk (children, people over 65 and people with health conditions) should reduce or reschedule them.',
                'Si vous ressentez des symptômes comme de la toux et une irritation de la gorge, envisagez de réduire ou de reporter les activités exténuantes en plein air. Les personnes à risque (enfants, personnes de plus de 65 ans et personnes qui ont des problèmes de santé) devraient les réduire ou les reporter.',
              )
            : cat === 'very-high'
              ? L(
                  'Everyone should reduce or reschedule strenuous outdoor activities, especially if you have symptoms like coughing and throat irritation. People at risk (children, people over 65 and people with health conditions) should avoid strenuous activities outdoors.',
                  'Tout le monde devrait réduire ou reporter les activités exténuantes en plein air, particulièrement en cas de symptômes comme de la toux et une irritation de la gorge. Les personnes à risque (enfants, personnes de plus de 65 ans et personnes qui ont des problèmes de santé) devraient éviter les activités exténuantes en plein air.',
                )
              : '';
    if (smokeFocus) return smokeAnswer(out, name, v, cat ?? null, observed, advice, lang);
    const smoke = out.airAlerts.length
      ? L(`**An air quality warning is in effect.** Read it below. [3](${URLS.smokeHealth.en})`, `**Un avertissement sur la qualité de l’air est en vigueur.** Lisez-le ci-dessous. [3](${URLS.smokeHealth.fr})`)
      : '';
    return {
      head,
      body: [
        v != null
          ? L(`${advice} [1](${URLS.aqhiLocal.en}) [2](${URLS.aqhiAbout.en})`, `${advice} [1](${URLS.aqhiLocal.fr}) [2](${URLS.aqhiAbout.fr})`)
          : out.gap === 'quebec'
            ? L(
                `Quebec forecasts air quality with the Info-Smog program. [1](${URLS.aqhiAbout.en}) There, the AQHI covers only Montréal, Québec City and Gatineau, so check today’s Info-Smog forecast for your region. [2](${URLS.infoSmog.en})`,
                `Le Québec prévoit la qualité de l’air avec le programme Info-Smog. [1](${URLS.aqhiAbout.fr}) La cote air santé n’y couvre que Montréal, Québec et Gatineau : consultez la prévision Info-Smog du jour pour votre région. [2](${URLS.infoSmog.fr})`,
              )
            : out.gap === 'far' && out.nearest
              ? L(`The nearest AQHI community is ${out.nearest.name}, ${out.nearest.distanceKm} km away, too far to speak for the air there. [1](${URLS.aqhiLocal.en})`, `La collectivité la plus proche avec une cote air santé est ${out.nearest.name}, à ${out.nearest.distanceKm} km, trop loin pour renseigner sur l’air à cet endroit. [1](${URLS.aqhiLocal.fr})`)
              : L(`The latest AQHI didn’t come through. The official page has the current reading. [1](${URLS.aqhiLocal.en})`, `La dernière cote air santé n’est pas parvenue. La page officielle affiche la cote actuelle. [1](${URLS.aqhiLocal.fr})`),
        smoke,
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  } catch {
    return { head: L('Here’s the *Air Quality Health Index.*', 'Voici la *cote air santé.*'), body: `[1](${URLS.aqhiLocal[lang]})` };
  }
}

type AirOk = Extract<Awaited<ReturnType<typeof buildAir>>, { status: 'ok' }>;
type Cat = keyof (typeof CAT)['en'];

/**
 * A wildfire-smoke question gets a smoke verdict first, built from the three signals the tool returned:
 * air quality warnings, satellite fire hotspots within 100 km (last 24 hours) and the AQHI. "No smoke signals"
 * is said only when they all agree (no warning, no hotspots, a low-risk AQHI and no in-smoke forecast).
 */
function smokeAnswer(out: AirOk, name: string, v: number | null, cat: Cat | null, observed: boolean, advice: string, lang: Lang): Record<string, string> {
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  const h = out.hotspots;
  const km = h?.radiusKm ?? 100;
  const nf = new Intl.NumberFormat(intl(lang));
  const aqhiEn = v != null && cat ? `the AQHI ${observed ? 'is' : 'forecast for today is'} ${v} (${CAT.en[cat]})` : '';
  const aqhiFr = v != null && cat ? `la cote air santé ${observed ? 'est de' : 'prévue aujourd’hui est de'} ${v} (${CAT.fr[cat]})` : '';
  const cite = {
    fire: L(`[1](${URLS.fireMap.en})`, `[1](${URLS.fireMap.fr})`),
    aqhi: L(`[2](${URLS.aqhiLocal.en})`, `[2](${URLS.aqhiLocal.fr})`),
    about: L(`[3](${URLS.aqhiAbout.en})`, `[3](${URLS.aqhiAbout.fr})`),
    health: L(`[4](${URLS.smokeHealth.en})`, `[4](${URLS.smokeHealth.fr})`),
  };
  const travel = L(
    `Smoke can travel thousands of kilometres, so air quality can be poor even if you can’t see or smell it. ${cite.health}`,
    `La fumée peut parcourir des milliers de kilomètres : la qualité de l’air peut être mauvaise même si vous ne pouvez pas voir ni sentir la fumée. ${cite.health}`,
  );
  // With no AQHI there, say why (Quebec's Info-Smog, or too far from an AQHI community) instead of advice.
  const advicePara =
    v != null && advice
      ? `${advice} ${cite.about}`
      : out.gap === 'quebec'
        ? L(`Quebec forecasts air quality with Info-Smog instead of the AQHI, so check today’s Info-Smog forecast for your region. [3](${URLS.infoSmog.en})`, `Le Québec prévoit la qualité de l’air avec Info-Smog plutôt qu’avec la cote air santé\u00a0: consultez la prévision Info-Smog du jour pour votre région. [3](${URLS.infoSmog.fr})`)
        : out.gap === 'far' && out.nearest
          ? L(`The nearest AQHI community is ${out.nearest.name}, ${out.nearest.distanceKm} km away, too far to speak for the air there. [2](${URLS.aqhiLocal.en})`, `La collectivité la plus proche avec une cote air santé est ${out.nearest.name}, à ${out.nearest.distanceKm} km, trop loin pour renseigner sur l’air à cet endroit. [2](${URLS.aqhiLocal.fr})`)
          : '';
  const paras = (...p: string[]) => p.filter(Boolean).join('\n\n');
  const closest = h?.nearestKm != null ? h.nearestKm : null;

  // 1. A warning is in effect: that is the answer.
  if (out.airAlerts.length) {
    const fires = h?.count
      ? L(
          `Satellites also detected ${h.count === 1 ? '1 fire hotspot' : `${nf.format(h.count)} fire hotspots`} within ${km} km in the last 24 hours${closest != null ? ` (the closest about ${nf.format(closest)} km away)` : ''}. ${cite.fire}`,
          `Les satellites ont aussi détecté ${h.count === 1 ? '1 point chaud' : `${nf.format(h.count)} points chauds`} dans un rayon de ${km} km au cours des 24 dernières heures${closest != null ? ` (le plus proche à environ ${nf.format(closest)} km)` : ''}. ${cite.fire}`,
        )
      : '';
    return {
      head: L(`*An air quality warning* is in effect for ${name}.`, `*Un avertissement sur la qualité de l’air* est en vigueur pour ${name}.`),
      body: paras(
        L(
          `Read Environment Canada’s warning below and follow its advice.${aqhiEn ? ` Right now ${aqhiEn}. ${cite.aqhi}` : ''}`,
          `Lisez l’avertissement d’Environnement Canada ci-dessous et suivez ses consignes.${aqhiFr ? ` En ce moment, ${aqhiFr}. ${cite.aqhi}` : ''}`,
        ),
        fires,
        advicePara,
        travel,
      ),
    };
  }
  // 2. Fires nearby: say how many and how close.
  if (h?.count) {
    return {
      head: L(
        `${h.count === 1 ? '1 wildfire hotspot was' : `${nf.format(h.count)} wildfire hotspots were`} *detected within ${km} km* of ${name} in the last 24 hours.`,
        `${h.count === 1 ? '1 point chaud a été détecté' : `${nf.format(h.count)} points chauds ont été détectés`} *dans un rayon de ${km} km* de ${name} au cours des 24 dernières heures.`,
      ),
      body: paras(
        L(
          `${closest != null ? `The closest is about ${nf.format(closest)} km away. ` : ''}No air quality warning is in effect${aqhiEn ? `, and ${aqhiEn}` : ''}. ${cite.fire}${aqhiEn ? ` ${cite.aqhi}` : ''}`,
          `${closest != null ? `Le plus proche se trouve à environ ${nf.format(closest)} km. ` : ''}Aucun avertissement sur la qualité de l’air n’est en vigueur${aqhiFr ? `, et ${aqhiFr}` : ''}. ${cite.fire}${aqhiFr ? ` ${cite.aqhi}` : ''}`,
        ),
        advicePara,
        travel,
      ),
    };
  }
  // 3. No warning and no hotspots: "no smoke signals" only when the air itself is low risk.
  const calm = !out.smoke && (cat === 'low' || (cat == null && h != null));
  const signals = [
    L('no air quality warning', 'aucun avertissement sur la qualité de l’air'),
    h ? L(`no satellite fire hotspots within ${km} km in the last 24 hours`, `aucun point chaud détecté par satellite dans un rayon de ${km} km au cours des 24 dernières heures`) : '',
    L(aqhiEn, aqhiFr),
  ].filter(Boolean);
  const sentence = `${cap(list(signals, lang))}.${h ? ` ${cite.fire}` : ''}${aqhiEn ? ` ${cite.aqhi}` : ''}`;
  return {
    head: calm
      ? L(`No wildfire smoke signals near ${name} *right now.*`, `Aucun signe de fumée de feux de forêt ${presDeFr(name)} *en ce moment.*`)
      : !cat
        ? L(`No air quality warning is in effect for ${name} *right now.*`, `Aucun avertissement sur la qualité de l’air n’est en vigueur pour ${name} *en ce moment.*`)
        : L(`No air quality warning for ${name}, but the air is *${CAT.en[cat]}* (AQHI ${v}).`, `Aucun avertissement pour ${name}, mais l’air présente un *${CAT.fr[cat]}* (CAS de ${v}).`),
    body: paras(sentence, advicePara, travel),
  };
}
