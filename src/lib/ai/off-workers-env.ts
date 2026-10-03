/**
 * Stand-in for the `cloudflare:workers` module on hosts that are not Cloudflare Workers (Vercel, Docker,
 * Azure) — and in the Next.js build, which cannot resolve a Workers runtime module. `next.config.ts` aliases
 * the specifier here; the Workers build (vinext + @cloudflare/vite-plugin) resolves it for real.
 *
 * There are no bindings off Workers, so `workersAiBinding()` (model.ts) reads no `AI` binding and a
 * Workers AI provider throws its "needs the AI binding" error, which the chat route turns into a scripted
 * answer rather than a failed request.
 */
export const env: Record<string, never> = {};