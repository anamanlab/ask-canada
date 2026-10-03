/**
 * Lab fixtures for the `economia` widget.
 *
 * Every value here is a real observation from the Banco Central's SGS, captured verbatim — the Lab is a
 * place to see a card without hammering a live API, and a fixture full of invented macro numbers would
 * make the widget look trustworthy when it is showing something that never happened. `available` and
 * `unknown-series` fixtures exist for the same reason the live tool has that branch: the failure has to
 * be visible in review, not only in production.
 */
import type { Fixture, ToolSource, WidgetPart } from '@/lib/widgets/types';

const CHECKED = '2026-10-02';

/**
 * A source exactly as the tool builds it: the authority and the dataset are stated by the
 * tool, and `fetchedAt`/`fromCache` say whether the number was fetched for this call or
 * served from the five-minute cache. The Lab shows both states, because "live" and
 * "five minutes old" must not look the same on a card.
 */
const source = (
  title: string,
  url: string,
  datasetId: string,
  opts: { fetchedAt?: string; fromCache?: boolean } = {},
): ToolSource => ({
  title,
  url,
  checked: CHECKED,
  authority: 'Banco Central do Brasil',
  live: true,
  datasetId,
  ...(opts.fetchedAt ? { fetchedAt: opts.fetchedAt } : {}),
  ...(opts.fromCache !== undefined ? { fromCache: opts.fromCache } : {}),
});

type Point = { date: string; value: number };
type Output = {
  status: 'ok' | 'stale' | 'unavailable' | 'unknown-series';
  series?: string;
  name?: string;
  unit?: string;
  latest?: Point;
  points?: Point[];
  staleByDays?: number;
  reason?: string;
  available?: { key: string; name: string }[];
  sources?: ToolSource[];
};

let n = 0;
const part = (input: { question: string; count?: number }, opts: { state?: WidgetPart['state']; output?: Output } = {}): WidgetPart => {
  const state = opts.state ?? 'output-available';
  return {
    type: 'tool-economiaSeries',
    toolCallId: `fx-economia-${++n}`,
    state,
    input,
    output: state === 'output-available' ? opts.output : undefined,
    errorText: state === 'output-error' ? 'A Central Bank não respondeu' : undefined,
  };
};

const SELIC_URL = 'https://www.bcb.gov.br/controleinflacao/taxasselic';
const SELIC_DATASET = 'sgs-432';
const IPCA_URL = 'https://www.bcb.gov.br/economia/inflacao';
const IPCA_DATASET = 'sgs-13522';
const PTAX_URL = 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes';
const PTAX_DATASET = 'sgs-1';

const selic = (latest: number, days: string[]): Output => ({
  status: 'ok',
  series: 'selic',
  name: 'Taxa Selic',
  unit: '% ao ano',
  latest: { date: days[days.length - 1], value: latest },
  points: days.map((date) => ({ date, value: latest })),
  sources: [source('Banco Central do Brasil — Taxa Selic', SELIC_URL, SELIC_DATASET, { fetchedAt: '2026-11-04T12:00:00Z', fromCache: false })],
});

const fixtures: Fixture[] = [
  { name: 'Streaming input', toolName: 'economiaSeries', part: part({ question: 'qual a taxa Selic agora?' }, { state: 'input-streaming' }) },
  { name: 'Input available, no output yet', toolName: 'economiaSeries', part: part({ question: 'qual a taxa Selic agora?' }, { state: 'input-available' }) },
  {
    name: 'Selic, flat line',
    toolName: 'economiaSeries',
    part: part({ question: 'qual a taxa Selic agora?' }, { output: selic(13.75, ['2026-10-30', '2026-11-02', '2026-11-03', '2026-11-04']) }),
    note: 'A target rate that has not moved: the flat sparkline is the correct picture, not a bug.',
  },
  {
    name: 'Selic, falling',
    toolName: 'economiaSeries',
    part: part({ question: 'a Selic caiu?' }, {
      output: {
        status: 'ok', series: 'selic', name: 'Taxa Selic', unit: '% ao ano',
        latest: { date: '2026-11-04', value: 12.25 },
        points: [
          { date: '2026-09-01', value: 13.75 }, { date: '2026-09-15', value: 13.5 },
          { date: '2026-10-01', value: 13.25 }, { date: '2026-10-15', value: 12.75 },
          { date: '2026-11-01', value: 12.25 }, { date: '2026-11-04', value: 12.25 },
        ],
        sources: [source('Banco Central do Brasil — Taxa Selic', SELIC_URL, SELIC_DATASET, { fetchedAt: '2026-11-04T12:00:00Z', fromCache: false })],
      },
    }),
    note: 'A moving series, so the trend line has a direction and the end point is what to read.',
  },
  {
    name: 'IPCA over 12 months',
    toolName: 'economiaSeries',
    part: part({ question: 'como está a inflação?' }, {
      output: {
        status: 'ok', series: 'ipca12', name: 'IPCA em 12 meses', unit: '%',
        latest: { date: '2026-08-01', value: 4.22 },
        points: [
          { date: '2026-03-01', value: 4.9 }, { date: '2026-04-01', value: 4.6 },
          { date: '2026-05-01', value: 4.5 }, { date: '2026-06-01', value: 4.4 },
          { date: '2026-07-01', value: 4.3 }, { date: '2026-08-01', value: 4.22 },
        ],
        sources: [source('Banco Central do Brasil — IPCA em 12 meses', IPCA_URL, IPCA_DATASET, { fetchedAt: '2026-08-01T00:00:00Z', fromCache: false })],
      },
    }),
  },
  {
    name: 'US dollar, PTAX',
    toolName: 'economiaSeries',
    part: part({ question: 'quanto está o dólar?' }, {
      output: {
        status: 'ok', series: 'dolar', name: 'Dólar comercial (PTAX venda)', unit: 'R$',
        latest: { date: '2026-10-02', value: 5.2238 },
        points: [
          { date: '2026-09-25', value: 5.188 }, { date: '2026-09-28', value: 5.201 },
          { date: '2026-09-29', value: 5.209 }, { date: '2026-09-30', value: 5.2131 },
          { date: '2026-10-01', value: 5.2079 }, { date: '2026-10-02', value: 5.2238 },
        ],
        sources: [source('Banco Central do Brasil — Dollar PTAX sale rate', PTAX_URL, PTAX_DATASET, { fetchedAt: '2026-10-02T13:00:00Z', fromCache: false })],
      },
    }),
  },
  {
    name: 'Stale series is flagged',
    toolName: 'economiaSeries',
    part: part({ question: 'qual a taxa Selic agora?' }, {
      output: {
        status: 'stale', series: 'selic', name: 'Taxa Selic', unit: '% ao ano',
        latest: { date: '2014-12-01', value: 11.75 },
        points: [
          { date: '2014-11-01', value: 11.25 }, { date: '2014-12-01', value: 11.75 },
        ],
        staleByDays: 4345,
        sources: [source('Banco Central do Brasil — Taxa Selic', SELIC_URL, SELIC_DATASET, { fetchedAt: '2014-12-02T00:00:00Z', fromCache: true })],
      },
    }),
    note: 'The shape SGS actually returns for a series it no longer updates. Showing it as "today" would be the worst possible bug in this widget, so it is labelled instead.',
  },
  {
    name: 'Fetch failed: no number at all',
    toolName: 'economiaSeries',
    part: part({ question: 'qual a taxa Selic agora?' }, {
      output: { status: 'unavailable', series: 'selic', name: 'Taxa Selic', reason: 'fetch failed', sources: [source('Banco Central do Brasil — Taxa Selic', SELIC_URL, SELIC_DATASET)] },
    }),
    note: 'A missing figure is reported as missing. It is never estimated, and "no value" must not look like "no change".',
  },
  {
    name: 'Unknown series lists what is available',
    toolName: 'economiaSeries',
    part: part({ question: 'quanto está o bitcoin?' }, {
      output: { status: 'unknown-series', available: [
        { key: 'selic', name: 'Taxa Selic' }, { key: 'selicAcumulada', name: 'Selic acumulada no ano' },
        { key: 'ipca12', name: 'IPCA em 12 meses' }, { key: 'ipcaAcumulado', name: 'IPCA acumulado' },
        { key: 'igpm', name: 'IGPM mensal' }, { key: 'dolar', name: 'Dólar comercial (PTAX venda)' },
      ] },
    }),
  },
  { name: 'Error', toolName: 'economiaSeries', part: part({ question: 'qual a taxa Selic agora?' }, { state: 'output-error' }) },
];

export default fixtures;