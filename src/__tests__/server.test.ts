import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChatRoute } from "../server";

// Mock ai-sdk
vi.mock("ai", () => ({
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: () =>
      new Response("data: stream", {
        headers: { "Content-Type": "text/event-stream" },
      }),
  })),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => {
    return vi.fn((model?: string) => ({ modelId: model ?? "gpt-4o-mini" }));
  }),
}));

describe("createChatRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a function", () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
    });
    expect(typeof handler).toBe("function");
  });

  it("handles a valid POST request with static system prompt", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      model: "gpt-4o",
      systemPrompt: "You are helpful.",
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("handles async system prompt", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: async () => {
        return "Dynamic prompt";
      },
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
  });

  it("returns 400 on malformed JSON body", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: "not json",
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
  });

  it("uses custom baseURL when provided", async () => {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const handler = createChatRoute({
      apiKey: "test-key",
      baseURL: "https://api.groq.com/openai/v1",
      systemPrompt: "Hello",
    });

    // Trigger model creation by calling the handler
    await handler(
      new Request("https://example.com/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
      })
    );

    expect(createOpenAI).toHaveBeenCalledWith({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: "test-key",
    });
  });

  it("passes tools to streamText when provided", async () => {
    const { streamText } = await import("ai");
    const mockTool = { type: "tool", description: "Test tool" } as unknown as import("ai").Tool;

    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
      tools: { testTool: mockTool },
    });

    await handler(
      new Request("https://example.com/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
      })
    );

    const call = (streamText as any).mock.calls[0][0];
    expect(call).toMatchObject({
      messages: [{ role: "user", content: "Hi" }],
      model: { modelId: "gpt-4o-mini" },
      system: "Hello",
    });
    expect(call.tools).toBeDefined();
    expect(call.tools.testTool).toMatchObject({
      description: "Test tool",
      type: "tool",
    });
    // Client-side tools get wrapped with an execute proxy
    expect(typeof call.tools.testTool.execute).toBe("function");
  });
});
