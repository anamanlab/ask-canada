#!/usr/bin/env node
// Builds the Brazil pack's service index from the official federal services catalogue.
//
//   node scripts/fetch-servicos.mjs                 # fetch, filter, write
//   node scripts/fetch-servicos.mjs --file dump.json  # reuse a downloaded dump
//   node scripts/fetch-servicos.mjs --cap 900         # how many services to keep
//   node scripts/fetch-servicos.mjs --check           # write nothing; report drift only
//
// SOURCE: `https://api-servicos.estaleiro.serpro.gov.br/servicos-json` — the Portal de Serviços' own export of
// every federal service, published by SERPRO, reachable with no key and no registration (the documented
// `/servicos-auth` list needs a token; this dump does not). 5,730 services across 240 agencies as of
// 2026-10-02, ~41 MB. The catalogue is the Portal de Serviços, instituted by Decreto 9.756/2019.
//
// WHAT IS SHIPPED: a small, ranked slice. The full dump is 41 MB and the pack only needs retrieval to be
// *good*, not complete — the ministry guidance and `knowledge/pages.ts` carry the shaped answers, and
// `fetchOfficialPage` reads the real page once a service has been chosen. So this keeps a bounded number of
// services, capped per agency so one big publisher (ANVISA alone has 381) cannot crowd out everything else.
//
// THE SHAPE IS MESSY, so it is validated rather than trusted: `palavrasChave` is `{ item: [{ item, id }] }`
// and not an array, `gratuito` is the string `"true"`, `servicoDigital` is a real boolean, and `temLoginGovBR`
// is `"S"`. Every one of those has already broken a naive parser, so this script asserts the shape and
// stops rather than emitting a half-empty index.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SOURCE = 'https://api-servicos.estaleiro.serpro.gov.br/servicos-json';
/** Every catalogue URL shares this prefix; storing the slug alone saves ~40 bytes a record. */
const URL_PREFIX = 'https://www.gov.br/pt-br/servicos/';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const CAP = Number(flag('--cap', '1600'));
const FROM_FILE = flag('--file', null);
const CHECK_ONLY = argv.includes('--check');

/**
 * The agencies the pack knows about, and how many services each may contribute. The first group is the
 * bodies with hand-written guidance in `knowledge/guidance/`, so they are worth the most entries; everything
 * else keeps a handful so that a question about ANAC or INPI still finds something. Matched as a substring of
 * the catalogue's own agency name, so a rename empties a bucket rather than silently mismatching.
 */
const CORE_AGENCIES = [
  'Instituto Nacional do Seguro Social', 'Ministério do Seguro Social',
  'Receita Federal', 'Procuradoria-Geral da Fazenda Nacional',
  'Ministério do Desenvolvimento e Assistência Social',
  'Ministério da Saúde', 'Agência Nacional de Saúde Suplementar',
  'Ministério do Trabalho e Emprego',
  'Ministério da Educação', 'Fundo Nacional de Desenvolvimento da Educação',
  'Ministério da Justiça e Segurança Pública', 'Polícia Federal', 'Polícia Rodoviária Federal',
  'Ministério das Relações Exteriores',
  'Ministério dos Transportes', 'Agência Nacional de Transportes Terrestres', 'Agência Nacional de Aviação Civil',
  'Ministério do Meio Ambiente', 'Instituto Brasileiro do Meio Ambiente', 'Agência Nacional de Águas',
  'Agência Nacional de Energia Elétrica', 'Agência Nacional do Petróleo',
  'Banco Central', 'Instituto Brasileiro de Geografia',
  'Ministério da Gestão', 'Ministério das Cidades',
  'Ministério do Desenvolvimento, Indústria', 'Instituto Nacional da Propriedade Industrial',
  'Comissão de Valores Mobiliários', 'Instituto Nacional de Metrologia',
  'Ministério da Cultura', 'Conselho Nacional de Justiça',
];
const OTHER_AGENCY_CAP = 12;

/**
 * Bodies that publish into the catalogue but are not federal services anyone asks this product about: a
 * university enrolling its own students, a hospital subsidiary issuing a local report, a museum. They make up
 * roughly a third of the 240 agencies and a sixth of the volume, and every slot they take is one a citizen
 * cannot reach. Removed by name pattern; nothing else is filtered.
 *
 * The patterns are matched against the name with its accents folded (see `fold`), because the catalogue
 * spells these bodies "Fundação", "Clínicas", "Superintendência", "Portuária" — a pattern written without the
 * accents silently matched nothing. `Fundacao Universidade` covers both the federal foundations and the
 * state ones ("Fundação Universidade Federal de …", "Fundação Universidade de Brasília").
 */
const EXCLUDED_AGENCIES = [
  /^Universidade /, /^Instituto Federal de Educa/, /^Instituto Federal /,
  /^Fundacao Universidade/, /^Centro Federal de Educa/,
  /^EBSERH/, /^Grupo Hospitalar/, /^Hospital de Clinicas/, /^Hospital Santa/, /^Instituto Nacional de Educacao de Surdos/,
  /^Museu /, /^Instituto de Pesquisas Jardim Botanico/, /^Instituto Joaquim Nabuco/,
  /^Companhia Docas/, /^Companhia de Desenvolvimento dos Vales/,
  /^Superintendencia de Seguros Privados/, /^Superintendencia do Zoneamento Franca de Manaus/,
  /^Autoridade Portuaria/, /^VALEC/,
];

/**
 * Explicit per-agency budgets for the bodies that dominate first questions. Without these a flat cap hands
 * Receita Federal the same number of slots as a ministry with a tenth of its catalogue, and drops three
 * hundred of its three hundred and twenty-eight services. Matched as a substring of the catalogue's agency
 * name; any agency not matched here gets a share-proportional budget (see `select`).
 */
const AGENCY_BUDGET = [
  [/Receita Federal|Procuradoria-Geral da Fazenda/, 150],
  [/Instituto Nacional do Seguro Social|Ministério do Seguro Social/, 90],
  [/Ministério da Sa[úu]de/, 80],
  [/Agência Nacional de Sa[úu]de Suplementar/, 30],
  [/Ministério do Trabalho/, 60],
  [/Ministério da Educa[çc][ãa]o/, 60],
  [/Ministério do Desenvolvimento e Assist/, 45],
  [/Ministério da Justi[çc]a e Seguran[çc]a/, 45],
  [/Polícia Federal/, 45],
  [/Ministério dos Transportes/, 35],
  [/Ministério das Rela[çc][õo]es Exteriores/, 30],
  [/Agência Nacional de Avia[çc][ãa]o Civil/, 25],
  [/Agência Nacional de Transportes Terrestres/, 20],
  [/Banco Central/, 30],
  [/Instituto Brasileiro de Geografia/, 20],
  [/Agência Nacional de Vigil[âa]ncia Sanit/, 25],
  [/Ministério do Meio Ambiente|IBAMA/, 25],
  [/Agência Nacional de Energia El[ée]trica|ANEEL/, 20],
  [/Agência Nacional do Petr[óo]leo|\bANP\b/, 15],
];

/** Agencies worth a full bucket, paired with the pack ministry they belong to (for the `source` label). */
const AGENCY_TO_MINISTRY = [
  [/Instituto Nacional do Seguro Social|Ministério do Seguro Social/, 'inss'],
  [/Receita Federal|Procuradoria-Geral da Fazenda/, 'receita'],
  [/Ministério do Desenvolvimento e Assist/, 'familia'],
  [/Ministério da Sa[úu]de|Agência Nacional de Sa[úu]de Suplementar|Vigilância Sanitária/, 'saude'],
  [/Ministério do Trabalho/, 'trabalho'],
  [/Ministério da Educa|Fundo Nacional de Desenvolvimento da Educa/, 'educacao'],
  [/Ministério da Justi[çc]a|Polícia Federal|Polícia Rodovi/, 'migracao'],
  [/Ministério das Rela[çc][õo]es Exteriores/, 'migracao'],
  [/Ministério dos Transportes|Transportes Terrestres|Avia[çc][ãa]o Civil|ANTAQ|ANAC/, 'transporte'],
  [/Meio Ambiente|IBAMA|Águas|IBAMA/, 'meioambiente'],
  [/Energia El[ée]trica|ANEEL|Petr[óo]leo|\bANP\b/, 'energia'],
  [/Banco Central/, 'numeros'],
  [/Instituto Brasileiro de Geografia/, 'numeros'],
  [/C[âa]mara|Senado|Tribunal Superior Eleitoral/, 'congresso'],
  [/Conselho Nacional de Justi[çc]a/, 'justica'],
];

const problems = [];
const fail = (m) => {
  problems.push(m);
  console.error('✗ ' + m);
};

/* --------------------------------------------------------------------------------------------------- fetch */

async function loadDump() {
  if (FROM_FILE) {
    console.log(`reading ${FROM_FILE}`);
    return readFileSync(FROM_FILE, 'utf8');
  }
  console.log(`fetching ${SOURCE} (~41 MB)…`);
  const res = await fetch(SOURCE, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; fetch-servicos)' } });
  if (!res.ok) throw new Error(`${SOURCE} → HTTP ${res.status}`);
  const text = await res.text();
  console.log(`  ${(text.length / 1024 / 1024).toFixed(1)} MB`);
  return text;
}

/* -------------------------------------------------------------------------------------------------- shape */

const keywordsOf = (rec) => {
  const pk = rec.palavrasChave;
  if (pk == null) return [];
  const items = Array.isArray(pk) ? pk : pk.item;
  if (!Array.isArray(items)) return [];
  return items.map((i) => (typeof i === 'string' ? i : (i?.item ?? ''))).filter((s) => typeof s === 'string' && s.trim());
};
const agencyOf = (rec) => rec.orgao?.nomeOrgao ?? '';
/** The catalogue's own accents dropped, so a pattern written the way a person types still matches it. */
const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isYes = (v) => v === true || v === 'S' || v === 'true' || v === 1;

/** Assert the fields this index depends on actually have the shape we saw on 2026-10-02. */
function assertShape(records) {
  const sample = records.slice(0, 400);
  for (const [field, test, want] of [
    ['nome', (r) => typeof r.nome === 'string', 'string'],
    ['url', (r) => typeof r.url === 'string', 'string'],
    ['orgao.nomeOrgao', (r) => typeof r.orgao?.nomeOrgao === 'string', 'string'],
  ]) {
    const bad = sample.filter((r) => !test(r)).length;
    if (bad > 0) fail(`${bad}/400 records have an unexpected shape for ${field} (expected ${want}) — the catalogue changed; re-check before trusting the index`);
  }
  // 87 records carry `palavrasChave: null`, which `keywordsOf` handles, so only assert where it is present.
  const withKeywords = sample.filter((r) => r.palavrasChave != null);
  const badShape = withKeywords.filter((r) => !Array.isArray(r.palavrasChave?.item) && !Array.isArray(r.palavrasChave)).length;
  if (badShape > 0) fail(`${badShape}/${withKeywords.length} records have an unexpected palavrasChave shape — the catalogue changed; re-check before trusting the index`);
  const urlBad = sample.filter((r) => !r.url.startsWith(URL_PREFIX)).length;
  if (urlBad > 0) console.warn(`  note: ${urlBad}/400 URLs do not start with ${URL_PREFIX}; the slug split will not apply to them`);
}

/* ------------------------------------------------------------------------------------------------- filter */

/**
 * How often a person actually asks about a service, as far as this dump can tell us. There is no view count
 * in the data, so this is a deliberate proxy and the reason the result is a bounded slice rather than
 * everything: a service the Portal highlights, one people have to name a handful of keywords for, and one
 * with a short, general name (a person asks "declarar imposto de renda", not "solicitar tabulação especial").
 */
function score(rec) {
  const words = keywordsOf(rec);
  let s = 0;
  if (isYes(rec.statusDestaque)) s += 6;
  s += Math.min(words.length, 8);
  const name = rec.nome.length;
  s += name <= 45 ? 4 : name <= 70 ? 2 : 0;
  if (rec.servicoDigital === true) s += 1;
  if (isYes(rec.temLoginGovBR)) s += 1;
  return s;
}

const ministryOf = (agency) => AGENCY_TO_MINISTRY.find(([re]) => re.test(agency))?.[1];

/** Bucket the records by agency so one publisher cannot take the whole budget. */
function select(records, cap) {
  const buckets = new Map();
  for (const rec of records) {
    const agency = agencyOf(rec);
    if (EXCLUDED_AGENCIES.some((re) => re.test(fold(agency)))) continue;
    if (!buckets.has(agency)) buckets.set(agency, []);
    buckets.get(agency).push(rec);
  }
  // Without a table entry, an agency's budget is the square root of its share of the catalogue, so a big
  // publisher keeps proportionally more of its services but still cannot take the whole budget.
  const budgetFor = (agency, share) => {
    const explicit = AGENCY_BUDGET.find(([re]) => re.test(agency));
    if (explicit) return explicit[1];
    if (CORE_AGENCIES.some((a) => agency.includes(a))) return Math.max(24, Math.round(Math.sqrt(share) * cap * 0.5));
    return OTHER_AGENCY_CAP;
  };
  const total = records.length;
  const excluded = records.length - [...buckets.values()].reduce((n, l) => n + l.length, 0);
  const chosen = [];
  const overBudget = [];
  for (const [agency, list] of buckets) {
    const room = budgetFor(agency, list.length / total);
    list.sort((a, b) => score(b) - score(a) || a.nome.localeCompare(b.nome, 'pt-BR'));
    chosen.push(...list.slice(0, room));
    if (list.length > room) overBudget.push([agency, list.length - room]);
  }
  // If the per-agency caps left the budget unused, refill from the best of what was dropped.
  chosen.sort((a, b) => score(b) - score(a));
  const kept = chosen.slice(0, cap);
  if (chosen.length < cap) {
    const inIndex = new Set(kept.map((r) => r.id));
    const dropped = records.filter((r) => !inIndex.has(r.id)).sort((a, b) => score(b) - score(a));
    kept.push(...dropped.slice(0, cap - chosen.length));
  }
  kept.sort((a, b) => agencyOf(a).localeCompare(agencyOf(b), 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
  return { kept, overBudget, excluded };
}

/* -------------------------------------------------------------------------------------------------- clean */

/** The catalogue's prose carries markdown emphasis with stray spaces (`de** **declarações`). */
const clean = (s) =>
  (s ?? '')
    .replace(/\*\*\s*\*\*/g, ' ')
    .replace(/[*_`]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* -------------------------------------------------------------------------------------------------- emit */

function emit(kept, fetched) {
  const agencies = [...new Set(kept.map((r) => agencyOf(r)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const agencyId = new Map(agencies.map((a, i) => [a, i]));

  // One record per service: [slug, name, agency index, keywords, ministry index, flags]
  const rows = kept.map((r) => {
    const slug = r.url.startsWith(URL_PREFIX) ? r.url.slice(URL_PREFIX.length) : r.url;
    const keywords = [...new Set(keywordsOf(r).map((k) => k.trim()).filter(Boolean))].slice(0, 14);
    // The minimum account level is a code of its own ('B' · 'P' · 'O'), not a yes/no: it has to be read
    // directly, or no service would ever carry a level. Every record that names one also asks for a login.
    const level = r.temNivelMinimoContaGovBR;
    const flags =
      (r.servicoDigital === true ? 'd' : '') +
      (isYes(r.gratuito) ? 'g' : '') +
      (isYes(r.temLoginGovBR) ? 'l' : '') +
      (level === 'O' ? 'o' : level === 'P' ? 'p' : level === 'B' ? 'b' : '');
    return `[${JSON.stringify(slug)},${JSON.stringify(clean(r.nome))},${agencyId.get(agencyOf(r))},${JSON.stringify(keywords.map(clean).join(' '))},${JSON.stringify(ministryOf(agencyOf(r)) ?? '')},${JSON.stringify(flags)}]`;
  });

  const body = `/**
 * The Brazil pack's service index, GENERATED by \`node scripts/fetch-servicos.mjs\` — do not edit.
 *
 * Source: the Portal de Serviços' own export of every federal service, published by SERPRO, no key required:
 *   ${SOURCE}
 * Fetched ${fetched} · ${kept.length} services kept · ${agencies.length} agencies.
 *
 * This is a **bounded slice**, not the whole catalogue, and that is deliberate: the model is grounded by
 * \`knowledge/guidance/\` and \`knowledge/pages.ts\`, and \`fetchOfficialPage\` reads the real page once a
 * service has been chosen. Shipping all 5,730 would add about a megabyte to the server bundle for recall
 * this pack does not use.
 *
 * Row shape (positional, to keep the file small):
 *   [slug, name, agency index, keywords, ministry key, flags]
 *     slug ....... the catalogue URL minus \`${URL_PREFIX}\`; prefix it back with \`URL_PREFIX\`
 *     agency ..... index into \`AGENCIES\`
 *     ministry ... a key of \`MINISTRIES\`, or '' when no guidance file covers that body
 *     flags ...... d = servicoDigital · g = gratuito · l = needs a gov.br login
 *                 b/p/o = the minimum account level that service accepts: básico / prata / ouro
 *
 * \`name\` and \`keywords\` are in Portuguese, the only language the Portal de Serviços publishes in.
 */

/** The catalogue's shared URL prefix; a row's slug is appended to it. */
export const URL_PREFIX = '${URL_PREFIX}';

export const AGENCIES: readonly string[] = ${JSON.stringify(agencies)};

export type Service = {
  /** The catalogue's slug; the official page is \`URL_PREFIX + slug\`. */
  slug: string;
  /** The service's own name, in Portuguese. */
  name: string;
  agency: string;
  /** Space-separated catalogue keywords. */
  keywords: string;
  /** A \`MINISTRIES\` key when a guidance file covers this body, else ''. */
  ministry: string;
  /** d servicoDigital · g gratuito · l loginGovBR · b/p/o minimum account level. */
  flags: string;
};

type Row = readonly [string, string, number, string, string, string];

const ROWS: readonly Row[] = [
${rows.join(',\n')}
];

export const SERVICES: Service[] = ROWS.map(([slug, name, agency, keywords, ministry, flags]) => ({
  slug,
  name,
  agency: AGENCIES[agency] ?? '',
  keywords,
  ministry,
  flags,
}));

/** The official page for a service. */
export const serviceUrl = (s: Service) => (s.slug.startsWith('http') ? s.slug : URL_PREFIX + s.slug);

/** Does this service need a gov.br account, and at which level? ('' = no account needed.) */
export const accountLevel = (s: Service) => (s.flags.includes('o') ? 'Ouro' : s.flags.includes('p') ? 'Prata' : s.flags.includes('b') ? 'Básico' : '');
`;

  const out = new URL('../src/countries/br/knowledge/servicos.index.ts', import.meta.url);
  return { out, body };
}

/**
 * The per-service detail file. The search index answers "which service"; this answers
 * "what does getting it involve" — the stages, who it is for, how long it takes, and
 * where to ask. It is a separate file, imported only by the detail tool, so the search
 * path never pays for prose it does not read.
 *
 * Two honest omissions, both documented where they matter. The catalogue's `legislacoes`
 * are internal SERPRO ids with no titles, so they are not shipped: inventing links for
 * them would be worse than pointing at the official page, which lists the real ones.
 * And `tempoTotalEstimado` is empty on three services in five, so a missing time is
 * reported as missing, never as zero.
 *
 * Row shape (positional, sparse — empty fields are omitted, not blank):
 *   [etapas, solicitantes, tempo, contato, link]
 *     etapas ....... [[title, description], …] (at most 5; descriptions are the catalogue's
 *                    own words, trimmed to the useful length, never rewritten)
 *     solicitantes . [who this is for, …] (at most 3)
 *     tempo ........ the catalogue's own estimate, or '' when it gives none
 *     contato ...... where to ask, as published
 *     link ......... the digital-service URL, when the catalogue names one
 */
/**
 * The catalogue's own time estimate, in its own words. The fields are structured
 * ({max, unidade}, {min, max, unidade}), never prose — except on three records in the
 * whole dump, which carry a free-text `descricao` instead. Anything else (including a
 * missing estimate, the common case) is '' and the card says the catalogue gives none.
 */
const UNIDADE = {
  'dias-uteis': 'dias úteis',
  'dias-corridos': 'dias corridos',
  horas: 'horas',
  meses: 'meses',
  minutos: 'minutos',
};
function tempoOf(tt) {
  if (!tt || typeof tt !== 'object') return '';
  if (tt.descricao) return clean(tt.descricao).slice(0, 180);
  const unit = (v) => UNIDADE[v?.unidade] ?? '';
  if (tt.emMedia?.max) return `em média ${tt.emMedia.max} ${unit(tt.emMedia)}`.trim();
  if (tt.entre?.min && tt.entre?.max) return `entre ${tt.entre.min} e ${tt.entre.max} ${unit(tt.entre)}`.trim();
  if (tt.ate?.max) return `até ${tt.ate.max} ${unit(tt.ate)}`.trim();
  return '';
}

function emitDetail(kept, fetched) {
  const bySlug = {};
  for (const r of kept) {
    const slug = r.url.startsWith(URL_PREFIX) ? r.url.slice(URL_PREFIX.length) : r.url;
    const etapas = (r.etapas ?? [])
      .slice(0, 5)
      .map((e) => [clean(e.titulo).slice(0, 100), clean(e.descricao).slice(0, 400)])
      .filter(([t, d]) => t || d);
    const solicitantes = ((r.solicitantes?.solicitante ?? []).map((x) => clean(x.tipo).slice(0, 180)) ?? []).slice(0, 3).filter(Boolean);
    const tempo = tempoOf(r.tempoTotalEstimado);
    const contato = clean(r.contato).slice(0, 300);
    const link = (r.linkServicoDigital ?? '').slice(0, 220);
    const row = [etapas, solicitantes, tempo, contato, link];
    // Sparse: a service with no detail beyond the index row costs nothing here.
    if (row.some((f) => (Array.isArray(f) ? f.length : f))) bySlug[slug] = row;
  }

  const body = `/**
 * Per-service detail for the Brazil pack's service index, GENERATED by
 * \`node scripts/fetch-servicos.mjs\` — do not edit. Regenerated with the index,
 * from the same dump, so the two can never disagree about which services exist.
 *
 * Fetched ${fetched} · ${Object.keys(bySlug).length} services carry detail.
 *
 * Row shape (positional, sparse): [etapas, solicitantes, tempo, contato, link].
 * See \`emitDetail\` in the generator for what each field means and what was
 * deliberately left out (legislation ids without titles; time estimates the
 * catalogue never gave).
 */

/** The dump date behind this file, for source provenance. */
export const DETAIL_FETCHED = '${fetched}';

/** Detail by catalogue slug. Absent means the index row is the whole record. */
export const DETAIL: Record<string, readonly [etapas: string[][], solicitantes: string[], tempo: string, contato: string, link: string]> = ${JSON.stringify(
    bySlug,
  )};
`;
  const out = new URL('../src/countries/br/knowledge/servicos.detalhes.ts', import.meta.url);
  return { out, body };
}

/* --------------------------------------------------------------------------------------------------- run */

const raw = await loadDump();
const parsed = JSON.parse(raw);
const records = parsed?.resposta;
if (!Array.isArray(records)) throw new Error('the dump has no `resposta` array');
console.log(`  ${records.length} services in the catalogue`);
assertShape(records);
// The whole pipeline below reads the fields `assertShape` just doubted, so stop here rather than sort 5,600
// records on them: the diagnosis above is the useful output, and the checked-in index stays as it is.
if (problems.length) {
  console.log(`\n${problems.length} problem(s) — nothing written; src/countries/br/knowledge/servicos.index.ts is unchanged`);
  process.exit(1);
}

const withKeywords = records.filter((r) => keywordsOf(r).length > 0);
const { kept, overBudget, excluded } = select(withKeywords, CAP);
const agencies = new Set(kept.map((r) => agencyOf(r)));
console.log(`  ${withKeywords.length} carry keywords; ${excluded} dropped as university/hospital/museum services; ${kept.length} kept across ${agencies.size} agencies (per-agency budget: table, else share-proportional, floor ${OTHER_AGENCY_CAP})`);
if (overBudget.length) {
  console.log(`  ${overBudget.length} agencies hit their cap; the biggest gap:`);
  for (const [agency, dropped] of overBudget.sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`    ${String(dropped).padStart(4)}  ${agency}`);
}

const fetched = new Date().toISOString().slice(0, 10);
const { out, body } = emit(kept, fetched);
const detail = emitDetail(kept, fetched);
mkdirSync(new URL('../src/countries/br/knowledge/', import.meta.url), { recursive: true });

if (CHECK_ONLY) {
  const current = readFileSync(out, 'utf8').replace(/Fetched \S+/, `Fetched ${fetched}`);
  const currentDetail = readFileSync(detail.out, 'utf8')
    .replace(/Fetched \S+/, `Fetched ${fetched}`)
    .replace(/DETAIL_FETCHED = '\S+'/, `DETAIL_FETCHED = '${fetched}'`);
  const ok = current === body && currentDetail === detail.body;
  console.log(ok ? '\n✓ the index and its detail are up to date' : '\n✗ the index is stale: run node scripts/fetch-servicos.mjs');
  process.exit(ok ? 0 : 1);
}

// Anything recorded on the way here means this index would not be trustworthy: leave the checked-in file be.
if (problems.length) {
  console.log(`\n${problems.length} problem(s) — nothing written; src/countries/br/knowledge/servicos.index.ts is unchanged`);
  process.exit(1);
}

writeFileSync(out, body);
writeFileSync(detail.out, detail.body);
console.log(`  detail: ${detail.body.length} bytes for the per-service file`);
console.log(`✓ wrote src/countries/br/knowledge/servicos.index.ts (${(body.length / 1024).toFixed(0)} KB, ${kept.length} services)`);