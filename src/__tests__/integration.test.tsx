import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ChatWidgetProvider } from "../provider";
import { server } from "./mocks/server";

const mockUseChat = vi.fn(() => ({
  messages: [],
  sendMessage: vi.fn(),
  status: "ready",
  error: null,
  setMessages: vi.fn(),
  stop: vi.fn(),
  addToolOutput: vi.fn(),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
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
    localStorage.clear();
  });
  afterAll(() => server.close());

  it("full chat flow: open → type → send → receive", async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
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
    const sendBtn = screen.getByLabelText("Send message");
    await user.click(sendBtn);

    // Input is cleared after submit
    expect(input).toHaveValue("");
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
      addToolOutput: vi.fn(),
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
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      ],
      sendMessage: vi.fn(),
      status: "streaming",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
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
      status: "streaming",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
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

    expect(screen.getByTitle("Cerrar")).toBeInTheDocument();
    expect(screen.getByTitle("Limpiar")).toBeInTheDocument();
    expect(screen.getByTitle("Parar")).toBeInTheDocument();
    expect(screen.getByText("Procesando...")).toBeInTheDocument();
  });

  it("integrates ChatTrigger with ChatWidget", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });

  it("persists messages to localStorage and can read them back", async () => {
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    // Wait for debounced storage write
    await new Promise((resolve) => setTimeout(resolve, 600));

    const stored = localStorage.getItem("ai-chat-widget-messages");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.v).toBe(1);
    expect(parsed.messages).toEqual([
      { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
    ]);
  });
});
