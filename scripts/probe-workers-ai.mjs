#!/usr/bin/env node
// Probes Cloudflare Workers AI with the Brazil pack's real prompt, to answer two questions before the
// deployment depends on it: does the model write acceptable Portuguese, and what does a turn cost in
// neurons against the 10,000/day free allocation?
//
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//     scripts/probe-workers-ai.mjs
//   … scripts/probe-workers-ai.mjs --limit 12 --model @cf/zai-org/glm-4.7-flash --json
//
// WHY THE REST API AND NOT THE BINDING: a probe must not need a deploy. This posts to the same OpenAI-
// compatible endpoint the `AI` binding talks to (`/ai/v1/chat/completions`), so the model, the prompt and the
// token counts are what production will see; only the transport differs. Get a token with `cf auth login`
// and the account id from the dashboard, or `cf auth token`.
//
// WHAT IS MEASURED: the app's own two system messages (src/lib/ai/system-prompt.ts), the same routed
// `<official-guidance>` block the chat route appends (src/countries/br/knowledge/router.ts), the same output
// cap, and the pack's own Portuguese questions (the follow-ups in scenarios/starters.data.json). Tools are
// NOT sent: this measures one generation step, which is what the neuron allowance has to cover, and a tool
// loop only adds steps.
//
// NEURONS: the API reports them itself — `usage.neurons` on every response — so that is what the totals use.
// The published rates (5,500 neurons per M input tokens, 36,400 per M output tokens for GLM-4.7-Flash, and
// $0.011 per 1,000 neurons on the Workers Paid plan, https://developers.cloudflare.com/workers-ai/platform/pricing/
// read 2026-10-03) are the fallback for a response that omits the field, and `check:providers` pins them. The
// two agree exactly on every response measured so far. Read the answers below as the quality evidence; this
// script prints them in full for that purpose.
//
// ONE THING THIS CANNOT SHOW: the model's thinking. Workers AI returns it as `reasoning_content`, separate
// from the answer, and the chat route already drops it (`sendReasoning: false`), so a turn that reaches a
// person is answer text only. No tools are sent here, so the model sometimes narrates a search in its answer
// instead of calling one — in production the tools are always offered and come back as real tool calls.
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

process.env.COUNTRY = process.env.COUNTRY || 'br';
register('./lib/ts-hooks.mjs', import.meta.url);

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const AS_JSON = argv.includes('--json');
const MODEL = flag('--model', '@cf/zai-org/glm-4.7-flash');
const LIMIT = Number(flag('--limit', '8'));
const PRINT_CHARS = Number(flag('--chars', '1600'));

/** Neurons per token, from the Workers AI pricing table (see the header). */
const NEURONS_PER_INPUT_TOKEN = 5500 / 1e6;
const NEURONS_PER_OUTPUT_TOKEN = 36400 / 1e6;
const FREE_NEURONS_PER_DAY = 10_000;
const neurons = (inputTokens, outputTokens) =>
  inputTokens * NEURONS_PER_INPUT_TOKEN + outputTokens * NEURONS_PER_OUTPUT_TOKEN;

const { groundingForTurn } = await import('@country/tools');
const { buildInstructions } = await import('@/lib/ai/system-prompt');
const { LIMITS } = await import('@/lib/ai/limits');
const { outputBudget } = await import('@/lib/ai/answer-loop');

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) {
  console.error(
    'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required.\n' +
      '  token:    cf auth login, then copy the API token from the Cloudflare dashboard\n' +
      '  account:  the account id in the dashboard sidebar (or `wrangler whoami`)',
  );
  process.exit(1);
}

/** The pack's own Portuguese questions: the follow-ups it offers after a starter answer. */
const starters = JSON.parse(readFileSync(new URL('../src/countries/br/scenarios/starters.data.json', import.meta.url), 'utf8'));
const questions = [
  ...new Set(
    Object.values(starters)
      .flatMap((s) => s.followUps?.pt ?? [])
      .map((q) => String(q).trim())
      .filter((q) => q.length >= 12),
  ),
].slice(0, LIMIT);

if (!questions.length) {
  console.error('No questions found in scenarios/starters.data.json');
  process.exit(1);
}

const timeZone = 'America/Sao_Paulo';
const today = new Intl.DateTimeFormat('en-CA', { timeZone, dateStyle: 'short' }).format(new Date());
const instructions = buildInstructions({ locale: 'pt', today, timeZone, forceLanguage: true });
const maxTokens = outputBudget('pt', LIMITS.maxOutputTokens);

async function ask(question) {
  const guidance = await groundingForTurn(question);
  const content = guidance ? `${question}\n\n<official-guidance>\n${guidance}\n</official-guidance>` : question;
  const startedAt = Date.now();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/v1/chat/completions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [...instructions.map(({ role, content }) => ({ role, content })), { role: 'user', content }],
        max_tokens: maxTokens,
        stream: false,
      }),
    },
  );
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(body).slice(0, 400)}`);
  const inputTokens = body.usage?.prompt_tokens ?? 0;
  const outputTokens = body.usage?.completion_tokens ?? 0;
  return {
    question,
    answer: body.choices?.[0]?.message?.content ?? '',
    inputTokens,
    outputTokens,
    // What the API billed, when it says; the published rate when it does not.
    reportedNeurons: typeof body.usage?.neurons === 'number' ? body.usage.neurons : undefined,
    neurons: typeof body.usage?.neurons === 'number' ? body.usage.neurons : neurons(inputTokens, outputTokens),
    ms: Date.now() - startedAt,
  };
}

const results = [];
for (const question of questions) {
  try {
    const result = await ask(question);
    results.push(result);
    if (!AS_JSON) {
      console.log(`\n${'─'.repeat(78)}\n${result.question}\n${'─'.repeat(78)}`);
      console.log(
        result.answer.length > PRINT_CHARS ? `${result.answer.slice(0, PRINT_CHARS)}\n…(${result.answer.length} chars)` : result.answer,
      );
      console.log(
        `${result.inputTokens} in + ${result.outputTokens} out tokens · ${result.neurons.toFixed(1)} neurons · ${(result.ms / 1000).toFixed(1)}s`,
      );
    }
  } catch (err) {
    results.push({ question, error: String(err?.message ?? err) });
    if (!AS_JSON) console.log(`\n✗ ${question}\n    ${String(err?.message ?? err)}`);
  }
}

const ok = results.filter((r) => !r.error);
const total = (key) => ok.reduce((sum, r) => sum + r[key], 0);
const average = ok.length ? total('neurons') / ok.length : 0;
/** Latency percentiles: one answer that outruns `AI_MAX_ANSWER_MS` is a truncated turn, not a slow one. */
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
};
const summary = {
  model: MODEL,
  questions: ok.length,
  failed: results.length - ok.length,
  inputTokens: total('inputTokens'),
  outputTokens: total('outputTokens'),
  neurons: Number(total('neurons').toFixed(1)),
  neuronsPerAnswer: Number(average.toFixed(1)),
  freeAllowancePerDay: FREE_NEURONS_PER_DAY,
  percentOfFreeAllowance: Number(((total('neurons') / FREE_NEURONS_PER_DAY) * 100).toFixed(1)),
  answersPerDayOnFreeAllowance: average ? Math.floor(FREE_NEURONS_PER_DAY / average) : 0,
  avgMs: ok.length ? Math.round(total('ms') / ok.length) : 0,
  p50Ms: percentile(ok.map((r) => r.ms), 0.5),
  p90Ms: percentile(ok.map((r) => r.ms), 0.9),
  maxMs: ok.length ? Math.max(...ok.map((r) => r.ms)) : 0,
};

if (AS_JSON) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log(`\n${'═'.repeat(78)}\n${summary.questions} answers from ${summary.model}`);
  console.log(
    `${summary.inputTokens} input + ${summary.outputTokens} output tokens · ${summary.neurons} neurons ` +
      `(${summary.percentOfFreeAllowance}% of the ${FREE_NEURONS_PER_DAY}/day free allowance)`,
  );
  console.log(
    `${summary.neuronsPerAnswer} neurons per answer · ~${summary.answersPerDayOnFreeAllowance} answers/day before the ` +
      `allowance runs out · ${(summary.p50Ms / 1000).toFixed(1)}s median, ${(summary.p90Ms / 1000).toFixed(1)}s p90, ` +
      `${(summary.maxMs / 1000).toFixed(1)}s slowest`,
  );
  if (summary.failed) console.log(`${summary.failed} failed`);
  console.log(
    'One answer here is one generation step. A turn with tools costs more steps, so budget from this number times the steps.',
  );
}