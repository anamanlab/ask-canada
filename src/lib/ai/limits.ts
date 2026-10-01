/**
 * Abuse limits for a public, viral-ready endpoint. Tune with env vars on the host.
 * Server only (it reads the environment): client code uses `./limits.shared`, and gets `maxInputChars`
 * from the page.
 */
import 'server-only';
import { DEFAULT_MAX_INPUT_CHARS, UPLOAD_LIMITS } from './limits.shared';

const { maxFiles: MAX_FILES, maxFileBytes: MAX_FILE_BYTES, allowedMedia } = UPLOAD_LIMITS;
/** Attachments travel as base64 data URLs: 4 characters per 3 bytes, plus the `data:…;base64,` prefix. */
const dataUrlChars = (bytes: number) => Math.ceil((bytes * 4) / 3) + 64;

/**
 * A whole number from the environment, clamped to [min, max]. Anything missing or malformed gives the
 * default, so a typo on the host can never turn a cap off (`Number('abc')` is NaN, and NaN caps nothing).
 */
export function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
}

export const LIMITS = {
  /** Characters per user text part. */
  maxInputChars: envInt('AI_MAX_INPUT_CHARS', DEFAULT_MAX_INPUT_CHARS, 1, 32_000),
  /** Messages of history sent to the model (older ones are dropped). */
  maxHistory: envInt('AI_MAX_HISTORY', 24, 1, 100),
  /**
   * Characters of conversation (text, reasoning, tool inputs and results; attachments excluded) sent to the
   * model. A browser only sends what the service produced, but a script can send anything: without this, the
   * history could be megabytes of invented "earlier answers", billed as input tokens on every step. The
   * oldest messages are dropped until the rest fits (about 60k tokens at the default).
   */
  maxContextChars: envInt('AI_MAX_CONTEXT_CHARS', 240_000, 8_000, 2_000_000),
  /** Attachments per message and total bytes (data URLs, base64-inflated). */
  maxFiles: MAX_FILES,
  maxFileBytes: MAX_FILE_BYTES,
  /** Longest data URL accepted for one attachment. */
  maxFileUrlChars: dataUrlChars(MAX_FILE_BYTES),
  allowedMedia,
  /** Characters per text or reasoning part of any role (assistant answers included). */
  maxPartChars: 32_000,
  /** Parts per message (text, files, tool calls). */
  maxParts: 64,
  /** Model loop and output caps. */
  maxSteps: envInt('AI_MAX_STEPS', 6, 1, 12),
  /**
   * Output tokens per step (one model call) for an answer in a Latin-script or CJK language; other scripts
   * get twice this, because the same answer costs them several times the tokens (`outputBudget`). A whole
   * turn may produce at most twice the step cap across its tool-loop steps, plus one closing step.
   */
  maxOutputTokens: envInt('AI_MAX_OUTPUT_TOKENS', 3000, 64, 16_000),
  /** Anthropic's native web search: searches per model call (each is billed, and its results are input tokens). */
  webSearchMaxUses: envInt('AI_WEB_SEARCH_MAX_USES', 3, 0, 5),
  /** Wall-clock budget for one answer; the model call is aborted after this (kept under the route's maxDuration). */
  maxAnswerMs: envInt('AI_MAX_ANSWER_MS', 55_000, 5_000, 55_000),
  /**
   * After this long, the tool loop starts no further lookups: the next step writes the answer with what the
   * tools already returned. Keep it low enough that one more model call and one tool call (`toolTimeoutMs`)
   * still fit before `maxAnswerMs`.
   */
  softAnswerMs: envInt('AI_SOFT_ANSWER_MS', 26_000, 2_000, 50_000),
  /** Time budget for one tool call (all of its upstream requests together). */
  toolTimeoutMs: envInt('AI_TOOL_TIMEOUT_MS', 12_000, 1_000, 30_000),
  /** Request body cap (bytes): a full set of attachments (base64 adds a third) plus room for the conversation. */
  maxBodyBytes: MAX_FILES * dataUrlChars(MAX_FILE_BYTES) + 1024 * 1024,
  /** Token bucket: burst capacity and refill (tokens per minute) per IP. */
  bucketCapacity: envInt('RATE_LIMIT_BURST', 12, 1, 10_000),
  refillPerMinute: envInt('RATE_LIMIT_PER_MINUTE', 8, 1, 10_000),
} as const;
