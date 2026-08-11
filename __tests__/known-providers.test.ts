import { describe, it, expect } from "vitest";
import { getKnownProvider, enrichModelMeta } from "../lib/known-providers";

describe("getKnownProvider", () => {
  it("returns MiniMax provider metadata for exact match", () => {
    const provider = getKnownProvider("minimax");
    expect(provider).not.toBeNull();
    expect(provider!.displayName).toBe("MiniMax");
    expect(provider!.api).toBe("openai-completions");
    expect(provider!.baseUrl).toBe("https://api.minimax.io/v1");
    expect(provider!.anthropicBaseUrl).toBe("https://api.minimax.io/anthropic");
  });

  it("returns MiniMax provider metadata for case-insensitive match", () => {
    const provider = getKnownProvider("MiniMax");
    expect(provider).not.toBeNull();
    expect(provider!.displayName).toBe("MiniMax");
  });

  it("returns null for unknown provider", () => {
    const provider = getKnownProvider("unknown-provider");
    expect(provider).toBeNull();
  });

  it("includes MiniMax-M3, MiniMax-M2.7, and MiniMax-M2.7-highspeed models", () => {
    const provider = getKnownProvider("minimax");
    const ids = provider!.models.map((m) => m.id);
    expect(ids).toContain("MiniMax-M3");
    expect(ids).toContain("MiniMax-M2.7");
    expect(ids).toContain("MiniMax-M2.7-highspeed");
  });

  it("MiniMax-M3 has 1,000,000-token context, multimodal input, and adaptive/disabled thinking", () => {
    const provider = getKnownProvider("minimax");
    const m3 = provider!.models.find((m) => m.id === "MiniMax-M3");
    expect(m3).toBeDefined();
    expect(m3!.contextWindow).toBe(1000000);
    expect(m3!.reasoning).toBe(true);
    expect(m3!.input).toEqual(["text", "image", "video"]);
    expect(m3!.pricingUsdPerMillionTokens).toEqual({
      input: 0.6,
      output: 2.4,
      cacheRead: 0.12,
      cacheWrite: null,
    });
    expect(m3!.thinking).toEqual(["adaptive", "disabled"]);
  });

  it("MiniMax-M2.7 retains context window, text-only input, and marks reasoning always on", () => {
    const provider = getKnownProvider("minimax");
    const m27 = provider!.models.find((m) => m.id === "MiniMax-M2.7");
    expect(m27).toBeDefined();
    expect(m27!.contextWindow).toBe(204800);
    expect(m27!.maxTokens).toBe(192000);
    expect(m27!.reasoning).toBe(true);
    expect(m27!.input).toEqual(["text"]);
    expect(m27!.pricingUsdPerMillionTokens).toEqual({
      input: 0.3,
      output: 1.2,
      cacheRead: 0.06,
      cacheWrite: 0.375,
    });
    expect(m27!.thinking).toEqual(["always_on"]);
  });

  it("MiniMax-M2.7-highspeed retains its non-reasoning text-only metadata", () => {
    const provider = getKnownProvider("minimax");
    const highspeed = provider!.models.find((m) => m.id === "MiniMax-M2.7-highspeed");
    expect(highspeed).toBeDefined();
    expect(highspeed!.contextWindow).toBe(204800);
    expect(highspeed!.maxTokens).toBe(192000);
    expect(highspeed!.reasoning).toBe(false);
    expect(highspeed!.input).toEqual(["text"]);
  });
});

describe("MiniMax regional endpoints", () => {
  it("exposes global and CN regional OpenAI- and Anthropic-compatible base URLs", () => {
    const provider = getKnownProvider("minimax");
    expect(provider!.regions).toBeDefined();
    const regions = provider!.regions!;
    expect(regions).toHaveLength(2);

    const globalRegion = regions.find((r) => r.region === "global_en");
    expect(globalRegion).toBeDefined();
    expect(globalRegion!.openaiBaseUrl).toBe("https://api.minimax.io/v1");
    expect(globalRegion!.anthropicBaseUrl).toBe("https://api.minimax.io/anthropic");
    expect(globalRegion!.docsRoot).toBe("https://platform.minimax.io/docs");

    const cnRegion = regions.find((r) => r.region === "cn_zh");
    expect(cnRegion).toBeDefined();
    expect(cnRegion!.openaiBaseUrl).toBe("https://api.minimaxi.com/v1");
    expect(cnRegion!.anthropicBaseUrl).toBe("https://api.minimaxi.com/anthropic");
    expect(cnRegion!.docsRoot).toBe("https://platform.minimaxi.com/docs");
  });
});

describe("enrichModelMeta", () => {
  it("fills in missing metadata for known MiniMax-M3 model", () => {
    const model = { id: "MiniMax-M3", name: "MiniMax-M3" };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.contextWindow).toBe(1000000);
    expect(enriched.reasoning).toBe(true);
    expect(enriched.input).toEqual(["text", "image", "video"]);
    expect(enriched.pricingUsdPerMillionTokens).toEqual({
      input: 0.6,
      output: 2.4,
      cacheRead: 0.12,
      cacheWrite: null,
    });
    expect(enriched.thinking).toEqual(["adaptive", "disabled"]);
  });

  it("fills in missing metadata for known MiniMax-M2.7 model", () => {
    const model = { id: "MiniMax-M2.7", name: "MiniMax-M2.7" };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.contextWindow).toBe(204800);
    expect(enriched.maxTokens).toBe(192000);
    expect(enriched.reasoning).toBe(true);
    expect(enriched.input).toEqual(["text"]);
    expect(enriched.pricingUsdPerMillionTokens).toEqual({
      input: 0.3,
      output: 1.2,
      cacheRead: 0.06,
      cacheWrite: 0.375,
    });
    expect(enriched.thinking).toEqual(["always_on"]);
  });

  it("does not override existing metadata", () => {
    const model = {
      id: "MiniMax-M2.7",
      name: "Custom Name",
      contextWindow: 100000,
      maxTokens: 50000,
      reasoning: true,
      input: ["text", "image"],
      pricingUsdPerMillionTokens: {
        input: 1,
        output: 2,
        cacheRead: 0.5,
        cacheWrite: null,
      },
      thinking: ["disabled"],
    };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.name).toBe("Custom Name");
    expect(enriched.contextWindow).toBe(100000);
    expect(enriched.maxTokens).toBe(50000);
    expect(enriched.reasoning).toBe(true);
    expect(enriched.input).toEqual(["text", "image"]);
    expect(enriched.pricingUsdPerMillionTokens).toEqual({
      input: 1,
      output: 2,
      cacheRead: 0.5,
      cacheWrite: null,
    });
    expect(enriched.thinking).toEqual(["disabled"]);
  });

  it("fills in undefined fields while keeping defined ones", () => {
    const model = {
      id: "MiniMax-M2.7-highspeed",
      name: "Highspeed",
      contextWindow: undefined as unknown as number,
      maxTokens: 50000,
    };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.name).toBe("Highspeed");
    expect(enriched.contextWindow).toBe(204800);
    expect(enriched.maxTokens).toBe(50000);
  });

  it("returns model unchanged for unknown provider", () => {
    const model = { id: "gpt-4", name: "GPT-4" };
    const enriched = enrichModelMeta("openai", model);
    expect(enriched).toEqual(model);
  });

  it("returns model unchanged for unknown model in known provider", () => {
    const model = { id: "unknown-model", name: "Unknown" };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched).toEqual(model);
  });

  it("performs case-insensitive model ID matching", () => {
    const model = { id: "minimax-m2.7" };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.contextWindow).toBe(204800);
  });

  it("enriches MiniMax-M3 case-insensitively", () => {
    const model = { id: "minimax-m3" };
    const enriched = enrichModelMeta("minimax", model);
    expect(enriched.contextWindow).toBe(1000000);
    expect(enriched.thinking).toEqual(["adaptive", "disabled"]);
  });
});
