import {
  createOpenAI,
  type OpenAIProvider,
} from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type LanguageModel } from "ai";
import type { ChatRouteConfig } from "./types";

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
  let cachedModel: LanguageModel | null = null;

  function getModel() {
    if (cachedModel) return cachedModel;

    const openai: OpenAIProvider = createOpenAI({
      baseURL: config.baseURL ?? "https://api.openai.com/v1",
      apiKey: config.apiKey,
    });

    cachedModel = openai(config.model ?? "gpt-4o-mini");
    return cachedModel;
  }

  return async (request: Request): Promise<Response> => {
    try {
      const { messages } = await request.json();

      const system =
        typeof config.systemPrompt === "function"
          ? await config.systemPrompt()
          : config.systemPrompt;

      const result = streamText({
        model: getModel(),
        system,
        messages: await convertToModelMessages(messages),
      });

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
