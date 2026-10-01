/**
 * Runs in the browser before the app becomes interactive.
 *
 * Vercel BotID (see src/lib/ai/bot-check.ts): wraps `fetch` so the chat request carries the answer to an
 * invisible challenge. `NEXT_PUBLIC_BOTID` is set at build time, only for builds made on Vercel
 * (next.config.ts). Everywhere else it is empty, this branch is dead code and nothing BotID-related is
 * loaded or shipped, so self-hosted and local builds behave exactly as before.
 *
 * The challenge script is fetched from this origin (a rewrite added by `withBotId`) the first time a
 * question is sent, by a script the page already trusts, so the nonce + 'strict-dynamic' CSP needs no change.
 */
import { initBotId } from 'botid/client/core';

const CHAT = '/api/chat';

if (process.env.NEXT_PUBLIC_BOTID === '1') {
  try {
    const plain = window.fetch.bind(window);
    initBotId({ protect: [{ path: CHAT, method: 'POST' }] });
    const challenged = window.fetch;
    /**
     * BotID's wrapper rejects when its challenge script cannot load (blocked, offline, an outage), which
     * would leave the person with no answer at all. In that case the question is sent once without the
     * challenge: the server then treats it as unverified and, by default, answers from the scripted engine.
     */
    window.fetch = async (input, init) => {
      try {
        return await challenged(input, init);
      } catch (err) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
        const isChat = init?.method?.toUpperCase() === 'POST' && new URL(url, location.href).pathname === CHAT;
        if (!isChat || init?.signal?.aborted || typeof init?.body !== 'string') throw err;
        return plain(input, init);
      }
    };
  } catch (err) {
    console.error('BotID could not start', err);
  }
}
