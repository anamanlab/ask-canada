/**
 * Scripted scenarios for the `weather` widget (EN + FR): the table of questions, tool calls and follow-ups.
 * The answers are written from LIVE Environment and Climate Change Canada data by the prose builders in
 * widgets/weather/scenario-forecast.ts, scenario-prose.ts and scenario-air.ts. Facts and sources: widgets/weather/data.ts.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Scenario } from '@/lib/scripted/types';
import type { Lang, Province } from '../widgets/weather/data';
import { airVars } from '../widgets/weather/scenario-air';
import { forecastVars } from '../widgets/weather/scenario-forecast';
import { placeAlertVars, wideAlertVars } from '../widgets/weather/scenario-prose';
import { PROVINCE_SAY, PROVINCE_TAIL, aFr, askedWhen, placeFrom, presDeFr, provinceIn, type Ctx, type Note } from '../widgets/weather/scenario-text';

/* ------------------------------------------------------------------ follow-ups */

/**
 * Follow-ups are the next question this person would ask about the SAME place ("Any alerts in Kelowna?"),
 * not a canned city. The engine reads a scenario's static `followUps` after its `vars` has run, with no
 * request context, so the place travels in the request's own async context: `tracked` opens a slot for this
 * request before the builder's first await, the builder notes the place it resolved, and the getters below
 * read that slot. Nothing is shared between requests: two people asking at the same moment each get their
 * own place. With no slot or no place (asked "near me", not found, or a check script reading the table), the
 * generic questions are used.
 */
type About = { name: string; flag: boolean };
const turn = new AsyncLocalStorage<{ about: About | null }>();

function tracked(build: (ctx: Ctx, note: Note) => Promise<Record<string, string>>): NonNullable<Scenario['vars']> {
  return (ctx) => {
    const slot: { about: About | null } = { about: null };
    turn.enterWith(slot);
    return build(ctx, (name, flag = false) => {
      slot.about = { name, flag };
    });
  };
}

function followUps(generic: { en: string[]; fr: string[] }, forPlace: (p: string, flag: boolean) => { en: string[]; fr: string[] }): Scenario['followUps'] {
  const pick = (lang: Lang) => {
    const p = turn.getStore()?.about;
    return p ? forPlace(p.name, p.flag)[lang] : generic[lang];
  };
  return {
    get en() {
      return pick('en');
    },
    get fr() {
      return pick('fr');
    },
  };
}

const NATIONAL = { en: 'Are there any weather alerts in Canada right now?', fr: 'Y a-t-il des alertes météo au Canada en ce moment?' };

/* ------------------------------------------------------------------ scenarios */

const ALERT_WORDS = /\b(weather )?(alerts?|warnings?|watch(?:es)?|advisor(?:y|ies))\b/i;
const ALERTE_WORDS = /\b(alertes?|avertissements?|veilles?|avis)\b( m[ée]t[ée]o)?/i;

const weather: Scenario[] = [
  {
    id: 'weather-forecast',
    priority: 6,
    match: [
      /\b(weather|forecast)\b/i,
      /\b(will it|is it going to|is it|does it look like)\s+(rain|snow|be (?:hot|cold|sunny|nice|warm))\b/i,
      /\b(do i need|should i (?:bring|take)) an umbrella\b/i,
      /\bhow (?:hot|cold|warm) is it\b/i,
      /\b(m[ée]t[ée]o|pr[ée]visions? m[ée]t[ée]o|quel temps)\b/i,
      /\b(va-t-il|est-ce qu['’]il va)\s+(pleuvoir|neiger)\b/i,
      /\b(pleuvra|neigera)-t-il\b/i,
    ],
    exclude: [ALERT_WORDS, /\b(air quality|aqhi|smoke|wildfire|qualit[ée] de l['’]air|fum[ée]e|feux? de for[êe]t|cote air sant[ée])\b/i, /\b(alertes?|avertissements?|veilles?)\b/i, /\b(climate change|changements? climatiques?|marine|aviation)\b/i],
    reply: {
      en: '# {head}\n\n{body}{more}',
      fr: '# {head}\n\n{body}{more}',
    },
    vars: tracked(forecastVars),
    toolCalls: [
      {
        toolName: 'weatherForecast',
        input: ({ text, lang }: Ctx) => ({ location: placeFrom(text), lang, focus: askedWhen(text) ?? undefined }),
      },
    ],
    followUps: followUps(
      {
        en: [NATIONAL.en, 'Is there wildfire smoke near me?', 'What’s the weather in Vancouver?'],
        fr: [NATIONAL.fr, 'Y a-t-il de la fumée de feux de forêt près de chez moi?', 'Quel temps fait-il à Vancouver?'],
      },
      // flag: they already asked about the week or the weekend, so the next question is about tomorrow.
      (p, week) => ({
        en: [week ? `Will it rain in ${p} tomorrow?` : `What’s the weather in ${p} this weekend?`, `Any weather alerts in ${p}?`, `What’s the air quality in ${p}?`],
        fr: [week ? `Va-t-il pleuvoir ${aFr(p)} demain?` : `Quel temps fera-t-il ${aFr(p)} en fin de semaine?`, `Y a-t-il des alertes météo ${aFr(p)}?`, `Quelle est la qualité de l’air ${aFr(p)}?`],
      }),
    ),
  },
  {
    id: 'weather-alerts-place',
    priority: 8,
    match: [
      new RegExp(`(?=.*${ALERT_WORDS.source})(?=.*\\b(in|for|at|near)\\s+(?!me\\b|my\\b|canada\\b)[A-Za-zÀ-ÿ])`, 'i'),
      new RegExp(`(?=.*${ALERTE_WORDS.source})(?=.*(?:^|\\s)(?:à|pour|près de)\\s+(?!moi\\b|chez\\b)[A-Za-zÀ-ÿ])`, 'i'),
    ],
    exclude: [/\btravel\b/i, /\bvoyag/i, /\brecall|rappel/i, /\b(air quality|qualit[ée] de l['’]air|smoke|fum[ée]e)\b/i, PROVINCE_TAIL],
    reply: { en: '# {head}\n\n{body}', fr: '# {head}\n\n{body}' },
    vars: tracked(placeAlertVars),
    toolCalls: [{ toolName: 'weatherAlerts', input: ({ text, lang }: Ctx) => ({ location: placeFrom(text), lang }) }],
    followUps: followUps(
      {
        en: ['What’s the weather in Halifax?', NATIONAL.en, 'What’s the air quality in Calgary?'],
        fr: ['Quel temps fait-il à Halifax?', NATIONAL.fr, 'Quelle est la qualité de l’air à Calgary?'],
      },
      // flag: alerts in effect there (then the forecast comes first; with none, the week ahead).
      (p, some) => ({
        en: [some ? `What’s the weather in ${p} right now?` : `What’s the weather in ${p} this weekend?`, `What’s the air quality in ${p}?`, NATIONAL.en],
        fr: [some ? `Quel temps fait-il ${aFr(p)} en ce moment?` : `Quel temps fera-t-il ${aFr(p)} en fin de semaine?`, `Quelle est la qualité de l’air ${aFr(p)}?`, NATIONAL.fr],
      }),
    ),
  },
  {
    id: 'weather-alerts-canada',
    priority: 7,
    match: [
      /\b(weather|storm|heat|snow|wind|rain|fog|frost|tornado|blizzard)\s+(alerts?|warnings?|watch(?:es)?|advisor(?:y|ies))\b/i,
      /\b(alerts?|warnings?)\b.*\b(near me|canada|my area|in effect)\b/i,
      new RegExp(`(?=.*${ALERT_WORDS.source})(?=.*${PROVINCE_TAIL.source})`, 'i'),
      new RegExp(`(?=.*${ALERTE_WORDS.source})(?=.*${PROVINCE_TAIL.source})`, 'i'),
      /\b(alertes?|avertissements?|veilles?)\s+(m[ée]t[ée]o|de (?:chaleur|tempête|neige|vent|pluie|froid|brouillard|tornade))\b/i,
      /\b(alertes?|avertissements?)\b.*\b(près de chez moi|pres de chez moi|au canada|en vigueur)\b/i,
    ],
    exclude: [/\btravel\b/i, /\bvoyag/i, /\b(recall|rappel)/i, /\b(air quality|qualit[ée] de l['’]air)\b/i],
    reply: { en: '# {head}\n\n{body}', fr: '# {head}\n\n{body}' },
    vars: tracked(wideAlertVars),
    toolCalls: [{ toolName: 'weatherAlerts', input: ({ text, lang }: Ctx) => ({ province: provinceIn(text), lang }) }],
    followUps: followUps(
      {
        en: ['Are there weather alerts in Winnipeg?', 'What’s the weather in Toronto?', 'Is there wildfire smoke near me?'],
        fr: ['Y a-t-il des alertes météo à Winnipeg?', 'Quel temps fait-il à Toronto?', 'Y a-t-il de la fumée de feux de forêt près de chez moi?'],
      },
      // Asked about a province: its own places, not a canned city elsewhere in Canada.
      (code) => {
        const [big, other] = PROVINCE_SAY[code as Province].places;
        return {
          en: [`What’s the weather in ${big}?`, `Any weather alerts in ${other}?`, NATIONAL.en],
          fr: [`Quel temps fait-il ${aFr(big)}?`, `Y a-t-il des alertes météo ${aFr(other)}?`, NATIONAL.fr],
        };
      },
    ),
  },
  {
    id: 'weather-air-quality',
    priority: 8,
    match: [/\b(air quality|aqhi|air quality health index|is the air (?:safe|ok|okay|good|bad))\b/i, /\b(qualit[ée] de l['’]air|cote air sant[ée]|\bCAS\b)\b/i, /\b(safe|ok|okay) to (?:run|exercise|play|go) outside\b/i],
    exclude: [/\b(wildfire|smoke|fum[ée]e|feux? de for[êe]t)\b/i],
    reply: { en: '# {head}\n\n{body}', fr: '# {head}\n\n{body}' },
    vars: tracked((ctx, note) => airVars(ctx, false, note)),
    toolCalls: [{ toolName: 'weatherAirQuality', input: ({ text, lang }: Ctx) => ({ location: placeFrom(text), lang, focus: 'aqhi' }) }],
    followUps: followUps(
      {
        en: ['Is there wildfire smoke near me?', 'What’s the weather in Edmonton?', 'What’s the air quality in Montréal?'],
        fr: ['Y a-t-il de la fumée de feux de forêt près de chez moi?', 'Quel temps fait-il à Edmonton?', 'Quelle est la qualité de l’air à Montréal?'],
      },
      // Not "What's the weather in p?": people often ask about the air right after asking that.
      (p) => ({
        en: [`Is there wildfire smoke near ${p}?`, `Will it rain in ${p} tomorrow?`, `Any weather alerts in ${p}?`],
        fr: [`Y a-t-il de la fumée de feux de forêt ${presDeFr(p)}?`, `Va-t-il pleuvoir ${aFr(p)} demain?`, `Y a-t-il des alertes météo ${aFr(p)}?`],
      }),
    ),
  },
  {
    id: 'weather-smoke',
    priority: 9,
    match: [/\b(wildfire smoke|forest fire smoke|smoke|smoky|wildfires?\s+(?:near|in))\b/i, /\b(fum[ée]e|feux? de for[êe]t\s+(?:près|pres|à|a))\b/i],
    exclude: [/\b(smoke detector|smoking|cigarette|vape|détecteur|fumer|tabac|cannabis)\b/i],
    reply: { en: '# {head}\n\n{body}', fr: '# {head}\n\n{body}' },
    vars: tracked((ctx, note) => airVars(ctx, true, note)),
    toolCalls: [{ toolName: 'weatherAirQuality', input: ({ text, lang }: Ctx) => ({ location: placeFrom(text), lang, focus: 'smoke' }) }],
    followUps: followUps(
      {
        en: ['Is there wildfire smoke near Kelowna?', NATIONAL.en, 'What’s the weather in Yellowknife?'],
        fr: ['Y a-t-il de la fumée de feux de forêt près de Kelowna?', NATIONAL.fr, 'Quel temps fait-il à Yellowknife?'],
      },
      // The answer already gives the AQHI, so no air-quality question here.
      (p) => ({
        en: [`Will it rain in ${p} tomorrow?`, `Any weather alerts in ${p}?`, NATIONAL.en],
        fr: [`Va-t-il pleuvoir ${aFr(p)} demain?`, `Y a-t-il des alertes météo ${aFr(p)}?`, NATIONAL.fr],
      }),
    ),
  },
];

const scenarios: Scenario[] = weather;
export default scenarios;
