/**
 * Scripted answers for elections (TSE): dates, voting hours, rounds and offices.
 *
 * These answers are static verified facts, not live figures: the 2026 general elections have fixed dates in
 * the TSE calendar (read 2026-10-04), so the reply states them directly with the TSE homepage as source,
 * like the starters do. A `{todayLine}` variable keeps the answer honest as time passes: "é hoje" is only
 * ever said on the day itself, and after both rounds the reply points at the official results instead.
 *
 * Prediction questions ("quem vai ganhar", polls, results) are deliberately NOT matched here: they stay on
 * the model path with the `officialSafety` rules, where a confident scripted answer would be wrong.
 */
import { diffDays } from '@/lib/dates/business-days';
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';
import { todayInBrazil } from '../data/holidays';

/** Read 2026-10-04 (TSE: calendário eleitoral, Manual do Eleitor 2026, Resolução 23.751). */
const CHECKED = '2026-10-04';

const TSE = 'https://www.tse.jus.br';

const FIRST_ROUND = '2026-10-04';
const SECOND_ROUND = '2026-10-25';

/** "4 de outubro de 2026" / "4 October 2026", in the person's own time zone. */
function longDate(iso: string, locale: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timeZone || 'America/Sao_Paulo',
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** Outcome and prediction phrasings must never land on the calendar answer. */
const NOT_PREDICTION =
  /\b(quem (vai )?ganhar|vai (ganhar|vencer)|vence|vencer|vencedor|resultado|result|aposta|previs[aã]o|progn[oó]stico|pesquisa eleitoral|inten[cç][aã]o de voto|who will win|winner|predict)\b/i;

function vars({ locale, timeZone }: ScenarioCtx) {
  const today = todayInBrazil(timeZone);
  const english = locale === 'en';
  const fmt = (iso: string) => longDate(iso, locale, timeZone);
  const first = fmt(FIRST_ROUND);
  const second = fmt(SECOND_ROUND);
  let headline: string;
  let when: string;
  if (today < FIRST_ROUND) {
    const n = diffDays(today, FIRST_ROUND);
    headline = english ? `The first round is ${first}` : `O 1º turno é em ${first}`;
    when = english
      ? `${n === 1 ? 'One day to go' : `${n} days to go`}: polls open ${first}, from 8am to 5pm Brasília time.`
      : `${n === 1 ? 'Falta 1 dia' : `Faltam ${n} dias`}: as urnas abrem em ${first}, das 8h às 17h no horário de Brasília.`;
  } else if (today === FIRST_ROUND) {
    headline = english ? 'The first round is today' : 'O 1º turno é hoje';
    when = english
      ? `Today, ${first}, polls are open from 8am to 5pm Brasília time (in Acre, 6am to 3pm local time).`
      : `Hoje, ${first}, as urnas ficam abertas das 8h às 17h no horário de Brasília (no Acre, das 6h às 15h no horário local).`;
  } else if (today < SECOND_ROUND) {
    headline = english ? `The first round was ${first}` : `O 1º turno foi em ${first}`;
    when = english
      ? `Where a second round is needed, it is ${second}, from 8am to 5pm Brasília time.`
      : `Onde houver segundo turno, ele é em ${second}, das 8h às 17h no horário de Brasília.`;
  } else if (today === SECOND_ROUND) {
    headline = english ? 'The second round is today, where one is held' : 'O 2º turno é hoje, onde houver';
    when = english
      ? `Today, ${second}, polls are open from 8am to 5pm Brasília time (in Acre, 6am to 3pm local time).`
      : `Hoje, ${second}, as urnas ficam abertas das 8h às 17h no horário de Brasília (no Acre, das 6h às 15h no horário local).`;
  } else {
    headline = english ? 'The 2026 general elections are over' : 'As eleições gerais de 2026 terminaram';
    when = english
      ? `The first round was ${first} and the second round, where one was held, ${second}. Official results stay on the TSE site.`
      : `O 1º turno foi em ${first} e o 2º turno, onde houve, em ${second}. Os resultados oficiais ficam no site do TSE.`;
  }
  return { headline, when };
}

const scenarios: Scenario[] = [
  {
    id: 'eleicoes-gerais',
    priority: 7,
    match: [
      /\bquando\b.{0,24}\b(elei[cç][aã]o|elei[cç][oõ]es|vota[cç][aã]o|pleito|turno)\b/i,
      /\b(elei[cç][aã]o|elei[cç][oõ]es|vota[cç][aã]o|pleito)\b.{0,24}\bquando\b/i,
      /\bque horas\b.{0,24}\b(elei[cç][aã]o|elei[cç][oõ]es|vota[cç][aã]o|votar|urna)\b/i,
      /\b(elei[cç][aã]o|elei[cç][oõ]es|vota[cç][aã]o)\b.{0,24}\bque horas\b/i,
      /\bhor[aá]rio\b.{0,24}\b(vota[cç][aã]o|elei[cç][aã]o|urna|votar)\b/i,
      /\bque dia\b.{0,24}\b(elei[cç][aã]o|vota[cç][aã]o|turno|votar)\b/i,
      /\bdata\b.{0,24}\b(elei[cç][aã]o|elei[cç][oõ]es|vota[cç][aã]o)\b/i,
      /\b(elei[cç][aã]o|elei[cç][oõ]es)\b.{0,24}\bdata\b/i,
      /\b(tem|h[aá]|temos|[eé]|eh)\b.{0,12}\belei[cç][aã]o hoje\b/i,
      /\belei[cç][aã]o\b.{0,12}\b([eé]|eh) hoje\b/i,
      /\b(primeiro|1 ?[ºo]) turno\b/i,
      /\bsegundo turno\b/i,
      /\bonde (voto|votar)\b/i,
      /\blocal de vota[cç][aã]o\b/i,
      /\bzona eleitoral\b/i,
      /\bse[cç][aã]o eleitoral\b/i,
      /\bwhen (is|are) the (next |general |presidential )?(election|elections)\b/i,
      /\b(when|what day|what time|what date)\b.{0,24}\b(presidential )?elections?\b/i,
      /\b(presidential )?elections?\b.{0,24}\b(when|what day|what time|what date)\b/i,
      /\bvoting hours\b/i,
      /\bwhen do (the )?polls (open|close)\b/i,
      /\bwhere do i vote\b/i,
      /\bvoting location\b/i,
      /\bpolling (place|station)\b/i,
      /\bsecond round\b/i,
      /\bwhen is the runoff\b/i,
    ],
    exclude: [NOT_PREDICTION, /\b(estadual|municipal|prefeito|vereador)\b/i],
    reply: {
      pt: `# {headline}

{when}

Em disputa em 2026: presidente e vice, governadores e vice, dois senadores por estado, deputados federais, deputados estaduais e deputados distritais (Distrito Federal). Para confirmar zona, seção e local de votação, consulte o site do TSE com seu título de eleitor. [1](${TSE})`,
      en: `# {headline}

{when}

Up for election in 2026: president and vice-president, governors and vice-governors, two senators per state, federal deputies, state deputies and district deputies (Federal District). To confirm your zone, section and polling place, check the TSE site with your voter ID. [1](${TSE})`,
    },
    vars,
    checked: CHECKED,
    followUps: {
      pt: ['Onde voto?', 'Quando é o segundo turno?', 'Tem eleição municipal em 2026?'],
      en: ['Where do I vote?', 'When is the second round?', 'Is there a municipal election in 2026?'],
    },
  },
  {
    id: 'eleicoes-municipais',
    priority: 7,
    match: [
      /\b(elei[cç][aã]o|elei[cç][oõ]es) (municipal|municipais)\b/i,
      /\bmunicipal\b.{0,24}\b(elei[cç][aã]o|elei[cç][oõ]es|prefeito|vereador)\b/i,
      /\b(prefeito|vereador)\b/i,
      /\bmunicipal elections?\b/i,
    ],
    exclude: [NOT_PREDICTION],
    reply: {
      pt: `# Não há eleição municipal em 2026.

As últimas eleições municipais foram em 2024. As próximas serão em 2028: 1º turno em 1º de outubro (domingo), 2º turno onde houver em 29 de outubro — sempre das 8h às 17h no horário de Brasília. Em disputa: prefeitos, vice-prefeitos e vereadores. O segundo turno só existe em municípios com mais de 200 mil eleitores. [1](${TSE})`,
      en: `# There is no municipal election in 2026.

The last municipal elections were in 2024. The next ones are in 2028: first round on 1 October (Sunday), second round where one is held on 29 October — always 8am to 5pm Brasília time. Up for election: mayors, vice-mayors and councillors. A second round only happens in municipalities with over 200,000 voters. [1](${TSE})`,
    },
    checked: CHECKED,
    followUps: {
      pt: ['Quando é a próxima eleição geral?', 'Onde voto?', 'Quando é o segundo turno?'],
      en: ['When is the next general election?', 'Where do I vote?', 'When is the second round?'],
    },
  },
];

export default scenarios;
