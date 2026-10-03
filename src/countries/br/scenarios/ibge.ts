/**
 * Scripted answers for the `ibge` widget. These really call `ibgePlace`, so the code on screen is the code
 * the answer gives.
 *
 * The answer never resolves a bare name to a single city on its own. Several municipalities share common
 * names, so the code is presented as the thing to confirm — and when the tool reports more than one match,
 * the wording says so instead of implying the first one is certainly right.
 */
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

type Match = { name: { pt: string; en: string }; code: string; uf?: { sigla: string; name: { pt: string; en: string } }; region?: { name: { pt: string; en: string } } };
type StateAnswer = {
  sigla: string;
  name: { pt: string; en: string };
  region: { sigla: string; name: { pt: string; en: string } };
  count: number;
  sample: { name: { pt: string; en: string }; code: string }[];
};
type Output = {
  query: string;
  matches: Match[];
  ambiguous?: boolean;
  exact?: boolean;
  state?: StateAnswer;
};

/**
 * Pull the place out of the question. The answer and the card must search for the *same* thing, so both go
 * through this one function: passing the whole sentence to the tool is how the card ends up empty next to a
 * correct answer, which looks like a bug in the widget and is really a bug in the input.
 */
function placeOf(text: string): string {
  // Drop the question's own vocabulary and keep what is left. Position-based extraction kept missing this:
  // "Quais municípios se chamam Santa Rita?" has its name after a connector nobody enumerated, and the
  // alternative is a tool call with no match next to an answer claiming otherwise.
  const noise = new Set(
    ('qual quais o a os as um uma de do da dos das em no na nos nas para por e é se chamam chamada chamado ' +
      'código codigo codigos ibge municipio municípios cidade cidades região regiao regiao the is are code codes city ' +
      'municipality municipalities what which of for in to me diga').split(' '),
  );
  const words = text
    .replace(/[?!.,;:]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ''))
    .filter((w) => w && !noise.has(w.toLowerCase()));
  return words.join(' ');
}

/**
 * What to hand the tool. A question about a state's municipalities is answered by the
 * tool itself — it detects the state in the sentence — so it must get the sentence, not
 * an extracted city name. Feeding it "existem Pernambuco" would be the easier mistake:
 * a word that is not a place, asked about as if it were one.
 */
function queryFor(text: string): string {
  // Folded before testing: "municípios" and "municipios" are the same word,
  // and an accent-sensitive test would extract a city from a state question.
  const folded = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\bmunicipios?\b/i.test(folded) ? text : placeOf(text);
}

async function read(place: string) {
  const { tools } = await import('../tools/ibge');
  const context = { toolCallId: 'sc-ibge', messages: [], context: undefined } as Parameters<NonNullable<typeof tools.ibgePlace.execute>>[1];
  const out = await tools.ibgePlace.execute?.({ place, limit: 3 }, context);
  return (out ?? {}) as Output;
}

/** "São Paulo (SP) — código IBGE 3550308" for however many places actually matched. */
function listMatches(r: Output, locale: string) {
  const en = locale === 'en';
  const names = r.matches.map((m) => {
    const name = m.name[en ? 'en' : 'pt'] ?? m.name.pt;
    const uf = m.uf ? ` (${m.uf.sigla})` : '';
    const region = m.region ? ` — ${en ? 'region' : 'região'} ${m.region.name[en ? 'en' : 'pt']}` : '';
    return `${name}${uf}${region} — **${m.code}**`;
  });
  return names.join(en ? '\n' : '\n');
}

/**
 * "Pernambuco (PE), região Nordeste — 185 municípios" plus the sample the tool returns.
 *
 * A state is not a lookup, so it is not answered like one: what a person asking about a
 * state's municipalities wants is the count and the page that holds the whole list. The
 * sample is stated to be alphabetical, because there is no honest way to rank 185
 * municipalities without population figures.
 */
function describeState(r: Output, locale: string) {
  const en = locale === 'en';
  const st = r.state;
  if (!st) return '';
  const region = st.region ? ` — ${en ? 'region' : 'região'} ${st.region.name[en ? 'en' : 'pt']}` : '';
  const sample = st.sample
    .map((m) => `${m.name[en ? 'en' : 'pt']} (**${m.code}**)`)
    .join(', ');
  return `${st.name[en ? 'en' : 'pt']} (${st.sigla})${region} — **${st.count}** ${
    en ? 'municipalities' : 'municípios'
  }. ${en ? 'Sample, alphabetical' : 'Amostra, em ordem alfabética'}: ${sample}.`;
}

const scenarios: Scenario[] = [
  {
    id: 'place-ibge',
    priority: 6,
    match: [
      /\bc[óo]digo (do )?ibge\b/i,
      /\bqual (o )?c[óo]digo (do )?(munic[íi]pio|ibge)\b/i,
      /\bc[óo]digo (do )?munic[íi]pio\b/i,
      /\bibge code\b/i,
      /\bwhat (is|are) the (ibge )?code (for|of)\b/i,
      /\bqual (é o )?munic[íi]pio\b/i,
      /\bmunicipalities\b/i,
      /\b(quais|what|which) munic[íi]pios\b/i,
      // "Quais são os municípios de Pernambuco?" — the brief's own worked example.
      // Any mention of municípios near a state preposition is a place question.
      /\bmunic[íi]pios?\b/i,
      /\bqual (é o |a )?(estado|regi[ãa]o)\b/i,
      /\bregi[ãa]o de\b/i,
      /\bwhich (state|uf|region)\b/i,
    ],
    reply: {
      pt: `# {places}

O código IBGE do município é o número que toda a administração federal usa: formulário, benefício, cadastro e
transferência são todos indexados por ele. É por isso que dois municípios com o mesmo nome precisam ser
diferenciados pelo código, e não pelo nome.

Ele tem sete dígitos e começa pelo código do estado — os dois primeiros dígitos de São Paulo (3550308) são 35,
que é o código de São Paulo. [1](https://www.ibge.gov.br/cidades-e-estados)

{stateHint}`,
      en: `# {places}

The IBGE municipality code is the number the whole federal administration keys on: forms, benefits, records
and transfers are all indexed by it. That is why two municipalities sharing a name have to be told apart by
code rather than by name.

It is seven digits and starts with the state's own code — the first two digits of São Paulo (3550308) are 35,
which is São Paulo. [1](https://www.ibge.gov.br/cidades-e-estados)

{stateHint}`,
    },
    vars: async (ctx: ScenarioCtx) => {
      const r = await read(queryFor(ctx.text));
      const places = r.state
        ? describeState(r, ctx.locale)
        : listMatches(r, ctx.locale);
      return {
        places:
          places ||
          (ctx.locale === 'en' ? 'I could not match that to a municipality.' : 'Não consegui associar esse nome a um município.'),
        // A question about a state is answered with a count, so the closing line has to
        // point at the full list; a question about a city keeps the disambiguation line.
        stateHint: r.state
          ? ctx.locale === 'en'
            ? 'The complete list is on the IBGE page — this card shows the count and an alphabetical sample only.'
            : 'A lista completa está na página do IBGE — este cartão mostra apenas a contagem e uma amostra alfabética.'
          : ctx.locale === 'en'
            ? 'If your municipality is one of the others with the same name, tell me the state and I will narrow it down.'
            : 'Se o seu município é outro dos que têm o mesmo nome, me diga o estado que eu refino a busca.',
      };
    },
    toolCalls: [{ toolName: 'ibgePlace', input: (ctx: ScenarioCtx) => ({ place: queryFor(ctx.text) }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Qual é o código IBGE de Manaus?', 'Quais municípios se chamam Santa Rita?', 'Qual a região de Niterói?'],
      en: ['What is the IBGE code for Manaus?', 'Which municipalities are called Santa Rita?', 'Which region is Niterói in?'],
    },
  },
];

export default scenarios;