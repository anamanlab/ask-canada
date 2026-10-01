/**
 * A time budget for every tool call. A tool waits on other people's servers (an official page, a live
 * feed), and one slow upstream must not eat the answer's own time limit: after `ms` the call is aborted and
 * fails, the widget shows its error state, and the model writes the answer with what the other tools returned.
 * The tool's own `abortSignal` is aborted too, so its upstream requests stop instead of running on unseen.
 */
import type { ToolSet } from 'ai';

export class ToolTimeoutError extends Error {
  constructor(toolName: string, ms: number) {
    super(`${toolName} did not answer within ${Math.round(ms / 1000)} seconds. Answer without it and link the official page instead.`);
    this.name = 'ToolTimeoutError';
  }
}

type Execute = (input: unknown, options: { abortSignal?: AbortSignal }) => unknown;
const isAsyncIterable = (x: unknown): x is AsyncIterable<unknown> => typeof (x as AsyncIterable<unknown> | null)?.[Symbol.asyncIterator] === 'function';

/** Rejects when the deadline passes (or the caller aborts); `done()` clears the timer. */
function deadline(toolName: string, ms: number, outer?: AbortSignal) {
  const inner = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new ToolTimeoutError(toolName, ms);
      inner.abort(err);
      reject(err);
    }, ms);
  });
  // Nothing may be listening when it fires after the tool has already answered.
  expired.catch(() => {});
  return { signal: outer ? AbortSignal.any([outer, inner.signal]) : inner.signal, expired, done: () => clearTimeout(timer) };
}

/** The same tools, each limited to `ms` per call (results that stream in steps share the one budget). */
export function withToolBudget<T extends ToolSet>(tools: T, ms: number): T {
  const out: ToolSet = {};
  for (const [name, t] of Object.entries(tools)) {
    const execute = t.execute as Execute | undefined;
    if (!execute) {
      out[name] = t;
      continue;
    }
    const limited: Execute = (input, options) => {
      const d = deadline(name, ms, options.abortSignal);
      let result: unknown;
      try {
        result = execute(input, { ...options, abortSignal: d.signal });
      } catch (err) {
        d.done();
        throw err;
      }
      if (isAsyncIterable(result)) {
        const source = result;
        return (async function* () {
          const it = source[Symbol.asyncIterator]();
          try {
            while (true) {
              const next = await Promise.race([it.next(), d.expired]);
              if (next.done) return;
              yield next.value;
            }
          } finally {
            d.done();
            void it.return?.();
          }
        })();
      }
      return Promise.race([Promise.resolve(result), d.expired]).finally(d.done);
    };
    out[name] = { ...t, execute: limited } as ToolSet[string];
  }
  return out as T;
}
