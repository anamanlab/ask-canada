/**
 * Model selection (server only). Provider-agnostic so the service can run on Vercel, AWS or Azure
 * (including Government of Canada cloud tenancies). Providers are imported lazily.
 *
 *   AI_PROVIDER = anthropic | gateway | azure | bedrock   (default: anthropic if ANTHROPIC_API_KEY is set,
 *                                                          otherwise gateway)
 *   AI_MODEL    = model / deployment id for the provider
 *
 *   anthropic  ANTHROPIC_API_KEY                         default model claude-sonnet-5-5
 *   gateway    Vercel AI Gateway (OIDC or AI_GATEWAY_API_KEY)  default anthropic/claude-sonnet-5.5
 *   azure      AZURE_RESOURCE_NAME + AZURE_API_KEY (or AZURE_BASE_URL)   AI_MODEL = deployment name (required)
 *   bedrock    AWS_REGION + standard AWS credentials     AI_MODEL = Bedrock model/inference-profile id (required)
 *
 *   AI_EFFORT   = low | medium | high   (default medium) how much Claude 5.5 models think before they write.
 *                 They cannot turn thinking off; `high` (the API default) adds seconds before the first word.
 *
 *   SCRIPTED_AI=1 -> no model at all; the scripted engine answers (deterministic; also the kill switch).
 */
import 'server-only';
import type { LanguageModel, ModelMessage } from 'ai';

export type Provider = 'anthropic' | 'gateway' | 'azure' | 'bedrock';

export const isScripted = () => process.env.SCRIPTED_AI === '1' || process.env.SCRIPTED_AI === 'true';

export function providerName(): Provider {
  const p = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (p === 'anthropic' || p === 'gateway' || p === 'azure' || p === 'bedrock') return p;
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'gateway';
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
