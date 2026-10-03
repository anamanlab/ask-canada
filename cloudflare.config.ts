import { bindings, defineConfig, defineWorker } from "cf/config";

// One config, two deployments — mirroring the repo's COUNTRY build variable.
// COUNTRY=ca builds Ask Canada (worker "canada"); COUNTRY=br builds Ask Brasil
// (worker "brazil"). They are separate Workers because COUNTRY is resolved at
// build time: the two apps share no code paths, only the repository.
const COUNTRY = (process.env.COUNTRY || "ca").replace(/[^a-z-]/g, "");
const isBrazil = COUNTRY === "br";

export default defineConfig({
  worker: defineWorker({
    name: isBrazil ? "brazil" : "canada",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    // Both production Workers use their existing custom domains.
    workersDev: false,
    previewUrls: false,
    observability: isBrazil ? {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true },
      traces: { enabled: true, headSamplingRate: 0.01 },
    } : undefined,
    env: {
      ASSETS: bindings.assets(),
      // Workers AI. The binding needs no API key: Workers AI is billed on the account's neuron
      // allowance (10,000/day free). Ask Brasil reads it through `cloudflare:workers` (src/lib/ai/model.ts);
      // the Canada worker ignores it, and non-Workers hosts have no binding to read.
      AI: bindings.ai(),
      // Deploy these with cf deploy --secrets-file; neither value is bundled.
      // Gemini is Canada-only: Ask Brasil answers on Workers AI and DuckDuckGo, so declaring the
      // secret here would make the Brazil deploy fail for a credential it never reads.
      ...(isBrazil ? {} : { GEMINI_API_KEY: bindings.secret() }),
      // Production already stores the kill switch as a secret. Set it to "0"
      // in the deployment secrets file to enable model answers.
      SCRIPTED_AI: bindings.secret(),
      // Non-secret model configuration. Brazil answers on Workers AI (Cloudflare-hosted, no third-party
      // key, no data leaving the account); Canada stays on Gemini.
      AI_PROVIDER: { type: "text", value: isBrazil ? "workers-ai" : "google" },
      AI_MODEL: {
        type: "text",
        value: isBrazil ? "@cf/zai-org/glm-4.7-flash" : "gemini-3.8-flash",
      },
      AI_EFFORT: { type: "text", value: "medium" },
      // Opt in only when the Gemini project has Search grounding access and quota.
      // Workers AI has no grounding tool here; `searchOfficialSources` covers both packs.
      GEMINI_SEARCH_GROUNDING: { type: "text", value: "0" },
      // Soft daily spend breaker: past this, answers come from the scripted engine.
      AI_DAILY_BUDGET_USD: { type: "text", value: "25" },
      // `searchOfficialSources` falls back to this site-restricted search to stay in-scope.
      SEARCH_FALLBACK: { type: "text", value: "duckduckgo" },
    },
  }),
});
