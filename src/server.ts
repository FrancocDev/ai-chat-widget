import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  type Tool,
} from "ai";
import type { ChatRouteConfig } from "./types";

const CLIENT_TOOL_MARKER = "__client_tool";

function isClientTool(tool: Tool): boolean {
  return !tool.execute;
}

function wrapClientTools(
  tools?: Record<string, Tool>
): Record<string, Tool> | undefined {
  if (!tools) return undefined;

  const wrapped: Record<string, Tool> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    if (isClientTool(toolDef)) {
      wrapped[name] = {
        ...toolDef,
        execute: async (args: unknown) => ({
          [CLIENT_TOOL_MARKER]: true,
          args,
        }),
      };
    } else {
      wrapped[name] = toolDef;
    }
  }
  return wrapped;
}

/**
 * Safely converts UI messages to model messages.
 * Handles edge cases like tool invocations without results.
 */
async function safeConvertMessages(
  messages: UIMessage[]
): Promise<ReturnType<typeof convertToModelMessages>> {
  try {
    return await convertToModelMessages(messages);
  } catch (error) {
    // If conversion fails due to missing tool results, try cleaning messages
    console.warn(
      "[ai-chat-widget] Message conversion failed, attempting cleanup:",
      error
    );

    const cleaned = messages.map((msg: any) => {
      if (msg.role === "assistant" && msg.parts) {
        // Remove tool invocation parts that don't have results yet
        const cleanParts = msg.parts.filter((part: any) => {
          if (part.type === "tool-invocation") {
            // Keep only if it has a result (success or error)
            return part.toolInvocation?.state !== "pending";
          }
          return true;
        });
        return { ...msg, parts: cleanParts };
      }
      return msg;
    });

    return await convertToModelMessages(cleaned);
  }
}

/**
 * Creates an API route handler for the chat widget.
 *
 * Works with any framework that uses the standard Request/Response API
 * (Next.js App Router, Astro, SvelteKit, Hono, Express with adaptation, etc.)
 *
 * @example
 * ```ts
 * // Next.js App Router — app/api/chat/route.ts
 * import { createChatRoute } from "@francocdev/ai-chat-widget/server";
 *
 * const handler = createChatRoute({
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: "gpt-4o-mini",
 *   systemPrompt: "You are a helpful assistant.",
 * });
 *
 * export const POST = handler;
 * ```
 *
 * @example
 * ```ts
 * // Astro — src/pages/api/chat.ts
 * import { createChatRoute } from "@francocdev/ai-chat-widget/server";
 *
 * const handler = createChatRoute({
 *   apiKey: import.meta.env.GROQ_API_KEY,
 *   baseURL: "https://api.groq.com/openai/v1",
 *   model: "llama-3.3-70b-versatile",
 *   systemPrompt: async () => {
 *     const data = await fetchMyData();
 *     return buildPrompt(data);
 *   },
 * });
 *
 * export const POST = handler;
 * ```
 */
export function createChatRoute(config: ChatRouteConfig) {
  const openai = createOpenAI({
    baseURL: config.baseURL ?? "https://api.openai.com/v1",
    apiKey: config.apiKey,
  });
  const model = openai(config.model ?? "gpt-4o-mini");

  const processedTools = wrapClientTools(config.tools);

  return async (request: Request): Promise<Response> => {
    try {
      let body: { messages: UIMessage[] };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Bad request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const system =
        typeof config.systemPrompt === "function"
          ? await config.systemPrompt()
          : config.systemPrompt;

      const messages = await safeConvertMessages(body.messages);

      const result = streamText({
        model,
        system,
        messages,
        tools: processedTools,
        maxSteps: 10,
      } as any);

      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error("[ai-chat-widget] Chat route error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
