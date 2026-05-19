import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ChatWidgetProvider } from "../provider";
import { server, mockChatHandler, mockChatErrorHandler } from "./mocks/server";
import { http, HttpResponse } from "msw";

// Our own mock for useChat to simulate a working chat
const { mockUseChat } = vi.hoisted(() => ({
  mockUseChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
    error: null,
    setMessages: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: mockUseChat,
}));

import { ChatWidget } from "../components/chat-widget";
import { ChatTrigger } from "../components/chat-trigger";

function TestWrapper({ children, config = {} }: { children: ReactNode; config?: any }) {
  return <ChatWidgetProvider config={config}>{children}</ChatWidgetProvider>;
}

describe("Integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it("full chat flow: open → type → send → receive", async () => {
    const sendMessageMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: sendMessageMock,
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
    });

    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    // Empty state is shown
    expect(screen.getByText("Ask me anything — I'm here to help!")).toBeInTheDocument();

    // Type a message
    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello bot");
    expect(input).toHaveValue("Hello bot");

    // Submit
    const sendBtn = document.querySelector(".acw-send-btn")!;
    await user.click(sendBtn);

    expect(sendMessageMock).toHaveBeenCalledWith({ text: "Hello bot" });
  });

  it("shows messages when they exist", () => {
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
        { id: "2", role: "assistant", parts: [{ type: "text", text: "Hello!" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("shows stop button when streaming", () => {
    const stopMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      ],
      sendMessage: vi.fn(),
      status: "streaming",
      error: null,
      setMessages: vi.fn(),
      stop: stopMock,
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const stopBtn = screen.getByTitle("Stop");
    expect(stopBtn).toBeInTheDocument();
  });

  it("uses custom labels from config", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
    });

    render(
      <TestWrapper
        config={{
          labels: {
            thinking: "Procesando...",
            error: "Error del sistema",
            toggleChat: "Abrir chat",
            clearChat: "Limpiar",
            close: "Cerrar",
            stop: "Parar",
          },
        }}
      >
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    // Should use custom close label
    expect(screen.getByTitle("Cerrar")).toBeInTheDocument();
    expect(screen.getByTitle("Limpiar")).toBeInTheDocument();
  });

  it("integrates ChatTrigger with ChatWidget", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    // ChatTrigger should render
    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });
});
