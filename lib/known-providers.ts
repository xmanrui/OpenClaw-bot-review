/**
 * Well-known provider model metadata.
 *
 * When a provider appears in the OpenClaw config without full model details
 * (contextWindow, maxTokens, etc.), these presets fill in the gaps so the
 * dashboard can display richer information.
 */

export interface KnownModelMeta {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens?: number;
  reasoning: boolean;
  input: string[];
  pricingUsdPerMillionTokens?: KnownModelPricing;
  /**
   * Supported thinking modes, e.g. ["adaptive", "disabled"] or ["always_on"].
   * Mirrors the provider's published thinking configuration for a model.
   */
  thinking?: string[];
}

export interface KnownModelPricing {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number | null;
}

export interface KnownProviderRegionMeta {
  region: string;
  openaiBaseUrl: string;
  anthropicBaseUrl: string;
  docsRoot: string;
}

export interface KnownProviderMeta {
  displayName: string;
  api: string;
  baseUrl: string;
  /**
   * Anthropic-compatible (messages) base URL for the global region, when the
   * provider exposes an Anthropic-compatible endpoint alongside the OpenAI one.
   */
  anthropicBaseUrl?: string;
  /**
   * Regional endpoint variants. The first entry is treated as the default
   * (global) region. `baseUrl` and `anthropicBaseUrl` mirror the global region.
   */
  regions?: KnownProviderRegionMeta[];
  models: KnownModelMeta[];
}

const KNOWN_PROVIDERS: Record<string, KnownProviderMeta> = {
  minimax: {
    displayName: "MiniMax",
    api: "openai-completions",
    baseUrl: "https://api.minimax.io/v1",
    anthropicBaseUrl: "https://api.minimax.io/anthropic",
    regions: [
      {
        region: "global_en",
        openaiBaseUrl: "https://api.minimax.io/v1",
        anthropicBaseUrl: "https://api.minimax.io/anthropic",
        docsRoot: "https://platform.minimax.io/docs",
      },
      {
        region: "cn_zh",
        openaiBaseUrl: "https://api.minimaxi.com/v1",
        anthropicBaseUrl: "https://api.minimaxi.com/anthropic",
        docsRoot: "https://platform.minimaxi.com/docs",
      },
    ],
    models: [
      {
        id: "MiniMax-M3",
        name: "MiniMax-M3",
        contextWindow: 1000000,
        reasoning: true,
        input: ["text", "image", "video"],
        pricingUsdPerMillionTokens: {
          input: 0.6,
          output: 2.4,
          cacheRead: 0.12,
          cacheWrite: null,
        },
        thinking: ["adaptive", "disabled"],
      },
      {
        id: "MiniMax-M2.7",
        name: "MiniMax-M2.7",
        contextWindow: 204800,
        maxTokens: 192000,
        reasoning: true,
        input: ["text"],
        pricingUsdPerMillionTokens: {
          input: 0.3,
          output: 1.2,
          cacheRead: 0.06,
          cacheWrite: 0.375,
        },
        thinking: ["always_on"],
      },
      {
        id: "MiniMax-M2.7-highspeed",
        name: "MiniMax-M2.7-highspeed",
        contextWindow: 204800,
        maxTokens: 192000,
        reasoning: false,
        input: ["text"],
      },
    ],
  },
};

/**
 * Look up a known provider by its ID (case-insensitive).
 */
export function getKnownProvider(providerId: string): KnownProviderMeta | null {
  const normalized = providerId.toLowerCase();
  return KNOWN_PROVIDERS[normalized] ?? null;
}

/**
 * Enrich a model entry with known metadata when fields are missing.
 */
export function enrichModelMeta(
  providerId: string,
  model: {
    id: string;
    name?: string;
    contextWindow?: number;
    maxTokens?: number;
    reasoning?: boolean;
    input?: string[];
    pricingUsdPerMillionTokens?: KnownModelPricing;
    thinking?: string[];
  },
): typeof model {
  const knownProvider = getKnownProvider(providerId);
  if (!knownProvider) return model;

  const knownModel = knownProvider.models.find(
    (m) => m.id === model.id || m.id.toLowerCase() === model.id.toLowerCase(),
  );
  if (!knownModel) return model;

  return {
    ...model,
    name: model.name || knownModel.name,
    contextWindow: model.contextWindow ?? knownModel.contextWindow,
    maxTokens: model.maxTokens ?? knownModel.maxTokens,
    reasoning: model.reasoning ?? knownModel.reasoning,
    input: model.input ?? knownModel.input,
    pricingUsdPerMillionTokens:
      model.pricingUsdPerMillionTokens ?? knownModel.pricingUsdPerMillionTokens,
    thinking: model.thinking ?? knownModel.thinking,
  };
}
