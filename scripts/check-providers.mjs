#!/usr/bin/env node
// Model provider selection (CI; offline, no model call, no network):
//   selection  AI_PROVIDER picks the provider, with the documented fallback order
//   routing    every provider in the union builds its own model (no silent fall-through to the gateway)
//   workers-ai the Cloudflare-hosted path asks for its AI binding and names a Workers AI model
//   pricing    the Workers AI row costs what the Workers AI pricing table says
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-providers.mjs
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

const { WORKERS_AI_DEFAULT_MODEL, getModel, providerName, workersAiBinding } = await import('@/lib/ai/model');
const { PRICES, estimateCostUsd, priceFor } = await import('@/lib/ai/pricing');

// --------------------------------------------------------------------------------------------- selection
await check('selection: AI_PROVIDER is honoured, case- and space-insensitive', () => {
  for (const provider of ['anthropic', 'google', 'gateway', 'azure', 'bedrock', 'workers-ai']) {
    process.env.AI_PROVIDER = provider;
    assert.equal(providerName(), provider);
    process.env.AI_PROVIDER = ` ${provider.toUpperCase()} `;
    assert.equal(providerName(), provider);
  }
});

await check('selection: an unknown AI_PROVIDER falls back to a key, then to the gateway', () => {
  process.env.AI_PROVIDER = 'not-a-provider';
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  assert.equal(providerName(), 'gateway');
  process.env.ANTHROPIC_API_KEY = 'k';
  assert.equal(providerName(), 'anthropic');
  delete process.env.ANTHROPIC_API_KEY;
  process.env.GEMINI_API_KEY = 'k';
  assert.equal(providerName(), 'google');
});

await check('routing: every provider in the union builds its own model', async () => {
  process.env.ANTHROPIC_API_KEY = 'k';
  process.env.GEMINI_API_KEY = 'k';
  process.env.AZURE_RESOURCE_NAME = 'r';
  process.env.AZURE_API_KEY = 'k';
  process.env.AWS_REGION = 'ca-central-1';
  for (const provider of ['anthropic', 'google', 'gateway', 'azure', 'bedrock']) {
    process.env.AI_PROVIDER = provider;
    process.env.AI_MODEL = provider === 'azure' || provider === 'bedrock' ? 'test-deployment' : '';
    const { provider: built } = await getModel();
    assert.equal(built, provider, `${provider} fell through to another provider`);
  }
});

await check('routing: azure and bedrock without AI_MODEL fail instead of answering with a stray model', async () => {
  for (const provider of ['azure', 'bedrock']) {
    process.env.AI_PROVIDER = provider;
    delete process.env.AI_MODEL;
    await assert.rejects(getModel(), /AI_MODEL/);
  }
});

// -------------------------------------------------------------------------------------------- workers-ai
await check('workers-ai: off Workers there is no binding, so the turn falls back to scripted answers', async () => {
  assert.equal(await workersAiBinding(), undefined, 'cloudflare:workers must not resolve outside a Worker');
  process.env.AI_PROVIDER = 'workers-ai';
  await assert.rejects(getModel(), /needs the Workers AI binding/);
});

await check('workers-ai: the default is a Cloudflare-hosted model id that the price table knows', () => {
  assert.equal(WORKERS_AI_DEFAULT_MODEL, '@cf/zai-org/glm-4.7-flash');
  assert.ok(WORKERS_AI_DEFAULT_MODEL.startsWith('@cf/'), 'Workers AI model ids are namespaced @cf/<vendor>/<model>');
  assert.equal(priceFor(WORKERS_AI_DEFAULT_MODEL).known, true);
  // An unlisted Workers AI model falls back to the dearest row, so the breaker trips early rather than late.
  const unlisted = priceFor('@cf/some-vendor/some-unlisted-model');
  assert.equal(unlisted.known, false);
  assert.equal(unlisted.output, Math.max(...Object.values(PRICES).map((row) => row.output)));
});

// ----------------------------------------------------------------------------------------------- pricing
await check('pricing: the Workers AI row matches the Workers AI pricing table (2026-10-03)', () => {
  const price = priceFor('@cf/zai-org/glm-4.7-flash');
  assert.equal(price.input, 0.06, 'US$ per M input tokens');
  assert.equal(price.output, 0.4, 'US$ per M output tokens');
  // 5K input + 1K output is one typical generation step for this app.
  const step = estimateCostUsd('@cf/zai-org/glm-4.7-flash', { inputTokens: 5000, outputTokens: 1000 }, 0);
  assert.ok(Math.abs(step - (5000 * 0.06 + 1000 * 0.4) / 1e6) < 1e-12, `step cost ${step}`);
});

process.exit(failed ? 1 : 0);