import { describe, it, expect } from "vitest";

const API_KEY = process.env.MINIMAX_API_KEY;
const BASE_URL = "https://api.minimax.io/v1";

describe.skipIf(!API_KEY)("MiniMax API E2E", () => {
  it("completes basic chat with MiniMax-M3", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M3",
        messages: [{ role: "user", content: 'Say "test passed"' }],
        max_tokens: 20,
        temperature: 1,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toBeTruthy();
  }, 30000);

  it("completes basic chat with MiniMax-M2.7", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [{ role: "user", content: 'Say "test passed"' }],
        max_tokens: 20,
        temperature: 1,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toBeTruthy();
  }, 30000);

  it("completes chat with temperature=1 (recommended for MiniMax)", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [{ role: "user", content: "Reply with one word" }],
        max_tokens: 8,
        temperature: 1,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toBeTruthy();
  }, 30000);

  it("completes chat with MiniMax-M2.7-highspeed", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7-highspeed",
        messages: [{ role: "user", content: 'Reply with "ok"' }],
        max_tokens: 10,
        temperature: 1,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices[0].message.content).toBeTruthy();
  }, 30000);
});

describe("MiniMax endpoint configuration", () => {
  it("exposes the global OpenAI- and Anthropic-compatible endpoints", async () => {
    const { getKnownProvider } = await import("../lib/known-providers");
    const provider = getKnownProvider("minimax");
    expect(provider).not.toBeNull();
    expect(provider!.baseUrl).toBe("https://api.minimax.io/v1");
    expect(provider!.anthropicBaseUrl).toBe("https://api.minimax.io/anthropic");
  });

  it("exposes the CN OpenAI- and Anthropic-compatible endpoints via regions", async () => {
    const { getKnownProvider } = await import("../lib/known-providers");
    const provider = getKnownProvider("minimax");
    const cn = provider!.regions?.find((r) => r.region === "cn_zh");
    expect(cn).toBeDefined();
    expect(cn!.openaiBaseUrl).toBe("https://api.minimaxi.com/v1");
    expect(cn!.anthropicBaseUrl).toBe("https://api.minimaxi.com/anthropic");
  });
});
