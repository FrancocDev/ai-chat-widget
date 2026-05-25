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

  it("responds with a stream on valid POST", async () => {
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

  it("responds with a stream when system prompt is async", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: async () => "Dynamic prompt",
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
    const body = await response.json();
    expect(body.error).toBe("Bad request");
  });

  it("returns 400 when messages contain pending tool invocations", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            parts: [
              {
                type: "tool-invocation",
                toolInvocation: {
                  toolCallId: "tc-1",
                  state: "pending",
                },
              },
            ],
          },
        ],
      }),
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("pending tool invocation");
  });

  it("returns 500 on unexpected server errors", async () => {
    const { streamText } = await import("ai");
    (streamText as any).mockImplementationOnce(() => {
      throw new Error("OpenAI down");
    });

    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
    });

    const response = await handler(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 400 when tool invocation state is input-available", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
    });

    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            parts: [
              {
                type: "tool-invocation",
                toolInvocation: {
                  toolCallId: "tc-2",
                  state: "input-available",
                },
              },
            ],
          },
        ],
      }),
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("pending tool invocation");
  });

  it("wraps client-side tools and still responds successfully", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
      tools: {
        myClientTool: { description: "A tool without execute" },
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
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("handles server-side tools with execute function", async () => {
    const handler = createChatRoute({
      apiKey: "test-key",
      systemPrompt: "Hello",
      tools: {
        myServerTool: {
          description: "A tool with execute",
          execute: async () => "result",
        },
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
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});
