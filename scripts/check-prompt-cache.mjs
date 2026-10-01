#!/usr/bin/env node
// Live check that both prompt-cache breakpoints work with the configured model (costs a few cents).
//   node --env-file=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-prompt-cache.mjs
// Runs a two-turn conversation whose first answer calls a tool, using the same helpers as /api/chat, and
// prints cache reads/writes per step. Expect: step 1 of turn 1 writes the stable prefix; later steps of a
// tool loop read everything already sent and write only what is new (≈0 uncached); the first step of a later
// turn reads the instructions AND the conversation up to the previous question (only this turn's guidance,
// which sits after the breakpoint on purpose, is uncached).
import { register } from 'node:module';
import { generateText, isStepCount, tool } from 'ai';
import { z } from 'zod';

register('./lib/ts-hooks.mjs', import.meta.url);
const { CACHE_BREAKPOINT, moveBreakpointToTail, withTurnContext } = await import('@/lib/ai/prompt-cache');
const { afterTools } = await import('@/lib/ai/answer-loop');

const model = process.env.AI_MODEL || 'anthropic/claude-sonnet-5.5';
const stable =
  'You are a plain-language guide to government services. Always call programLookup before answering, then answer in two sentences.\n' +
  Array.from({ length: 400 }, (_, i) => `Rule ${i}: cite the official page for fact ${i}; never invent amounts, dates or wait times.`).join('\n');
const tools = {
  programLookup: tool({
    description: 'Look up a federal program by name and return its key facts.',
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => ({ name, facts: Array.from({ length: 60 }, (_, i) => `${name} fact ${i}: see the official page section ${i}.`) }),
  }),
};
const instructions = [
  { role: 'system', content: stable, providerOptions: CACHE_BREAKPOINT },
  { role: 'system', content: 'Today is 2026-09-30. Answer in English.' },
];
const guidance = (topic) => `## Department guidance\n${Array.from({ length: 40 }, (_, i) => `${topic} note ${i}: prefer the task page over the overview.`).join('\n')}`;

let failed = false;
async function turn(label, history, question, topic, first) {
  const result = await generateText({
    model,
    instructions,
    messages: withTurnContext([...history, { role: 'user', content: question }], guidance(topic)),
    // As in the route: each later step opens as a new turn, with the breakpoint on its newest message.
    prepareStep: ({ stepNumber, messages }) => (stepNumber === 0 ? {} : { messages: moveBreakpointToTail(afterTools(messages, 'write')) }),
    tools,
    stopWhen: isStepCount(4),
    maxOutputTokens: 300,
  });
  result.steps.forEach((step, i) => {
    const d = step.usage.inputTokenDetails ?? {};
    const total = step.usage.inputTokens ?? 0;
    const read = d.cacheReadTokens ?? 0;
    const pct = total ? Math.round((read / total) * 100) : 0;
    const uncached = d.noCacheTokens ?? 0;
    // Very first request: nothing to read yet. Later steps in a loop: nothing may be left uncached.
    // First step of a later turn: must read at least the instructions + earlier conversation.
    const problem =
      first && i === 0 ? ((d.cacheWriteTokens ?? 0) > 0 ? '' : 'expected a cache write')
      : i > 0 ? (read > 0 && uncached <= total * 0.02 ? '' : 'expected ≈0 uncached tokens')
      : pct >= 75 ? '' : 'expected ≥ 75% read';
    if (problem) failed = true;
    console.log(
      `${label} step ${i + 1}: input ${String(total).padStart(6)} | read ${String(read).padStart(6)} (${String(pct).padStart(3)}%) | write ${String(d.cacheWriteTokens ?? 0).padStart(6)} | uncached ${String(uncached).padStart(5)} ${problem ? `✗ ${problem}` : '✓'}`,
    );
  });
  return [...history, { role: 'user', content: question }, ...result.response.messages];
}

// A unique first question keeps this run from reading a conversation cached by an earlier run.
const nonce = Math.random().toString(36).slice(2, 8);
let history = await turn('turn 1', [], `What is the Canada Child Benefit? (ref ${nonce})`, 'CRA', true);
history = await turn('turn 2', history, 'And Old Age Security?', 'Service Canada', false);
await turn('turn 3', history, 'Which one is taxable?', 'CRA', false);
console.log(failed ? '\nFAILED: see ✗ above.' : '\nOK: both breakpoints are working.');
process.exit(failed ? 1 : 0);
