/**
 * Live Drug Product Database lookup for `healthDrugLookup` (server only). The database's JSON is validated with
 * zod, every call has a timeout and a cache window, and the result is always renderable (live: false, never a throw).
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson, type FetchOptions } from '@/lib/server/fetch-json';
import type { Lang } from './data';
import { accessOf, cleanDrugQuery, dinOf, isDin, productUrl, rankProducts, statusOf, type DrugOutput, type DrugProduct } from './drugs';
import { drugLinks, otherLang } from './links';
import { shared, type Memo } from './live-shared';

const DPD = 'https://health-products.canada.ca/api/drug';

/** The database leaves fields empty or null freely: text is trimmed, and anything missing reads as ''. */
const text = z
  .string()
  .nullish()
  .transform((v) => v?.trim() ?? '');

/** A list where one malformed row is dropped instead of failing the whole lookup. */
function listOf<S extends z.ZodType>(row: S) {
  return z.array(z.unknown()).transform((rows) =>
    rows.flatMap((r): z.output<S>[] => {
      const parsed = row.safeParse(r);
      return parsed.success ? [parsed.data] : [];
    }),
  );
}

const DpdProduct = z.object({
  drug_code: z.number(),
  class_name: text,
  drug_identification_number: z.string().min(1),
  brand_name: z.string().trim().min(1),
  descriptor: text,
  company_name: text,
  number_of_ais: z.union([z.string(), z.number()]).nullish(),
});
type DpdProduct = z.output<typeof DpdProduct>;
const DpdProducts = listOf(DpdProduct);
const DpdStatus = z.object({ status: text, external_status_code: z.number(), history_date: text, original_market_date: text });
/** strength + strength_unit per dosage_value + dosage_unit, e.g. 1.34 MG per (1) ML. */
const DpdIngredients = listOf(z.object({ ingredient_name: z.string().trim().min(1), strength: text, strength_unit: text, dosage_value: text, dosage_unit: text }));
const DpdForms = listOf(z.object({ pharmaceutical_form_name: text }));
const DpdRoutes = listOf(z.object({ route_of_administration_name: text }));
const DpdSchedules = listOf(z.object({ schedule_name: text }));

/** Validated JSON from the database, or null when the call or its shape fails. */
async function dpd<S extends z.ZodType>(path: string, schema: S, o: FetchOptions): Promise<z.output<S> | null> {
  const res = await fetchJson(`${DPD}/${path}&type=json`, schema, o);
  return res.ok ? res.data : null;
}

const PICK = 6;
const drugMemo: Memo<DrugOutput> = new Map();

/** Live Drug Product Database lookup by brand name or DIN. */
export function liveDrugs(input: { query: string; lang: Lang }, signal?: AbortSignal, now = new Date()): Promise<DrugOutput> {
  const key = `${input.lang}|${cleanDrugQuery(input.query).toUpperCase()}`;
  return shared(drugMemo, key, now, signal, () => fetchDrugs(input, now));
}

async function fetchDrugs(input: { query: string; lang: Lang }, now: Date): Promise<DrugOutput> {
  const { lang } = input;
  const query = cleanDrugQuery(input.query);
  const kind = isDin(query) ? 'din' : 'name';
  const opts: FetchOptions = { timeout: 5000, revalidate: 43_200 };
  const result = (live: boolean, total: number, marketed: number, products: DrugProduct[]): DrugOutput => ({
    query,
    kind,
    lang,
    fetchedAt: now.toISOString(),
    live,
    total,
    marketed,
    products,
    ...drugLinks(lang, live),
    alt: drugLinks(otherLang(lang), live),
  });
  if (!query || (kind === 'name' && query.length < 3)) return result(true, 0, 0, []);
  const q = kind === 'din' ? `din=${dinOf(query)}` : `brandname=${encodeURIComponent(query)}`;
  const [all, marketedList] = await Promise.all([
    dpd(`drugproduct/?${q}&lang=${lang}`, DpdProducts, opts),
    kind === 'name' ? dpd(`drugproduct/?${q}&status=2&lang=${lang}`, DpdProducts, opts) : null,
  ]);
  if (!all) return result(false, 0, 0, []);
  // Human-use products only for a name search (veterinary and disinfectant products share brand names).
  const human = (p: DpdProduct) => kind === 'din' || /^(human|humain)$/i.test(p.class_name);
  const allHuman = all.filter(human);
  const marketedCodes = new Set((marketedList ?? []).filter(human).map((p) => p.drug_code));
  const pool = marketedCodes.size ? allHuman.filter((p) => marketedCodes.has(p.drug_code)) : allHuman;
  // Rank on names before fetching details, then fetch details for the first few only.
  const pre = rankProducts(
    pool.map((p) => stub(p, marketedCodes.has(p.drug_code), lang)),
    query,
  ).slice(0, PICK);
  const products = await Promise.all(pre.map((p) => details(p, lang, opts)));
  const marketed = marketedList ? marketedCodes.size : products.filter((p) => p.status === 'marketed').length;
  return result(true, allHuman.length, marketed, rankProducts(products, query));
}

function stub(p: DpdProduct, marketed: boolean, lang: Lang): DrugProduct {
  return {
    drugCode: p.drug_code,
    din: p.drug_identification_number,
    brand: p.brand_name,
    descriptor: p.descriptor || undefined,
    company: p.company_name,
    className: p.class_name,
    status: marketed ? 'marketed' : 'inactive',
    ingredients: [],
    forms: [],
    routes: [],
    schedules: [],
    access: 'other',
    url: productUrl(p.drug_code, lang),
    ais: Number(p.number_of_ais) || undefined,
  };
}

/** Status, ingredients, form, route and schedule of one product; a part that fails is simply left out. */
async function details(p: DrugProduct, lang: Lang, opts: FetchOptions): Promise<DrugProduct> {
  const q = `?id=${p.drugCode}&lang=${lang}`;
  const [status, ai, form, route, sched] = await Promise.all([
    dpd(`status/${q}`, DpdStatus, opts),
    dpd(`activeingredient/${q}`, DpdIngredients, opts),
    dpd(`form/${q}`, DpdForms, opts),
    dpd(`route/${q}`, DpdRoutes, opts),
    dpd(`schedule/${q}`, DpdSchedules, opts),
  ]);
  const names = (list: string[]) => [...new Set(list.filter(Boolean))];
  const schedules = (sched ?? []).map((s) => s.schedule_name).filter(Boolean);
  return {
    ...p,
    status: status ? statusOf(status.external_status_code) : p.status,
    statusLabel: status?.status || undefined,
    statusCode: status?.external_status_code,
    statusDate: status?.history_date || undefined,
    since: status?.original_market_date || undefined,
    ingredients: (ai ?? []).map((a) => ({
      name: a.ingredient_name,
      strength: a.strength || undefined,
      unit: a.strength_unit || undefined,
      per: a.dosage_value || undefined,
      perUnit: a.dosage_unit || undefined,
    })),
    forms: names((form ?? []).map((f) => f.pharmaceutical_form_name)),
    routes: names((route ?? []).map((r) => r.route_of_administration_name)),
    schedules,
    access: accessOf(schedules),
  };
}
