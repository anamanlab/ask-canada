/**
 * What a model call costs, estimated from the token usage the AI SDK reports. This is the only place prices
 * live. It feeds the daily spend circuit breaker (`budget.ts`); it is an estimate for a safety cut-off, not
 * an invoice (the provider's bill is the source of truth).
 *
 * Prices are US dollars per million tokens, list price, copied from the AI Gateway model catalogue
 * (https://ai-gateway.vercel.sh/v1/models, which matches the providers' own list prices) on 2026-10-01.
 * When a price changes or you deploy a model that is not listed: edit the table, or set AI_PRICE_INPUT and
 * AI_PRICE_OUTPUT (and optionally AI_PRICE_CACHE_READ / AI_PRICE_CACHE_WRITE) on the host. An unknown model
 * is charged at the most expensive row, so the breaker trips early rather than late.
 */
import type { LanguageModelUsage } from 'ai';

export type Price = {
  /** Uncached input tokens. */
  input: number;
  output: number;
  /** Input tokens read from the prompt cache. */
  cacheRead: number;
  /** Input tokens written to the prompt cache. */
  cacheWrite: number;
};

/** Keyed by the model family as it appears in the id, dots written as dashes. The longest match wins. */
export const PRICES: Record<string, Price> = {
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-7': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-6': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-5': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'claude-fable-5': { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 },
  // Google Gemini, from the same gateway catalogue, 2026-10-01. Google publishes no prompt-cache
  // price for these rows, so cache reads are charged at the full input price: overcharging an
  // estimate trips the breaker early rather than late, which is the safe direction to err in.
  // Keys are dash-normalised (`priceFor` replaces dots), which is why they are not Gemini's own spelling.
  'gemini-3-8-flash-lite': { input: 0.5, output: 6, cacheRead: 0.5, cacheWrite: 0.5 },
  'gemini-3-8-flash': { input: 0.75, output: 3.75, cacheRead: 0.75, cacheWrite: 0.75 },
  'gemini-3-7-flash': { input: 0.75, output: 3.75, cacheRead: 0.75, cacheWrite: 0.75 },
  'gemini-3-6-flash': { input: 0.75, output: 3.75, cacheRead: 0.75, cacheWrite: 0.75 },
  'gemini-3-5-flash-lite': { input: 0.3, output: 2.5, cacheRead: 0.3, cacheWrite: 0.3 },
  'gemini-3-5-flash': { input: 1.5, output: 9, cacheRead: 1.5, cacheWrite: 1.5 },
  'gemini-3-1-flash-lite': { input: 0.25, output: 1.5, cacheRead: 0.25, cacheWrite: 0.25 },
  'gemini-3-1-pro-preview': { input: 2, output: 12, cacheRead: 2, cacheWrite: 2 },
  'gemini-3-pro-preview': { input: 2, output: 12, cacheRead: 2, cacheWrite: 2 },
  'gemini-3-flash-preview': { input: 0.5, output: 3, cacheRead: 0.5, cacheWrite: 0.5 },
  'gemini-2-5-pro': { input: 1.25, output: 10, cacheRead: 1.25, cacheWrite: 1.25 },
  'gemini-2-5-flash': { input: 0.3, output: 2.5, cacheRead: 0.3, cacheWrite: 0.3 },
  'gemini-2-5-flash-lite': { input: 0.1, output: 0.4, cacheRead: 0.1, cacheWrite: 0.1 },
  // Cloudflare Workers AI, from the Workers AI pricing table on 2026-10-03. GLM-4.7-Flash is the
  // Cloudflare-hosted default for Ask Brasil. Cloudflare bills it in neurons (10,000/day free, then
  // $0.011/1,000 neurons); the token prices below are the same rate expressed per million tokens, which is
  // what `estimateCostUsd` needs. Cloudflare publishes no prompt-cache price for it, so cache reads and
  // writes are charged at the full input price: overcharging an estimate trips the breaker early, not late.
  'glm-4-7-flash': { input: 0.06, output: 0.4, cacheRead: 0.06, cacheWrite: 0.06 },
};

/** Anthropic's native web search, per search (10 USD per 1,000). */
export const WEB_SEARCH_USD = 0.01;

const KEYS = Object.keys(PRICES).sort((a, b) => b.length - a.length);
const HIGHEST = Object.values(PRICES).reduce((a, b) => (b.output > a.output ? b : a));

const envPrice = (name: string) => {
  const n = Number(process.env[name]);
  return process.env[name]?.trim() && Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** The price row for a model id from any provider (`anthropic/claude-sonnet-5.5`, `us.anthropic.claude-…-v1:0`). */
export function priceFor(modelId: string): Price & { known: boolean } {
  const input = envPrice('AI_PRICE_INPUT');
  const output = envPrice('AI_PRICE_OUTPUT');
  if (input !== undefined && output !== undefined) {
    return {
      input,
      output,
      cacheRead: envPrice('AI_PRICE_CACHE_READ') ?? input * 0.1,
      cacheWrite: envPrice('AI_PRICE_CACHE_WRITE') ?? input * 1.25,
      known: true,
    };
  }
  const id = modelId.toLowerCase().replaceAll('.', '-');
  const key = KEYS.find((k) => id.includes(k));
  return key ? { ...PRICES[key], known: true } : { ...HIGHEST, known: false };
}

type Usage = Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens'> & {
  inputTokenDetails?: Partial<LanguageModelUsage['inputTokenDetails']>;
};

/** Estimated US dollars for one model call. Missing counts are treated as zero. */
export function estimateCostUsd(modelId: string, usage: Usage, webSearches = 0): number {
  const p = priceFor(modelId);
  const read = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const write = usage.inputTokenDetails?.cacheWriteTokens ?? 0;
  // `inputTokens` is the total; what was neither read from nor written to the cache is plain input.
  const plain = usage.inputTokenDetails?.noCacheTokens ?? Math.max(0, (usage.inputTokens ?? 0) - read - write);
  const tokens = plain * p.input + read * p.cacheRead + write * p.cacheWrite + (usage.outputTokens ?? 0) * p.output;
  return tokens / 1_000_000 + Math.max(0, webSearches) * WEB_SEARCH_USD;
}

/**
 * The cost the provider itself reported for a call, when it does: Vercel AI Gateway returns it as
 * `providerMetadata.gateway.cost`. Preferred over the estimate (it already includes web search).
 */
export function reportedCostUsd(providerMetadata: Record<string, Record<string, unknown> | undefined> | undefined): number | undefined {
  const raw = providerMetadata?.gateway?.cost;
  const n = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
