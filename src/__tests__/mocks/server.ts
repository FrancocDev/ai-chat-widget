import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const mockChatHandler = http.post("/api/chat", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("Hello! How can I help you?"));
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
});

export const mockChatErrorHandler = http.post("/api/chat", () => {
  return new HttpResponse(
    JSON.stringify({ error: "Service unavailable" }),
    { status: 503 }
  );
});

export const server = setupServer(mockChatHandler);
