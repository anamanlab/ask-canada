/**
 * One structured log line per answer (`console.log`, JSON): which engine answered and why, how the loop
 * went, what it cost and how long it took. Never the question, the answer, tool inputs, an address or any
 * other personal data: only names of tools, counts, durations and a language code.
 *
 *   {"evt":"chat.turn","engine":"model","why":"ok","model":"anthropic/claude-sonnet-5.5","lang":"en","steps":2,
 *    "tools":["passportPlanner","suggestFollowUps"],"finish":"tool-calls","stop":"follow-ups","truncated":false,
 *    "tokens":{"in":141210,"out":812,"cacheRead":133500,"cacheWrite":7702},"costUsd":0.0541,"ttftMs":2310,"totalMs":9120}
 *
 * See docs/DEPLOY.md ("Logs") for every field. Turn it off with AI_TURN_LOG=0.
 */
import type { LanguageModelUsage } from 'ai';

/** Why this engine answered. */
export type EngineReason =
  | 'ok' // the model answered
  | 'scripted_env' // SCRIPTED_AI is set
  | 'bot' // the caller was classified as a bot
  | 'budget' // today's AI budget is used up
  | 'model_unavailable' // the model could not be set up (no credentials, bad AI_MODEL)
  | 'model_error'; // the model failed before producing anything

export type TurnLog = {
  evt: 'chat.turn';
  engine: 'model' | 'scripted';
  why: EngineReason;
  model?: string;
  /** Language of the answer (a locale code such as "en" or "pa"). */
  lang: string;
  /** Model calls in this turn (0 for the scripted engine). */
  steps: number;
  tools: string[];
  /** The last model call's finish reason: stop, tool-calls, length, error… */
  finish?: string;
  /** What ended the loop: natural (the model stopped), follow-ups, steps, tokens, deadline, aborted, error. */
  stop?: string;
  /** One extra writing step ran because the loop ended without an answer. */
  finisher?: boolean;
  /** The answer hit the output-token cap or the time limit (the UI offers "Continue"). */
  truncated: boolean;
  tokens: { in: number; out: number; cacheRead: number; cacheWrite: number };
  /** Estimated US dollars (the provider's own figure when it reports one). */
  costUsd: number;
  /** Milliseconds from the request to the first text on the wire; absent when no text was sent. */
  ttftMs?: number;
  totalMs: number;
};

export type TurnRecorder = {
  /** Call with every chunk written to the client: notes the time of the first text. */
  sawText(): void;
  step(usage: LanguageModelUsage, costUsd: number): void;
  set(fields: Partial<Pick<TurnLog, 'engine' | 'why' | 'model' | 'tools' | 'finish' | 'stop' | 'finisher' | 'truncated'>>): void;
  /** Writes the line (once). */
  end(): void;
};

const enabled = () => process.env.AI_TURN_LOG !== '0' && process.env.AI_TURN_LOG !== 'false';

export function createTurnRecorder(init: Pick<TurnLog, 'engine' | 'why' | 'lang'>, now: () => number = Date.now, write: (line: string) => void = console.log): TurnRecorder {
  const started = now();
  const log: TurnLog = {
    evt: 'chat.turn',
    ...init,
    steps: 0,
    tools: [],
    truncated: false,
    tokens: { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 },
    costUsd: 0,
    totalMs: 0,
  };
  let ended = false;
  return {
    sawText() {
      log.ttftMs ??= now() - started;
    },
    step(usage, costUsd) {
      log.steps++;
      log.tokens.in += usage.inputTokens ?? 0;
      log.tokens.out += usage.outputTokens ?? 0;
      log.tokens.cacheRead += usage.inputTokenDetails?.cacheReadTokens ?? 0;
      log.tokens.cacheWrite += usage.inputTokenDetails?.cacheWriteTokens ?? 0;
      log.costUsd += costUsd;
    },
    set(fields) {
      Object.assign(log, fields);
    },
    end() {
      if (ended) return;
      ended = true;
      if (!enabled()) return;
      log.totalMs = now() - started;
      log.costUsd = Math.round(log.costUsd * 1e5) / 1e5;
      write(JSON.stringify(log));
    },
  };
}
