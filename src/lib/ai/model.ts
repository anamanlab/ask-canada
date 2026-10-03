/**
 * Model selection (server only). Provider-agnostic so the service can run on Vercel, AWS or Azure
 * (including Government of Canada cloud tenancies) or on Cloudflare Workers. Providers are imported lazily.
 *
 *   AI_PROVIDER = anthropic | google | gateway | azure | bedrock | workers-ai
 *                                                          (default: anthropic if ANTHROPIC_API_KEY is set,
 *                                                          then google if GEMINI_API_KEY is set,
 *                                                          otherwise gateway)
 *   AI_MODEL    = model / deployment id for the provider
 *
 *   anthropic  ANTHROPIC_API_KEY                         default model claude-sonnet-5-5
 *   google     GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY   default model gemini-3.8-flash
 *   gateway    Vercel AI Gateway (OIDC or AI_GATEWAY_API_KEY)  default anthropic/claude-sonnet-5.5
 *   azure      AZURE_RESOURCE_NAME + AZURE_API_KEY (or AZURE_BASE_URL)   AI_MODEL = deployment name (required)
 *   bedrock    AWS_REGION + standard AWS credentials     AI_MODEL = Bedrock model/inference-profile id (required)
 *   workers-ai Workers AI through the `AI` binding        default model @cf/zai-org/glm-4.7-flash
 *              (Cloudflare Workers only, no model API key: Workers AI is billed on the account's neuron
 *               allowance, 10,000 neurons/day free. Off-Workers hosts have no binding to read, so this
 *               provider throws there and the chat route falls back to scripted answers.)
 *
 *   AI_EFFORT   = low | medium | high   (default medium) how much the model thinks before it writes.
 *                 Anthropic models cannot turn thinking off; `high` (the API default) adds seconds before the
 *                 first word. Sent as Anthropic provider options, so other providers ignore it.
 *
 *   SCRIPTED_AI=1 -> no model at all; the scripted engine answers (deterministic; also the kill switch).
 */
import 'server-only';
import type { LanguageModel, ModelMessage } from 'ai';

export type Provider = 'anthropic' | 'google' | 'gateway' | 'azure' | 'bedrock' | 'workers-ai';

/** The Gemini API key, under either name people use for it. */
export function googleApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || undefined;
}

/** Cloudflare-hosted default: 131K context, multilingual, multi-turn tool calling, free on the neuron allowance. */
export const WORKERS_AI_DEFAULT_MODEL = '@cf/zai-org/glm-4.7-flash';

export const isScripted = () => process.env.SCRIPTED_AI === '1' || process.env.SCRIPTED_AI === 'true';

export function providerName(): Provider {
  const p = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (p === 'anthropic' || p === 'google' || p === 'gateway' || p === 'azure' || p === 'bedrock' || p === 'workers-ai') return p;
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (googleApiKey()) return 'google';
  return 'gateway';
}

/**
 * The Workers AI binding, on the Workers runtime only. `cloudflare:workers` resolves there and nowhere else,
 * so the Next.js build aliases it to a stub with no bindings (next.config.ts) and this returns undefined on
 * every other host instead of failing the import. Reaching for it lazily also keeps the non-Workers providers
 * off the module entirely. The binding's type comes from cloudflare.config.ts (src/types/cloudflare-workers.d.ts).
 */
export async function workersAiBinding() {
  try {
    const { env } = await import('cloudflare:workers');
    return env.AI;
  } catch {
    return undefined;
  }
}

export async function getModel(): Promise<{ model: LanguageModel; id: string; provider: Provider }> {
  const provider = providerName();
  const override = process.env.AI_MODEL?.trim();
  switch (provider) {
    case 'anthropic': {
      const { anthropic } = await import('@ai-sdk/anthropic');
      const id = override && !override.includes('/') ? override : 'claude-sonnet-5-5';
      return { model: anthropic(id), id, provider };
    }
    case 'google': {
      const { createGoogle } = await import('@ai-sdk/google');
      const id = override && !override.includes('/') ? override : 'gemini-3.8-flash';
      return { model: createGoogle({ apiKey: googleApiKey() })(id), id, provider: 'google' };
    }
    case 'azure': {
      if (!override) throw new Error('AI_MODEL (Azure deployment name) is required for AI_PROVIDER=azure');
      const { createAzure } = await import('@ai-sdk/azure');
      const azure = createAzure({
        resourceName: process.env.AZURE_RESOURCE_NAME,
        apiKey: process.env.AZURE_API_KEY,
        baseURL: process.env.AZURE_BASE_URL,
      });
      return { model: azure(override), id: override, provider };
    }
    case 'bedrock': {
      if (!override) throw new Error('AI_MODEL (Bedrock model id) is required for AI_PROVIDER=bedrock');
      const { createAmazonBedrock } = await import('@ai-sdk/amazon-bedrock');
      const bedrock = createAmazonBedrock({ region: process.env.AWS_REGION });
      return { model: bedrock(override), id: override, provider };
    }
    case 'workers-ai': {
      const binding = await workersAiBinding();
      if (!binding) {
        throw new Error(
          'AI_PROVIDER=workers-ai needs the Workers AI binding (AI: bindings.ai() in cloudflare.config.ts) on a Cloudflare Worker',
        );
      }
      const { createWorkersAI } = await import('workers-ai-provider');
      // Model ids are `@cf/<vendor>/<model>`, so no `/` disambiguation here the way the API-key providers need.
      const id = override || WORKERS_AI_DEFAULT_MODEL;
      return { model: createWorkersAI({ binding })(id), id, provider };
    }
    default: {
      const { gateway } = await import('@ai-sdk/gateway');
      const id = override || 'anthropic/claude-sonnet-5.5';
      return { model: gateway(id), id, provider: 'gateway' };
    }
  }
}

type ProviderOptions = NonNullable<ModelMessage['providerOptions']>;

/**
 * Provider options sent with every model call. `effort` reaches Anthropic models directly and through the AI
 * Gateway; other providers ignore the key.
 */
export function modelOptions(): ProviderOptions {
  const raw = process.env.AI_EFFORT?.trim().toLowerCase();
  const effort = raw === 'low' || raw === 'high' ? raw : 'medium';
  return { anthropic: { effort } };
}
