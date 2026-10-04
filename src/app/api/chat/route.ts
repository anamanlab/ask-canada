/**
 * POST /api/chat — streams a UI message stream (AI SDK v7) for the chat.
 *
 * Pipeline: rate limit -> bot check -> validate + cap input -> model (streamText + all tools) or scripted engine.
 * Prompt caching uses two breakpoints: the stable instructions, and the conversation (see `prompt-cache.ts`).
 *
 * The model answers in a short tool loop whose rules live in `answer-loop.ts`: it ends when the model calls
 * `suggestFollowUps` (always its last act), at the step, token and time limits, and never without prose (one
 * closing step writes the answer if the loop ended before it was written). An answer cut by the output cap or
 * the time limit is marked `truncated` in the message metadata, and the UI offers to continue it.
 * Every answer leaves one JSON log line with no personal data (`turn-log.ts`).
 *
 * The scripted engine (sourced answers, real tool calls, no model tokens) answers instead of the model when:
 * SCRIPTED_AI is set; the caller is a bot (`bot-check.ts`); today's AI budget is used up (`budget.ts`); or
 * the model fails before producing anything (no credits, provider budget reached, outage). So every cost
 * control degrades to an answer, not an error. Nothing is persisted server-side.
 *
 * `x-ac-engine: model | scripted` on the response says which one was chosen before streaming began.
 */
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type FinishReason,
  type StepResult,
  type StreamTextResult,
  type ToolSet,
  type UIMessage,
  type UIMessageChunk,
  type UIMessageStreamWriter,
} from 'ai';
import { z } from 'zod';
import { pack } from '@/countries/active';
import { groundingForTurn, packServer, scenarios, tools as packTools } from '@/countries/active.server';
import { answerSignal, onCancel } from '@/lib/ai/abort';
import { afterTools, closeToolTurns, hasAnswer, isLastStep, outputBudget, RESUME_NOTE, stopReason, type LoopLimits, type LoopStep, type StopReason } from '@/lib/ai/answer-loop';
import { botMode, checkCaller } from '@/lib/ai/bot-check';
import { spendGuard, warnIfUnpriced } from '@/lib/ai/budget';
import { fitContext } from '@/lib/ai/context';
import { coreTools } from '@/lib/ai/core-tools';
import { LIMITS } from '@/lib/ai/limits';
import { getModel, isScripted, modelOptions } from '@/lib/ai/model';
import { estimateCostUsd, reportedCostUsd } from '@/lib/ai/pricing';
import { moveBreakpointToTail, stripGuidanceTags, withTurnContext } from '@/lib/ai/prompt-cache';
import { takeToken } from '@/lib/ai/rate-limit';
import { buildInstructions } from '@/lib/ai/system-prompt';
import { withToolBudget } from '@/lib/ai/tool-budget';
import { createTurnRecorder, type EngineReason, type TurnRecorder } from '@/lib/ai/turn-log';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { detectAnswerLocale, latestUserText, runScripted, streamScriptedBody } from '@/lib/scripted/engine';
import { starterAliases } from '@/lib/scripted/aliases';
import { redactPii } from '@/lib/pii';

export const maxDuration = 60;

/** Every tool call gets a time budget, so one slow upstream cannot use up the answer's own. */
const tools: ToolSet = withToolBudget({ ...packTools, ...coreTools }, LIMITS.toolTimeoutMs);

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

/** A valid IANA time zone from the browser, or undefined. */
function cleanTimeZone(tz: unknown): string | undefined {
  if (typeof tz !== 'string' || tz.length > 64 || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return undefined;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

/** Today in the person's time zone (falls back to the country's). */
function todayISO(timeZone?: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone ?? pack.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/**
 * The request envelope. Only the last `maxHistory` messages are kept (older ones never reach the model), and
 * those are shape-checked here (ids, the roles a client may send, part counts) before the AI SDK validates
 * them as UI messages. Unknown top-level fields (chat id, trigger) are ignored.
 */
const Body = z.object({
  messages: z.array(z.unknown()).min(1),
  locale: z.string().max(16).optional(),
  answerLocale: z.string().max(16).optional(),
  timeZone: z.string().max(64).optional(),
  /** The latest message asks to continue an answer that was cut short ("Continue" under it). */
  resume: z.boolean().optional(),
});
const Envelope = z.array(
  z.looseObject({
    id: z.string().max(200),
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.unknown()).max(LIMITS.maxParts),
  }),
);

type ErrorCode = 'too_large' | 'bad_request' | 'too_long' | 'too_many_files' | 'file_type' | 'file_size';

/** Reads the body as text, giving up (null) as soon as it passes `max` bytes, whatever Content-Length claims. */
async function readCapped(req: Request, max: number): Promise<string | null> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

/** Enforce per-part limits and redact the person's text. Returns an error code when input is unacceptable. */
function sanitize(messages: UIMessage[]): { messages: UIMessage[] } | { error: ErrorCode } {
  if (messages[messages.length - 1].role !== 'user') return { error: 'bad_request' };
  for (const m of messages) {
    let files = 0;
    for (const p of m.parts) {
      if (p.type === 'text' && m.role === 'user' && p.text.length > LIMITS.maxInputChars) return { error: 'too_long' };
      if ((p.type === 'text' || p.type === 'reasoning') && p.text.length > LIMITS.maxPartChars) return { error: 'bad_request' };
      if (p.type === 'file') {
        if (++files > LIMITS.maxFiles) return { error: 'too_many_files' };
        if (!LIMITS.allowedMedia.includes(p.mediaType)) return { error: 'file_type' };
        if (p.url.length > LIMITS.maxFileUrlChars) return { error: 'file_size' };
      }
    }
  }
  const fitted = fitContext(messages, LIMITS.maxContextChars);
  if (!fitted) return { error: 'too_long' };
  const latest = fitted.length - 1;
  // Redact personal identifiers before anything reaches a model (the composer already does this too), and
  // drop guidance tags so only this service can add an <official-guidance> block. Attachments count only on
  // the latest question (what the app sends): on earlier ones they become a mention, not tokens.
  return {
    messages: fitted.map((m, i) =>
      m.role !== 'user'
        ? m
        : {
            ...m,
            parts: m.parts.map((p) =>
              p.type === 'text'
                ? { ...p, text: stripGuidanceTags(redactPii(p.text).text) }
                : p.type === 'file' && i !== latest
                  ? { type: 'text' as const, text: `[attachment: ${(p.filename ?? p.mediaType).slice(0, 80)}]` }
                  : p,
            ),
          },
    ),
  };
}

/** Parses and validates the request, or says which 4xx to answer with. */
async function readRequest(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > LIMITS.maxBodyBytes) return { error: 'too_large' as const };
  const raw = await readCapped(req, LIMITS.maxBodyBytes);
  if (raw === null) return { error: 'too_large' as const };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: 'bad_request' as const };
  }
  const body = Body.safeParse(json);
  if (!body.success) return { error: 'bad_request' as const };
  const recent = Envelope.safeParse(body.data.messages.slice(-LIMITS.maxHistory));
  if (!recent.success) return { error: 'bad_request' as const };
  const valid = await safeValidateUIMessages<UIMessage>({ messages: recent.data });
  if (!valid.success) return { error: 'bad_request' as const };
  const clean = sanitize(valid.data);
  return 'error' in clean ? clean : { ...body.data, messages: clean.messages };
}

const STATUS: Record<ErrorCode, number> = {
  too_large: 413,
  too_long: 413,
  bad_request: 400,
  too_many_files: 400,
  file_type: 400,
  file_size: 413,
};

const isContent = (c: UIMessageChunk) =>
  c.type === 'text-delta' || c.type === 'tool-input-start' || c.type === 'reasoning-delta' || c.type === 'tool-input-available';

const userText = (m: UIMessage) => m.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ').trim();
/** The question before the latest one (what a "Continue" request is continuing). */
const questionBefore = (messages: UIMessage[]) => userText(messages.filter((m) => m.role === 'user').at(-2) ?? messages[messages.length - 1]);

/** The stream's writer, also noting for the turn log when the first text went out and which tools ran. */
function recording(writer: UIMessageStreamWriter, turn: TurnRecorder): UIMessageStreamWriter {
  const counts = new Map<string, number>();
  return {
    ...writer,
    write(chunk) {
      if (chunk.type === 'text-delta') turn.sawText();
      if (chunk.type === 'tool-input-available') {
        counts.set(chunk.toolName, (counts.get(chunk.toolName) ?? 0) + 1);
        turn.set({ tools: [...counts].map(([name, n]) => (n > 1 ? `${name}×${n}` : name)) });
      }
      writer.write(chunk);
    },
  };
}

/**
 * Sends one model call's chunks to the client. `finish` and `abort` are held back (the route ends the
 * message itself, once it knows whether a closing step is needed); `start` is sent only for the first call.
 * With `untilContent`, nothing is sent before the model produces real content: an error before that returns
 * `failed` with nothing written, so the caller can answer from the scripted engine instead.
 */
async function pump(
  result: Pick<StreamTextResult<ToolSet, never, never>, 'stream'>,
  writer: UIMessageStreamWriter,
  { first }: { first: boolean },
): Promise<{ failed: true; error: string; live: boolean } | { failed: false; finish?: FinishReason; live: boolean }> {
  const reader = toUIMessageStream({
    stream: result.stream,
    sendReasoning: false,
    sendStart: first,
    // Tells the UI this answer may open with a status line (see `answer-text.ts`).
    messageMetadata: ({ part }) => (part.type === 'start' ? { engine: 'model' } : undefined),
  }).getReader();
  let finish: FinishReason | undefined;
  const send = (chunk: UIMessageChunk) => {
    if (chunk.type === 'finish') finish = chunk.finishReason;
    else if (chunk.type !== 'abort') writer.write(chunk);
  };
  const held: UIMessageChunk[] = [];
  let live = !first;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value.type === 'error') {
      reader.cancel().catch(() => {});
      return { failed: true, error: value.errorText, live };
    }
    if (live) {
      send(value);
      continue;
    }
    held.push(value);
    if (isContent(value)) {
      held.forEach(send);
      live = true;
    }
  }
  if (!live) held.forEach(send);
  return { failed: false, finish, live };
}

export async function POST(req: Request) {
  const limit = await takeToken(req);
  if (!limit.ok) return json(429, { error: 'rate_limited', retryAfter: limit.retryAfter }, { 'retry-after': String(limit.retryAfter) });

  // Bots never reach the model: they get the scripted engine, or 403 with BOTID_MODE=deny. No-op off Vercel.
  const mode = botMode();
  const caller = await checkCaller(mode);
  const bot = caller.bot && mode !== 'log';
  if (bot && mode === 'deny') return json(403, { error: 'forbidden' });

  const body = await readRequest(req);
  if ('error' in body) return json(STATUS[body.error], { error: body.error });
  const { messages } = body;
  const locale: Locale = isLocale(body.locale) && pack.locales.supported.includes(body.locale) ? body.locale : pack.locales.default;
  const answerLocale: Locale | undefined =
    isLocale(body.answerLocale) && pack.locales.supported.includes(body.answerLocale) ? body.answerLocale : undefined;
  const startedAt = Date.now();
  // Ends the model call when the person leaves or stops the answer, and after the answer's time budget.
  const { signal, stop, timedOut } = answerSignal(req.signal, LIMITS.maxAnswerMs);
  const guard = spendGuard();
  const why: EngineReason = isScripted() ? 'scripted_env' : bot ? 'bot' : (await guard.exhausted()) ? 'budget' : 'ok';
  const useModel = why === 'ok';
  const timeZone = cleanTimeZone(body.timeZone);
  const lastText = latestUserText(messages).text;
  // "Continue" carries no topic or language of its own: both come from the question whose answer was cut short.
  const resume = body.resume === true;
  const asked = resume ? questionBefore(messages) : lastText;
  // A language the person chose (beyond the official ones) is honoured even when they type in English.
  const target = answerLocale ?? detectAnswerLocale(asked, locale);
  const turn = createTurnRecorder({ engine: useModel ? 'model' : 'scripted', why, lang: target });

  const scripted = async (writer: UIMessageStreamWriter) =>
    runScripted({
      aliases: await starterAliases(),
      writer,
      messages,
      locale: answerLocale ?? locale,
      forceLang: answerLocale && packServer.locales.official.includes(answerLocale) ? answerLocale : undefined,
      tools,
      scenarios,
      signal,
      timeZone,
      checked: packServer.showcase.factsChecked,
    });

  async function answer(writer: UIMessageStreamWriter) {
    if (!useModel) return scripted(writer);
    const fallBack = (reason: EngineReason, detail: string) => {
      console.warn(`[chat] ${reason === 'model_error' ? 'model error before content' : 'model unavailable'}, using scripted answers:`, detail);
      turn.set({ engine: 'scripted', why: reason });
      return scripted(writer);
    };

    const steps: LoopStep[] = [];
    const elapsed = () => Date.now() - startedAt;
    const stepTokens = outputBudget(target, LIMITS.maxOutputTokens);
    const loop: LoopLimits = { maxSteps: LIMITS.maxSteps, maxTurnOutputTokens: stepTokens * 2, softDeadlineMs: LIMITS.softAnswerMs };
    let stopped: StopReason | undefined;
    let first;
    let initial;
    let shared;
    try {
      const { model, provider, id } = await getModel();
      warnIfUnpriced(id);
      turn.set({ model: id });
      const force = Boolean(answerLocale) || (!pack.locales.official.includes(locale) && target === locale);
      const grounding = await groundingForTurn(asked);
      // With Anthropic, add native web search restricted to official domains.
      // Google's native grounding cannot be domain-restricted and is off in prod (GEMINI_SEARCH_GROUNDING=0).
      // The `searchOfficialSources` tool already has an allowlisted DuckDuckGo fallback.
      const runTools: ToolSet =
        provider === 'anthropic' && LIMITS.webSearchMaxUses > 0
          ? {
              ...tools,
              web_search: (await import('@ai-sdk/anthropic')).anthropic.tools.webSearch_20250305({
                maxUses: LIMITS.webSearchMaxUses,
                allowedDomains: pack.sources.allowlist,
              }),
            }
          : tools;
      shared = {
        model,
        instructions: buildInstructions({ locale: force ? target : locale, today: todayISO(timeZone), timeZone, forceLanguage: force }),
        tools: runTools,
        maxOutputTokens: stepTokens,
        providerOptions: modelOptions(),
        abortSignal: signal,
        // Count what each model call cost towards today's budget (steps already finished still count
        // when the answer is stopped later).
        onStepEnd: (step: StepResult<ToolSet>) => {
          steps.push(step);
          const cost =
            reportedCostUsd(step.providerMetadata) ??
            estimateCostUsd(
              id,
              step.usage,
              // `google_search` is Gemini's grounding; charged at the same per-search rate until
              // its own price is confirmed, so the breaker errs early rather than late.
              step.toolCalls.filter((call) => call.toolName === 'web_search' || call.toolName === 'google_search').length,
            );
          turn.step(step.usage, cost);
          return guard.record(cost);
        },
      };
      // Conversation cache breakpoint on the latest question; this turn's guidance goes after it.
      initial = withTurnContext(
        closeToolTurns(await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true })),
        resume ? [grounding, RESUME_NOTE].filter(Boolean).join('\n\n') : grounding,
      );
      first = streamText({
        ...shared,
        messages: initial,
        // Each later step opens as a new turn (so its text streams) and moves the breakpoint to the newest message.
        prepareStep: ({ stepNumber, messages: sent, steps: done }) =>
          stepNumber === 0
            ? {}
            : { messages: moveBreakpointToTail(afterTools(sent, hasAnswer(done) ? 'close' : isLastStep(stepNumber, elapsed(), loop) ? 'final' : 'write')) },
        stopWhen: ({ steps: done }) => (stopped = stopReason(done, elapsed(), loop)) !== undefined,
      });
    } catch (err) {
      return fallBack('model_unavailable', (err as Error).message);
    }

    const recoverWithScripted = async (why: EngineReason, detail?: string) => {
      console.warn(`[chat] ${why === 'model_error' ? 'model error mid-stream' : 'model wrote no answer prose'}, recovering with scripted answer:`, detail ?? '');
      turn.set({ engine: 'scripted', why });
      await streamScriptedBody({
        writer,
        messages,
        locale: answerLocale ?? locale,
        forceLang: answerLocale && packServer.locales.official.includes(answerLocale) ? answerLocale : undefined,
        tools,
        scenarios,
        signal,
        timeZone,
        aliases: await starterAliases(),
      });
      writer.write({ type: 'finish-step' });
      writer.write({ type: 'finish', finishReason: signal.aborted ? 'other' : 'stop' });
    };

    let finish: FinishReason | undefined;
    // Nothing reaches the client until the model produces real content; if it errors first, fall back to scripted.
    const main = await pump(first, writer, { first: true });
    if (main.failed) {
      if (hasAnswer(steps)) {
        finish = 'stop';
      } else if (!main.live) {
        return fallBack('model_error', main.error);
      } else {
        return recoverWithScripted('model_error', main.error);
      }
    } else {
      finish = main.finish;
    }

    // A turn never ends without prose: if the loop ended before the answer was written, one closing step writes it.
    if (!signal.aborted && finish !== 'error' && !hasAnswer(steps)) {
      turn.set({ finisher: true });
      try {
        const { messages: generated } = await first.response;
        const closing = streamText({
          ...shared,
          messages: moveBreakpointToTail(afterTools([...initial, ...generated], 'final')),
          stopWhen: isStepCount(1),
        });
        const last = await pump(closing, writer, { first: false });
        finish = last.failed ? 'error' : last.finish;
      } catch {
        finish = 'error';
      }
      if (!signal.aborted && !hasAnswer(steps)) {
        return recoverWithScripted('model_error', 'The model wrote no answer prose');
      }
    }

    // Cut by the output cap, or by the time limit while the person was still waiting: say so, offer to continue.
    const truncated = finish === 'length' || timedOut();
    turn.set({ finish, truncated, stop: signal.aborted ? (timedOut() ? 'timeout' : 'aborted') : (stopped ?? 'natural') });
    writer.write({ type: 'finish', finishReason: timedOut() ? 'length' : finish, ...(truncated ? { messageMetadata: { truncated: true } } : {}) });
  }

  const stream = createUIMessageStream({
    onError: () => 'Something went wrong on our side. Please try again.',
    async execute({ writer }) {
      try {
        await answer(recording(writer, turn));
      } finally {
        turn.end();
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: onCancel(stream, stop),
    headers: { 'cache-control': 'no-store', 'x-ac-engine': useModel ? 'model' : 'scripted' },
  });
}
