/**
 * Bot filtering for /api/chat with Vercel BotID: an invisible challenge (no CAPTCHA) that the page solves
 * in the background and attaches to the chat request; the server asks Vercel whether the caller is a bot.
 *
 * Only on Vercel. Off Vercel (Docker, any other host) and in local dev there is no BotID service, so the
 * check is skipped and every caller counts as a person; the rate limiter and the spend breaker still apply.
 * The browser side is switched on by the same condition at build time (next.config.ts ->
 * NEXT_PUBLIC_BOTID -> src/instrumentation-client.ts), so the two always agree.
 *
 * BOTID_MODE (default `scripted`):
 *   scripted  a bot gets the scripted engine: a real, sourced answer that costs no model tokens. A person
 *             wrongly flagged still gets an answer instead of an error.
 *   deny      a bot gets 403.
 *   log       classify and log only (use it to watch the verdicts before enforcing).
 *   off       no check, and the browser challenge is not loaded (build-time: redeploy after changing it).
 *
 * Verified bots (Vercel's directory, bots.fyi: search crawlers, monitors, AI crawlers…) are bots here too:
 * none of them needs a model answer from a POST endpoint. The exception is BOTID_ALLOW_VERIFIED, a list of
 * verified bot names or categories that are treated as people. By default that is the browsing agents that
 * act for a person who asked them to (`chatgpt-operator`, `google-agent`).
 */
import 'server-only';

export type BotMode = 'off' | 'log' | 'scripted' | 'deny';
export type BotVerdict = { bot: boolean; name?: string };

/** The subset of `checkBotId()`'s answer this policy reads. */
export type BotIdResult = { isBot: boolean; isVerifiedBot?: boolean; verifiedBotName?: string; verifiedBotCategory?: string };

const DEFAULT_ALLOWED = 'chatgpt-operator,google-agent';

export function botMode(env: NodeJS.ProcessEnv = process.env): BotMode {
  // BotID needs Vercel's request context and OIDC token; a production build elsewhere would throw on every call.
  if (env.VERCEL !== '1' || env.NODE_ENV !== 'production') return 'off';
  const mode = env.BOTID_MODE?.trim().toLowerCase();
  return mode === 'off' || mode === 'log' || mode === 'deny' ? mode : 'scripted';
}

/** Applies the verified-bot policy to BotID's answer. */
export function judge(result: BotIdResult, env: NodeJS.ProcessEnv = process.env): BotVerdict {
  const name = result.verifiedBotName?.toLowerCase();
  const category = result.verifiedBotCategory?.toLowerCase();
  if (!result.isBot && !result.isVerifiedBot) return { bot: false };
  const allowed = (env.BOTID_ALLOW_VERIFIED ?? DEFAULT_ALLOWED)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const pass = Boolean(result.isVerifiedBot) && allowed.some((a) => a === name || a === category);
  return { bot: !pass, name: name ?? (result.isVerifiedBot ? 'verified' : undefined) };
}

/**
 * Who is calling. Never throws: if BotID cannot be reached the caller is treated as a person (the other
 * layers still apply), and that is logged.
 */
export async function checkCaller(mode: BotMode = botMode()): Promise<BotVerdict> {
  if (mode === 'off') return { bot: false };
  try {
    const { checkBotId } = await import('botid/server');
    const verdict = judge(await checkBotId());
    if (verdict.bot && mode === 'log') console.warn(`[chat] BotID: bot${verdict.name ? ` (${verdict.name})` : ''}, not enforced (BOTID_MODE=log)`);
    return verdict;
  } catch (err) {
    console.warn('[chat] BotID check failed, letting the request through:', (err as Error).message);
    return { bot: false };
  }
}
