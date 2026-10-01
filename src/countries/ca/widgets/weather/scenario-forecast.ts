/**
 * Scripted answers for forecast questions (EN + FR), written from LIVE Environment and Climate Change Canada
 * data through the same function as the weatherForecast tool. The heading answers the question that was
 * asked: "tomorrow" and "this weekend" are answered from those days' rows of the 7-day forecast, "will it
 * rain / snow" from the chance Environment Canada gives, and anything else from the conditions right now.
 */
import { URLS, isLive, type Lang } from './data';
import { buildForecast } from './live';
import { outlookDays, precipIn } from './outlook';
import { aFr, alertTitle, askedPrecip, askedWhen, base, deg, list, lower, placeFrom, type Ctx, type Note } from './scenario-text';
import { whereVars } from './scenario-where';
import type { Day, ForecastOutput, Period } from './types';

type Ok = Extract<ForecastOutput, { status: 'ok' }>;
type Asked = { when: 'tomorrow' | 'weekend' | null; precip: 'rain' | 'snow' | null };

const pct = (v: number, lang: Lang) => (lang === 'fr' ? `${v}\u00a0%` : `${v}%`);

/** "Friday night: clear, low 9°." — one forecast period in Environment Canada's own words. */
const periodLine = (p: Period, lang: Lang) =>
  lang === 'fr'
    ? `${p.name} : ${lower(p.summary)}${p.pop ? ` (${pct(p.pop, lang)})` : ''}, ${p.night ? 'minimum' : 'maximum'} ${deg(p.temp, lang)}.`
    : `${p.name}: ${lower(p.summary)}${p.pop ? ` (${pct(p.pop, lang)})` : ''}, ${p.night ? 'low' : 'high'} ${deg(p.temp, lang)}.`;

/** A day in a heading: "Saturday sunny, high 18°" / "samedi, ensoleillé, maximum 18°". */
function dayPhrase(d: Day, lang: Lang, withLabel: boolean) {
  const p = d.day ?? d.night;
  if (!p) return '';
  const what = lang === 'fr' ? `${lower(p.summary)}, ${p.night ? 'minimum' : 'maximum'} ${deg(p.temp, lang)}` : `${lower(p.summary)}, ${p.night ? 'low' : 'high'} ${deg(p.temp, lang)}`;
  return withLabel ? (lang === 'fr' ? `${lower(d.label)}, ${what}` : `${d.label} ${what}`) : what;
}

/**
 * The heading and detail for a question about tomorrow, the weekend, or rain/snow. Null when the question
 * asked for neither, or the forecast doesn't reach those days (the "right now" heading is used instead).
 */
function outlook(out: Ok, name: string, asked: Asked, lang: Lang): { head: string; detail: string } | null {
  if (!asked.when && !asked.precip) return null;
  const days = asked.when ? outlookDays(out.days, asked.when, out.fetchedAt, out.place.tz, lang) : out.days.slice(0, 1);
  if (!days.length) return null;
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  const tonightOnly = !asked.when && !days[0].day;
  let whenEn = asked.when === 'tomorrow' ? 'tomorrow' : asked.when === 'weekend' ? 'this weekend' : tonightOnly ? 'tonight' : 'today';
  let whenFr = asked.when === 'tomorrow' ? 'demain' : asked.when === 'weekend' ? 'en fin de semaine' : tonightOnly ? 'ce soir et cette nuit' : 'aujourd’hui';
  const periods = days.flatMap((d) => [d.day, d.night]).filter((p) => p != null);
  if (asked.precip) {
    const other = asked.precip === 'rain' ? 'snow' : 'rain';
    const word = { rain: { en: 'rain', fr: 'pluie' }, snow: { en: 'snow', fr: 'neige' } };
    const hit = precipIn(days, asked.precip);
    // Only the night's periods have it: "tomorrow night", not "tomorrow".
    if (hit && asked.when !== 'weekend' && hit.periods.every((p) => p.night)) {
      whenEn = asked.when === 'tomorrow' ? 'tomorrow night' : 'tonight';
      whenFr = asked.when === 'tomorrow' ? 'demain soir ou dans la nuit' : 'ce soir ou cette nuit';
    }
    const w = word[asked.precip];
    const o = word[other];
    const head = hit
      ? hit.chance == null
        ? L(`*${w.en === 'rain' ? 'Rain' : 'Snow'} is in the forecast* for ${name} ${whenEn}.`, `*De la ${w.fr} est prévue* ${aFr(name)} ${whenFr}.`)
        : L(`There’s a *${pct(hit.chance, 'en')} chance of ${w.en}* in ${name} ${whenEn}.`, `Il y a *${pct(hit.chance, 'fr')} de probabilité de ${w.fr}* ${aFr(name)} ${whenFr}.`)
      : precipIn(days, other)
        ? L(`No ${w.en} in the forecast for ${name} ${whenEn}, *but ${o.en} is.*`, `Pas de ${w.fr} prévue ${aFr(name)} ${whenFr}, *mais de la ${o.fr}.*`)
        : L(`*No ${w.en}* in the forecast for ${name} ${whenEn}.`, `*Pas de ${w.fr}* prévue ${aFr(name)} ${whenFr}.`);
    return { head, detail: periods.map((p) => periodLine(p, lang)).join(' ') };
  }
  const head =
    asked.when === 'weekend'
      ? L(`This weekend in ${name}: *${days.map((d) => dayPhrase(d, 'en', true)).join('; ')}.*`, `En fin de semaine ${aFr(name)} : *${days.map((d) => dayPhrase(d, 'fr', true)).join('; ')}.*`)
      : L(`Tomorrow in ${name}: *${dayPhrase(days[0], 'en', false)}.*`, `Demain ${aFr(name)} : *${dayPhrase(days[0], 'fr', false)}.*`);
  // The heading already gives each day's lead period; the detail adds the rest (the nights).
  const said = new Set(days.map((d) => d.day ?? d.night));
  return { head, detail: periods.filter((p) => !said.has(p)).map((p) => periodLine(p, lang)).join(' ') };
}

export async function forecastVars({ text, lang }: Ctx, note: Note): Promise<Record<string, string>> {
  const place = placeFrom(text);
  const L = (en: string, fr: string) => (lang === 'fr' ? fr : en);
  const when = askedWhen(text);
  try {
    const out = await buildForecast({ location: place, lang, focus: when ?? 'now' });
    if (out.status === 'unavailable') {
      const name = base(out.place.name);
      return {
        head: L(`Environment Canada’s live feed for *${name}* isn’t answering right now.`, `Le flux en direct d’Environnement Canada pour *${name}* ne répond pas en ce moment.`),
        body: L(`The official page has the same forecast. [1](${out.page})`, `La page officielle présente les mêmes prévisions. [1](${out.page})`),
        more: '',
      };
    }
    if (out.status !== 'ok') {
      return {
        ...whereVars(out, lang, {
          head: L('Pick a place for the *live forecast.*', 'Choisissez un endroit pour les *prévisions en direct.*'),
          body: L(
            `Forecasts come live from Environment Canada, for more than 800 places across the country. [1](${URLS.forecastHome.en}) Your location stays on your device: only the nearest town’s name is sent.`,
            `Les prévisions viennent en direct d’Environnement Canada, pour plus de 800 endroits au pays. [1](${URLS.forecastHome.fr}) Votre position reste sur votre appareil : seul le nom de la localité la plus proche est envoyé.`,
          ),
        }),
        more: '',
      };
    }
    const name = base(out.place.name);
    // flag: they already asked about the days ahead, so the next question is about tomorrow.
    note(name, when === 'week' || when === 'weekend');
    const c = out.current;
    const d0 = out.days[0];
    // Same boolean as the widget’s badge and hero: past the freshness window it is the latest, not "right now".
    const stale = Boolean(c) && !isLive(out.fetchedAt, out.updatedAt, c?.observedAt);
    // Some stations report a temperature without a sky condition: the sentence then gives the temperature alone.
    const sky = c?.condition ? `, ${c.condition.toLowerCase()}` : '';
    const now =
      c?.temp != null
        ? stale
          ? L(`Latest in ${name}: ${deg(c.temp, lang)}${sky}.`, `Dernière observation ${aFr(name)} : ${deg(c.temp, lang)}${sky}.`)
          : L(`Right now in ${name}: ${deg(c.temp, lang)}${sky}.`, `En ce moment ${aFr(name)} : ${deg(c.temp, lang)}${sky}.`)
        : '';
    const ahead = outlook(out, name, { when: when === 'week' ? null : when, precip: askedPrecip(text) }, lang);
    const head = ahead
      ? ahead.head
      : c?.temp != null
        ? now.replace(/: (.*)$/, ': *$1*')
        : L(`Here’s the live forecast for *${name}.*`, `Voici les prévisions en direct pour *${name}.*`);
    const near = out.place.via === 'nearest' && out.place.query ? L(` (the closest Environment Canada forecast to ${out.place.query}, ${out.place.distanceKm} km away)`, ` (les prévisions d’Environnement Canada les plus proches de ${out.place.query}, à ${out.place.distanceKm} km)`) : '';
    const hi = out.today.high;
    const norm = out.today.normalHigh;
    const diff = hi != null && norm != null ? Math.round(hi - norm) : null;
    const vsNormal =
      diff == null
        ? ''
        : Math.abs(diff) < 3
          ? L(', about normal for this time of year', ', près de la normale pour la saison')
          : diff > 0
            ? L(`, ${diff}° warmer than usual`, `, ${diff}° de plus que la normale`)
            : L(`, ${-diff}° cooler than usual`, `, ${-diff}° de moins que la normale`);
    const today = d0?.day
      ? L(`${d0.label}: ${lower(d0.day.summary)}, high ${deg(hi, lang)}${vsNormal}.`, `${d0.label} : ${lower(d0.day.summary)}, maximum ${deg(hi, lang)}${vsNormal}.`)
      : d0?.night
        ? L(`${d0.label}: ${lower(d0.night.summary)}, low ${deg(d0.low, lang)}.`, `${d0.label} : ${lower(d0.night.summary)}, minimum ${deg(d0.low, lang)}.`)
        : '';
    const alerts = out.alerts.length
      ? L(
          `**Environment Canada has ${out.alerts.length === 1 ? 'an alert' : `${out.alerts.length} alerts`} in effect: ${list(out.alerts.map((a) => alertTitle(a, 'en')), 'en')}.** Read it below and follow the advice. [2](${URLS.colourCoded.en})`,
          `**Environnement Canada a ${out.alerts.length === 1 ? 'une alerte' : `${out.alerts.length} alertes`} en vigueur : ${list(out.alerts.map((a) => alertTitle(a, 'fr')), 'fr')}.** Lisez-la ci-dessous et suivez les consignes. [2](${URLS.colourCoded.fr})`,
        )
      : L('No weather alerts are in effect there right now.', 'Aucune alerte météo n’est en vigueur à cet endroit en ce moment.');
    const intro = L(`This is Environment Canada’s live forecast${near}.`, `Voici les prévisions en direct d’Environnement Canada${near}.`);
    const changes = L('Forecasts change through the day, so check again before you head out.', 'Les prévisions changent au cours de la journée : vérifiez-les de nouveau avant de sortir.');
    return {
      head,
      // Asked about days ahead: those days in Environment Canada's words, then what it is like right now.
      body: [intro, ahead ? ahead.detail : today, `[1](${out.page})`].filter(Boolean).join(' '),
      more: `\n\n${[ahead ? now : '', alerts, changes].filter(Boolean).join(' ')}`,
    };
  } catch {
    return {
      head: L('Here’s the live forecast from *Environment Canada.*', 'Voici les prévisions en direct d’*Environnement Canada.*'),
      body: `[1](${URLS.forecastHome[lang]})`,
      more: '',
    };
  }
}
