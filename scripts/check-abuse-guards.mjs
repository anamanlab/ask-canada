#!/usr/bin/env node
// Abuse and cost guards for /api/chat (CI; offline, no model call, no network):
//   limits      malformed env values never turn a cap off
//   rate limit  token bucket, shared stores (Redis, Vercel Firewall), layering, fail-open
//   context     history is cut to a character budget, newest first
//   pricing     cost estimate per model call
//   budget      the daily spend breaker trips, stays tripped, resets at 00:00 UTC, survives a store outage
//   bots        BotID is a no-op off Vercel and in dev; verified-bot policy
//   abort       a client that disconnects (or an answer that runs too long) stops the model call
//   loop        the answer loop ends on suggestFollowUps and at its limits, and knows a status line from an answer
//   tools       a tool call that overruns its time budget fails and its upstream requests are aborted
//   log         one JSON line per turn: counts, names and durations only
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-abuse-guards.mjs
import { register } from 'node:module';
import assert from 'node:assert/strict';

register('./lib/ts-hooks.mjs', import.meta.url);

let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`✗ ${name}\n    ${String(err?.message ?? err).split('\n').join('\n    ')}`);
  }
}
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const quiet = () => {};
const req = new Request('http://localhost/api/chat', { method: 'POST' });

// ---------------------------------------------------------------------------------------------- limits
const { envInt } = await import('@/lib/ai/limits');
await check('limits: a malformed or out-of-range env value falls back or clamps (never NaN)', () => {
  process.env.T_LIMIT = 'abc';
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 6);
  process.env.T_LIMIT = '';
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 6);
  process.env.T_LIMIT = '999999';
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 12);
  process.env.T_LIMIT = '-4';
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 1);
  process.env.T_LIMIT = '4.9';
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 4);
  delete process.env.T_LIMIT;
  assert.equal(envInt('T_LIMIT', 6, 1, 12), 6);
});

// ------------------------------------------------------------------------------------------ rate limit
const { createMemoryStore, createRedisStore, createFirewallStore, layered, clientIp } = await import('@/lib/ai/rate-limit');

await check('rate limit (memory): burst, refusal with retry-after, refill, keys are independent', async () => {
  let t = 1_000_000;
  const store = createMemoryStore({ capacity: 3, refillPerMinute: 6, now: () => t });
  for (let i = 0; i < 3; i++) assert.deepEqual(await store.take('a', req), { ok: true });
  assert.deepEqual(await store.take('a', req), { ok: false, retryAfter: 10 });
  assert.deepEqual(await store.take('b', req), { ok: true });
  t += 10_000; // one token back
  assert.deepEqual(await store.take('a', req), { ok: true });
  assert.equal((await store.take('a', req)).ok, false);
});

await check('rate limit (redis): fixed window per minute, fails open when Redis is down', async () => {
  const counts = new Map();
  const redis = { pipeline: async ([[, key]]) => [counts.set(key, (counts.get(key) ?? 0) + 1).get(key), 1] };
  let t = 60_000 * 1000;
  const store = createRedisStore(redis, { limit: 2, now: () => t });
  assert.equal((await store.take('a', req)).ok, true);
  assert.equal((await store.take('a', req)).ok, true);
  const third = await store.take('a', req);
  assert.equal(third.ok, false);
  assert.ok(third.retryAfter > 0 && third.retryAfter <= 60);
  t += 60_000; // next window
  assert.equal((await store.take('a', req)).ok, true);
  const down = createRedisStore({ pipeline: async () => Promise.reject(new Error('down')) }, { limit: 2 });
  assert.equal((await down.take('a', req)).ok, true);
});

await check('rate limit (Vercel Firewall): 429 when limited; unknown rule, errors and timeouts let the request through', async () => {
  const warn = console.warn;
  console.warn = quiet;
  try {
    const limited = createFirewallStore('chat', { check: async () => ({ rateLimited: true }) });
    assert.deepEqual(await limited.take('k', req), { ok: false, retryAfter: 60 });
    const free = createFirewallStore('chat', { check: async () => ({ rateLimited: false }) });
    assert.deepEqual(await free.take('k', req), { ok: true });

    let calls = 0;
    let t = 0;
    const missing = createFirewallStore('nope', { now: () => t, check: async () => (calls++, { rateLimited: false, error: 'not-found' }) });
    assert.equal((await missing.take('k', req)).ok, true);
    assert.equal((await missing.take('k', req)).ok, true);
    assert.equal(calls, 1, 'an unknown rule is not asked again on every request');
    t += 300_001;
    await missing.take('k', req);
    assert.equal(calls, 2, '…but is retried after the pause');

    const broken = createFirewallStore('chat', { check: async () => Promise.reject(new Error('boom')) });
    assert.equal((await broken.take('k', req)).ok, true);
    const slow = createFirewallStore('chat', { timeoutMs: 20, check: () => new Promise(() => {}) });
    assert.equal((await slow.take('k', req)).ok, true);
  } finally {
    console.warn = warn;
  }
});

await check('rate limit: the shared store is only asked when the local bucket allows the request', async () => {
  let shared = 0;
  const store = layered(createMemoryStore({ capacity: 1, refillPerMinute: 1 }), undefined, { take: async () => (shared++, { ok: true }) });
  assert.equal((await store.take('a', req)).ok, true);
  assert.equal((await store.take('a', req)).ok, false);
  assert.equal(shared, 1);
});

await check('rate limit: the client address comes from the trusted end of X-Forwarded-For', () => {
  const ip = (h) => clientIp(new Request('http://x/', { headers: h }));
  assert.equal(ip({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), '203.0.113.9'); // a spoofed first hop is ignored
  assert.equal(ip({ 'x-real-ip': '203.0.113.9' }), '203.0.113.9');
  assert.equal(ip({}), 'local');
});

// --------------------------------------------------------------------------------------------- context
const { fitContext, contextChars } = await import('@/lib/ai/context');
const msg = (role, chars, id = role) => ({ id, role, parts: [{ type: 'text', text: 'x'.repeat(chars) }] });

await check('context: the oldest messages are dropped until the conversation fits, starting on a question', () => {
  const history = [msg('user', 400, 'u1'), msg('assistant', 400, 'a1'), msg('user', 400, 'u2'), msg('assistant', 400, 'a2'), msg('user', 100, 'u3')];
  assert.deepEqual(fitContext(history, 10_000).map((m) => m.id), ['u1', 'a1', 'u2', 'a2', 'u3']);
  assert.deepEqual(fitContext(history, 1000).map((m) => m.id), ['u2', 'a2', 'u3']);
  // a2 fits but u2 does not: the kept history never starts on an answer.
  assert.deepEqual(fitContext(history, 600).map((m) => m.id), ['u3']);
  assert.equal(fitContext(history, 50), null);
});

await check('context: tool calls count by their serialized size; attachments do not count here', () => {
  const tool = { id: 'a', role: 'assistant', parts: [{ type: 'tool-x', toolCallId: '1', state: 'output-available', input: {}, output: { text: 'y'.repeat(5000) } }] };
  assert.ok(contextChars(tool) > 5000);
  const file = { id: 'u', role: 'user', parts: [{ type: 'file', mediaType: 'image/png', url: `data:image/png;base64,${'A'.repeat(9000)}` }] };
  assert.equal(contextChars(file), 0);
  assert.deepEqual(fitContext([msg('user', 10, 'u1'), tool, msg('user', 10, 'u2')], 1000).map((m) => m.id), ['u2']);
});

// --------------------------------------------------------------------------------------------- pricing
const { estimateCostUsd, priceFor, reportedCostUsd, PRICES } = await import('@/lib/ai/pricing');
const usage = (noCache, read, write, out) => ({
  inputTokens: noCache + read + write,
  inputTokenDetails: { noCacheTokens: noCache, cacheReadTokens: read, cacheWriteTokens: write },
  outputTokens: out,
});

await check('pricing: cost of a call from its token usage, on every provider spelling of the model id', () => {
  // 1,000 plain + 10,000 cache-read + 2,000 cache-write input, 500 output, at 2 / 0.2 / 2.5 / 10 USD per million.
  const expected = (1000 * 2 + 10_000 * 0.2 + 2000 * 2.5 + 500 * 10) / 1e6;
  for (const id of ['anthropic/claude-sonnet-5.5', 'claude-sonnet-5-5', 'us.anthropic.claude-sonnet-5-5-v1:0']) near(estimateCostUsd(id, usage(1000, 10_000, 2000, 500)), expected);
  // Without the breakdown, what is not cached is plain input.
  near(estimateCostUsd('claude-sonnet-5-5', { inputTokens: 13_000, outputTokens: 500 }), (13_000 * 2 + 500 * 10) / 1e6);
  near(estimateCostUsd('claude-sonnet-5-5', usage(0, 0, 0, 0), 3), 0.03); // three web searches
  assert.equal(estimateCostUsd('claude-sonnet-5-5', {}), 0);
  assert.equal(priceFor('anthropic/claude-opus-5.5').input, PRICES['claude-opus-5-5'].input); // longest match, not opus-5
});

await check('pricing: an unknown model is charged at the highest listed price; env prices override the table', () => {
  const unknown = priceFor('my-azure-deployment');
  assert.equal(unknown.known, false);
  assert.equal(unknown.output, Math.max(...Object.values(PRICES).map((p) => p.output)));
  process.env.AI_PRICE_INPUT = '1';
  process.env.AI_PRICE_OUTPUT = '4';
  try {
    assert.deepEqual(priceFor('my-azure-deployment'), { input: 1, output: 4, cacheRead: 0.1, cacheWrite: 1.25, known: true });
  } finally {
    delete process.env.AI_PRICE_INPUT;
    delete process.env.AI_PRICE_OUTPUT;
  }
});

await check('pricing: a cost reported by the gateway is used as is', () => {
  assert.equal(reportedCostUsd({ gateway: { cost: '0.0123' } }), 0.0123);
  assert.equal(reportedCostUsd({ gateway: { cost: 0.5 } }), 0.5);
  assert.equal(reportedCostUsd({ gateway: {} }), undefined);
  assert.equal(reportedCostUsd({ anthropic: { cost: 'x' } }), undefined);
  assert.equal(reportedCostUsd(undefined), undefined);
});

// ---------------------------------------------------------------------------------------------- budget
const { createSpendGuard, createMemorySpendStore, createRedisSpendStore, createCacheSpendStore, dailyBudgetUsd, utcDay } = await import('@/lib/ai/budget');
const DAY = Date.UTC(2026, 9, 1, 12);

await check('budget: off unless AI_DAILY_BUDGET_USD is a positive number', async () => {
  for (const v of [undefined, '', '0', '-5', 'abc']) assert.equal(dailyBudgetUsd({ AI_DAILY_BUDGET_USD: v }), 0);
  assert.equal(dailyBudgetUsd({ AI_DAILY_BUDGET_USD: '25' }), 25);
  let writes = 0;
  const store = { kind: 'memory', add: async () => ++writes, get: async () => (writes++, 0) };
  const guard = createSpendGuard({ budget: () => 0, store, log: quiet });
  await guard.record(100);
  assert.equal(await guard.exhausted(), false);
  assert.equal(writes, 0, 'nothing is counted or read when the breaker is off');
});

await check('budget: trips at the limit, stays tripped for the day, resets at 00:00 UTC', async () => {
  let t = DAY;
  const logs = [];
  const guard = createSpendGuard({ budget: () => 1, store: createMemorySpendStore(), now: () => t, log: (m) => logs.push(m) });
  assert.equal(await guard.exhausted(), false);
  await guard.record(0.6);
  assert.equal(await guard.exhausted(), false);
  await guard.record(0.5); // soft cap: the call that crosses the line is still counted in full
  assert.equal(await guard.exhausted(), true);
  near(guard.spent(), 1.1);
  assert.equal(logs.filter((m) => m.includes('daily AI budget reached')).length, 1, 'logged once');
  t = DAY + 11 * 3600_000; // 23:00 UTC, same day
  assert.equal(await guard.exhausted(), true);
  t = DAY + 12 * 3600_000 + 1; // just past midnight UTC
  assert.equal(utcDay(t), '2026-10-02');
  assert.equal(await guard.exhausted(), false);
  assert.equal(guard.spent(), 0);
});

await check('budget: instances sharing a store see each other’s spend after the refresh interval', async () => {
  let t = DAY;
  const store = createMemorySpendStore(); // stands in for Redis / Runtime Cache
  const a = createSpendGuard({ budget: () => 1, store, now: () => t, refreshMs: 5000, log: quiet });
  const b = createSpendGuard({ budget: () => 1, store, now: () => t, refreshMs: 5000, log: quiet });
  assert.equal(await b.exhausted(), false);
  await a.record(2);
  assert.equal(await a.exhausted(), true);
  assert.equal(await b.exhausted(), false, 'b has not looked again yet (bounded staleness)');
  t += 5000;
  assert.equal(await b.exhausted(), true);
});

await check('budget: a store outage fails open but this instance keeps counting', async () => {
  const down = { kind: 'redis', add: async () => Promise.reject(new Error('down')), get: async () => Promise.reject(new Error('down')) };
  const guard = createSpendGuard({ budget: () => 1, store: down, now: () => DAY, refreshMs: 0, log: quiet });
  assert.equal(await guard.exhausted(), false);
  await guard.record(0.7);
  await guard.record(0.7);
  assert.equal(await guard.exhausted(), true);
});

await check('budget (redis): one atomic INCRBYFLOAT with an expiry', async () => {
  const seen = [];
  const store = createRedisSpendStore({ pipeline: async (commands) => (seen.push(...commands), ['1.25', 1]) });
  assert.equal(await store.add('2026-10-01', 0.25), 1.25);
  assert.deepEqual(seen[0], ['INCRBYFLOAT', 'ai-spend:2026-10-01', '0.250000']);
  assert.equal(seen[1][0], 'EXPIRE');
});

await check('budget (runtime cache): concurrent adds from one instance are not lost; a stale read never lowers the total', async () => {
  const data = new Map();
  const cache = {
    get: async (k) => (await new Promise((r) => setTimeout(r, 2)), data.get(k) ?? null),
    set: async (k, v) => void data.set(k, v),
  };
  const store = createCacheSpendStore(() => cache);
  const totals = await Promise.all(Array.from({ length: 20 }, () => store.add('d', 0.1)));
  near(Math.max(...totals), 2, 1e-6);
  near(await store.get('d'), 2, 1e-6);
  data.clear(); // evicted
  near(await store.get('d'), 2, 1e-6);
});

// ------------------------------------------------------------------------------------------------ bots
const { botMode, judge, checkCaller } = await import('@/lib/ai/bot-check');

await check('bots: BotID is off outside Vercel and in dev, so self-hosted and local runs never call it', async () => {
  assert.equal(botMode({ NODE_ENV: 'production' }), 'off'); // Docker
  assert.equal(botMode({ NODE_ENV: 'production', BOTID_MODE: 'deny' }), 'off');
  assert.equal(botMode({ NODE_ENV: 'development', VERCEL: '1' }), 'off');
  assert.equal(botMode({ NODE_ENV: 'production', VERCEL: '1' }), 'scripted');
  assert.equal(botMode({ NODE_ENV: 'production', VERCEL: '1', BOTID_MODE: 'Deny' }), 'deny');
  assert.equal(botMode({ NODE_ENV: 'production', VERCEL: '1', BOTID_MODE: 'log' }), 'log');
  assert.equal(botMode({ NODE_ENV: 'production', VERCEL: '1', BOTID_MODE: 'off' }), 'off');
  assert.equal(botMode({ NODE_ENV: 'production', VERCEL: '1', BOTID_MODE: 'typo' }), 'scripted');
  assert.deepEqual(await checkCaller('off'), { bot: false });
});

await check('bots: people pass; bots and verified crawlers do not; user-driven agents on the allow list pass', () => {
  assert.equal(judge({ isBot: false }).bot, false);
  assert.equal(judge({ isBot: true }).bot, true);
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'googlebot', verifiedBotCategory: 'search_engine_crawler' }).bot, true);
  assert.equal(judge({ isBot: false, isVerifiedBot: true, verifiedBotName: 'gptbot', verifiedBotCategory: 'ai_crawler' }).bot, true);
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'chatgpt-operator', verifiedBotCategory: 'ai_assistant' }).bot, false);
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'google-agent', verifiedBotCategory: 'agent' }).bot, false);
  const env = { BOTID_ALLOW_VERIFIED: 'monitor' };
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'checkly', verifiedBotCategory: 'monitor' }, env).bot, false);
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'chatgpt-operator', verifiedBotCategory: 'ai_assistant' }, env).bot, true);
  assert.equal(judge({ isBot: true, isVerifiedBot: true, verifiedBotName: 'chatgpt-operator' }, { BOTID_ALLOW_VERIFIED: '' }).bot, true);
});

// ----------------------------------------------------------------------------------------------- abort
const { answerSignal, onCancel } = await import('@/lib/ai/abort');
const { streamText, toUIMessageStream, createUIMessageStream, createUIMessageStreamResponse, isStepCount } = await import('ai');
const { MockLanguageModelV4 } = await import('ai/test');

/** A model that streams one word every `ms` until told to stop; records whether its call was aborted. */
function slowModel(ms, words = 200) {
  const state = { aborted: false, sent: 0 };
  const model = new MockLanguageModelV4({
    modelId: 'claude-sonnet-5-5',
    doStream: async ({ abortSignal }) => {
      abortSignal?.addEventListener('abort', () => (state.aborted = true));
      let timer;
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] });
            controller.enqueue({ type: 'text-start', id: 't' });
            timer = setInterval(() => {
              if (abortSignal?.aborted) {
                clearInterval(timer);
                controller.error(abortSignal.reason);
              } else if (state.sent++ < words) controller.enqueue({ type: 'text-delta', id: 't', delta: 'word ' });
              else {
                clearInterval(timer);
                controller.enqueue({ type: 'text-end', id: 't' });
                controller.enqueue({
                  type: 'finish',
                  finishReason: { unified: 'stop', raw: 'end_turn' },
                  usage: { inputTokens: { total: 1000, noCache: 1000, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 500, text: 500, reasoning: 0 } },
                });
                controller.close();
              }
            }, ms);
          },
          cancel: () => clearInterval(timer),
        }),
      };
    },
  });
  return { model, state };
}

/** The same wiring as the route: model stream -> UI message stream -> HTTP response, with both abort paths. */
function respond(model, requestSignal, maxMs, onStepEnd) {
  const { signal, stop } = answerSignal(requestSignal, maxMs);
  const stream = createUIMessageStream({
    async execute({ writer }) {
      const result = streamText({ model, prompt: 'hi', stopWhen: isStepCount(2), maxOutputTokens: 100, abortSignal: signal, onStepEnd });
      const reader = toUIMessageStream({ stream: result.stream }).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        writer.write(value);
      }
    },
  });
  return createUIMessageStreamResponse({ stream: onCancel(stream, stop) });
}
const settle = (ms = 80) => new Promise((r) => setTimeout(r, ms));

await check('abort: cancelling the response body (client disconnected) aborts the model call', async () => {
  const { model, state } = slowModel(5);
  const reader = respond(model, new AbortController().signal, 30_000).body.getReader();
  while (state.sent === 0) await reader.read(); // the model call is under way
  assert.equal(state.aborted, false);
  await reader.cancel();
  await settle();
  assert.equal(state.aborted, true);
  const sent = state.sent;
  await settle();
  assert.equal(state.sent, sent, 'the model produced nothing more after the abort');
});

await check('abort: the request signal (Stop, closed tab) aborts the model call', async () => {
  const { model, state } = slowModel(5);
  const client = new AbortController();
  const reader = respond(model, client.signal, 30_000).body.getReader();
  while (state.sent === 0) await reader.read(); // the model call is under way
  client.abort();
  await settle();
  assert.equal(state.aborted, true);
  reader.cancel().catch(quiet);
});

await check('abort: an answer that runs past its time budget is stopped', async () => {
  const { model, state } = slowModel(5);
  const reader = respond(model, new AbortController().signal, 60).body.getReader();
  await reader.read();
  await settle(200);
  assert.equal(state.aborted, true);
  reader.cancel().catch(quiet);
});

await check('usage: a finished model call reports its tokens, and they are counted against the budget', async () => {
  const { model } = slowModel(1, 3);
  const guard = createSpendGuard({ budget: () => 0.006, store: createMemorySpendStore(), now: () => DAY, log: quiet });
  const res = respond(model, new AbortController().signal, 30_000, (step) => guard.record(estimateCostUsd(step.model.modelId, step.usage)));
  await res.text();
  near(guard.spent(), (1000 * 2 + 500 * 10) / 1e6); // 0.007 USD
  assert.equal(await guard.exhausted(), true);
});

// ------------------------------------------------------------------------------------------------ loop
const { hasAnswer, stopReason, isLastStep, outputBudget, afterTools, closeToolTurns } = await import('@/lib/ai/answer-loop');
const { isStatusText } = await import('@/lib/ai/answer-text');
const step = (text, tools = [], out = 100) => ({ text, toolCalls: tools.map((toolName) => ({ toolName })), usage: { outputTokens: out } });
const limits = { maxSteps: 6, maxTurnOutputTokens: 6000, softDeadlineMs: 26_000 };

await check('loop: a short line before a lookup is a status line; anything else the model writes is the answer', () => {
  assert.equal(isStatusText('Checking Environment Canada’s alerts for Halifax.', ['weatherAlerts']), true);
  assert.equal(isStatusText('Please don’t share your SIN here.', []), false, 'a short reply with no tool is the answer');
  assert.equal(isStatusText('Here are a few next steps.', ['suggestFollowUps']), false, 'closing tools gather nothing');
  assert.equal(isStatusText('# Your MP is Jane Doe.', ['civicFindMp']), false, 'a verdict heading is the answer');
  assert.equal(hasAnswer([step('Checking the recalls database.', ['healthRecalls']), step('', ['suggestFollowUps'])]), false);
  assert.equal(hasAnswer([step('Checking the recalls database.', ['healthRecalls']), step('# No recalls.\n\nNone this month.', ['suggestFollowUps'])]), true);
  assert.equal(hasAnswer([step('', ['civicFindMp']), step('')]), false);
});

await check('loop: it ends when suggestFollowUps is called, and at the step, token and time limits', () => {
  assert.equal(stopReason([step('Checking.', ['weatherAlerts'])], 3000, limits), undefined);
  assert.equal(stopReason([step('Checking.', ['weatherAlerts']), step('# Clear.', ['suggestFollowUps'])], 3000, limits), 'follow-ups');
  assert.equal(stopReason(Array.from({ length: 6 }, () => step('', ['fetchOfficialPage'])), 3000, limits), 'steps');
  assert.equal(stopReason([step('', ['fetchOfficialPage'], 6000)], 3000, limits), 'tokens');
  assert.equal(stopReason([step('', ['fetchOfficialPage'])], 26_000, limits), 'deadline');
  assert.equal(isLastStep(5, 1000, limits), true);
  assert.equal(isLastStep(2, 27_000, limits), true);
  assert.equal(isLastStep(2, 1000, limits), false);
});

await check('loop: scripts that cost more tokens per word get twice the output room, never above the ceiling', () => {
  assert.equal(outputBudget('en', 3000), 3000);
  assert.equal(outputBudget('fr', 3000), 3000);
  assert.equal(outputBudget('zh-Hans', 3000), 3000);
  assert.equal(outputBudget('pa', 3000), 6000);
  assert.equal(outputBudget('ar', 3000), 6000);
  assert.equal(outputBudget('pa', 12_000), 16_000);
});

await check('loop: the next step opens as a new turn, with the service note last', () => {
  const next = afterTools([{ role: 'user', content: 'q' }], 'final');
  assert.deepEqual(next.map((m) => m.role), ['user', 'assistant', 'user']);
  assert.match(next[2].content, /^<official-guidance>[\s\S]*Do not call any more tools[\s\S]*<\/official-guidance>$/);
});

await check('loop: in the history, a question never directly follows a tool result', () => {
  const history = [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: [{ type: 'tool-call', toolCallId: '1', toolName: 'suggestFollowUps', input: {} }] },
    { role: 'tool', content: [] },
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'a2' },
    { role: 'user', content: 'q3' },
  ];
  assert.deepEqual(closeToolTurns(history).map((m) => m.role), ['user', 'assistant', 'tool', 'assistant', 'user', 'assistant', 'user']);
  assert.deepEqual(closeToolTurns(history.slice(0, 3)).map((m) => m.role), ['user', 'assistant', 'tool']);
});

// ----------------------------------------------------------------------------------------------- tools
const { withToolBudget } = await import('@/lib/ai/tool-budget');

await check('tools: a call that overruns its budget fails, and its own signal is aborted', async () => {
  let aborted = false;
  const tools = withToolBudget(
    {
      slow: { description: 'd', execute: (_input, { abortSignal }) => new Promise(() => abortSignal.addEventListener('abort', () => (aborted = true))) },
      quick: { description: 'd', execute: async (input) => ({ echo: input }) },
      stream: { description: 'd', execute: async function* () { yield 1; await new Promise(() => {}); } },
      client: { description: 'no execute' },
    },
    30,
  );
  await assert.rejects(tools.slow.execute({}, {}), /did not answer within/);
  assert.equal(aborted, true);
  assert.deepEqual(await tools.quick.execute(7, {}), { echo: 7 });
  const it = tools.stream.execute({}, {})[Symbol.asyncIterator]();
  assert.deepEqual(await it.next(), { value: 1, done: false });
  await assert.rejects(it.next(), /did not answer within/);
  assert.equal(tools.client.execute, undefined);
  assert.equal(tools.slow.description, 'd');
});

await check('tools: the caller\'s abort (Stop, closed tab) still reaches the tool', async () => {
  const client = new AbortController();
  let seen = false;
  const tools = withToolBudget({ t: { execute: (_i, { abortSignal }) => new Promise((resolve) => abortSignal.addEventListener('abort', () => ((seen = true), resolve('stopped')))) } }, 5000);
  const run = tools.t.execute({}, { abortSignal: client.signal });
  client.abort();
  assert.equal(await run, 'stopped');
  assert.equal(seen, true);
});

// ------------------------------------------------------------------------------------------------- log
const { createTurnRecorder } = await import('@/lib/ai/turn-log');

await check('log: one JSON line per turn with engine, steps, tools, tokens, cost and timings', () => {
  let t = 1000;
  const lines = [];
  const turn = createTurnRecorder({ engine: 'model', why: 'ok', lang: 'en' }, () => t, (line) => lines.push(line));
  t += 2300;
  turn.sawText();
  t += 500;
  turn.sawText();
  turn.step(usage(4, 60_000, 1000, 200), 0.0165);
  turn.step(usage(2, 61_000, 500, 600), 0.0195);
  turn.set({ model: 'anthropic/claude-sonnet-5.5', tools: ['weatherAlerts', 'suggestFollowUps'], finish: 'tool-calls', stop: 'follow-ups' });
  t += 5000;
  turn.end();
  turn.end();
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]), {
    evt: 'chat.turn',
    engine: 'model',
    why: 'ok',
    lang: 'en',
    steps: 2,
    tools: ['weatherAlerts', 'suggestFollowUps'],
    truncated: false,
    tokens: { in: 122_506, out: 800, cacheRead: 121_000, cacheWrite: 1500 },
    costUsd: 0.036,
    totalMs: 7800,
    ttftMs: 2300,
    model: 'anthropic/claude-sonnet-5.5',
    finish: 'tool-calls',
    stop: 'follow-ups',
  });
});

console.log(failed ? `\nFAILED: ${failed} check(s), see ✗ above.` : '\nOK: abuse and cost guards behave as documented.');
process.exit(failed ? 1 : 0);
