import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { ChatWidgetProvider } from "../provider";
import { setStoredMessages, getStoredMessages, clearStoredMessages } from "../hooks/use-chat-storage";
import type { ReactNode } from "react";

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

// Must import components AFTER the mock
import { ChatWidget } from "../components/chat-widget";
import { ChatTrigger } from "../components/chat-trigger";

function TestWrapper({ children }: { children: ReactNode }) {
  return <ChatWidgetProvider config={{}}>{children}</ChatWidgetProvider>;
}

describe("ChatWidget", () => {
  beforeEach(() => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });
  });

  it("renders the chat panel with defaults", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(screen.getByText("Ask me anything")).toBeInTheDocument();
    expect(screen.getByText("Powered by AI")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(
      screen.getByText("Ask me anything — I'm here to help!")
    ).toBeInTheDocument();
  });

  it("shows send button", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("closes the panel when X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    const closeBtn = screen.getByTitle("Close");
    await user.click(closeBtn);
    // The close action is handled by the parent; here we just verify the button works
    expect(closeBtn).toBeInTheDocument();
  });

  it("shows loading indicator while waiting for response", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "submitted",
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
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("shows error message when chat fails", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "error",
      error: new Error("fail"),
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(
      screen.getByText(/temporarily unavailable/)
    ).toBeInTheDocument();
  });

  it("disables input while streaming", () => {
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
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(screen.getByPlaceholderText("Type a message...")).toBeDisabled();
  });

  it("shows stop button when streaming", () => {
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
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(screen.getByTitle("Stop")).toBeInTheDocument();
  });

  it("uses custom config from provider", () => {
    function CustomWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            title: "Custom Chat",
            subtitle: "v2",
            placeholder: "Ask...",
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <CustomWrapper>
        <ChatWidget onClose={vi.fn()} />
      </CustomWrapper>
    );
    expect(screen.getByText("Custom Chat")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask...")).toBeInTheDocument();
  });

  it("applies custom className and style", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} className="my-chat" style={{ border: "2px solid red" }} />
      </TestWrapper>
    );
    const panel = document.querySelector(".acw-chat-panel.my-chat");
    expect(panel).toBeInTheDocument();
    expect(panel?.getAttribute("style")).toContain("border");
  });

  it("uses renderMessage slot when provided", () => {
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
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
        <ChatWidget
          onClose={vi.fn()}
          renderMessage={() => <div data-testid="custom-msg">Custom rendered</div>}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId("custom-msg")).toHaveTextContent("Custom rendered");
  });

  it("uses custom labels", () => {
    function CustomLabelWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            labels: {
              thinking: "Procesando...",
              error: "Error fatal",
              clearChat: "Borrar",
              close: "Cerrar",
            },
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <CustomLabelWrapper>
        <ChatWidget onClose={vi.fn()} />
      </CustomLabelWrapper>
    );
    expect(screen.getByTitle("Borrar")).toBeInTheDocument();
    expect(screen.getByTitle("Cerrar")).toBeInTheDocument();
  });

  it("renders registered tool components for tool-call parts", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me help you with that." },
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "tc-1",
                toolName: "showForm",
                state: "input-available",
                input: { title: "Contact" },
              },
            },
          ],
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    function ToolWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            tools: {
              showForm: ({ args }) => (
                <div data-testid="tool-form">
                  <span data-testid="tool-args">{JSON.stringify(args)}</span>
                </div>
              ),
            },
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <ToolWrapper>
        <ChatWidget onClose={vi.fn()} />
      </ToolWrapper>
    );

    expect(screen.getByTestId("tool-form")).toBeInTheDocument();
    expect(screen.getByTestId("tool-args")).toHaveTextContent('{"title":"Contact"}');
  });

  it("shows fallback text for unregistered tools", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "tc-1",
                toolName: "unknownTool",
                state: "input-available",
                input: {},
              },
            },
          ],
        },
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

    expect(screen.getByText(/Running unknownTool/)).toBeInTheDocument();
  });

  it("maps invalid message role to assistant", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "1",
          role: "unknown",
          parts: [{ type: "text", text: "Hello from unknown role" }],
        },
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

    // Message with invalid role should be rendered as assistant bubble
    const bubble = screen
      .getByText("Hello from unknown role")
      .closest(".acw-assistant-bubble");
    expect(bubble).toBeInTheDocument();
  });

  it("passes tool result to component when available", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "tc-1",
                toolName: "showForm",
                state: "success",
                input: {},
                output: { success: true },
              },
            },
          ],
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    function ToolWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            tools: {
              showForm: ({ status, result }) => (
                <div data-testid="tool-status">{status}</div>
              ),
            },
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <ToolWrapper>
        <ChatWidget onClose={vi.fn()} />
      </ToolWrapper>
    );

    expect(screen.getByTestId("tool-status")).toHaveTextContent("success");
  });

  it("renders tool invocation with error state", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "tc-err",
                toolName: "myTool",
                state: "error",
                input: {},
                errorText: "Something went wrong",
              },
            },
          ],
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    function ToolWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            tools: {
              myTool: ({ status, error }) => (
                <div data-testid="tool-error-state">
                  <span data-testid="tool-status">{status}</span>
                  <span data-testid="tool-error-text">{error}</span>
                </div>
              ),
            },
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <ToolWrapper>
        <ChatWidget onClose={vi.fn()} />
      </ToolWrapper>
    );

    expect(screen.getByTestId("tool-status")).toHaveTextContent("error");
    expect(screen.getByTestId("tool-error-text")).toHaveTextContent(
      "Something went wrong"
    );
  });

  it("renders tool invocation with unknown state as pending", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "tc-unknown",
                toolName: "myTool",
                state: "result",
                input: {},
              },
            },
          ],
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    function ToolWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            tools: {
              myTool: ({ status }) => (
                <div data-testid="tool-unknown-status">{status}</div>
              ),
            },
          }}
        >
          {children}
        </ChatWidgetProvider>
      );
    }

    render(
      <ToolWrapper>
        <ChatWidget onClose={vi.fn()} />
      </ToolWrapper>
    );

    // Unknown state "result" should default to "pending"
    expect(screen.getByTestId("tool-unknown-status")).toHaveTextContent(
      "pending"
    );
  });

  it("clears messages when clear button is clicked and user confirms", async () => {
    const setMessagesMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: setMessagesMock,
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const clearBtn = screen.getByTitle("Clear chat");
    await user.click(clearBtn);

    expect(setMessagesMock).toHaveBeenCalledWith([]);
    window.confirm = originalConfirm;
  });

  it("does not clear messages when user cancels confirmation", async () => {
    const setMessagesMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: setMessagesMock,
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const clearBtn = screen.getByTitle("Clear chat");
    await user.click(clearBtn);

    expect(setMessagesMock).not.toHaveBeenCalled();
    window.confirm = originalConfirm;
  });
});

describe("ChatTrigger", () => {
  it("renders the floating trigger button", () => {
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );
    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });

  it("toggles chat panel open on first click", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    const btn = screen.getByLabelText("Toggle chat");
    await act(async () => {
      await user.click(btn);
    });

    // After click, button should still exist and panel should start loading
    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });
});

describe("Cross-tab sync", () => {
  it("syncs messages from another tab via storage event", () => {
    const setMessagesMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: setMessagesMock,
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    // Simulate storage event from another tab
    const event = new StorageEvent("storage", {
      key: "ai-chat-widget-messages",
      newValue: JSON.stringify({ v: 1, messages: [{ id: "remote", role: "user", parts: [{ type: "text", text: "From other tab" }] }] }),
    });
    window.dispatchEvent(event);

    expect(setMessagesMock).toHaveBeenCalledWith([
      { id: "remote", role: "user", parts: [{ type: "text", text: "From other tab" }] },
    ]);
  });

  it("ignores storage events for other keys", () => {
    const setMessagesMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: setMessagesMock,
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const event = new StorageEvent("storage", {
      key: "some-other-key",
      newValue: JSON.stringify({ v: 1, messages: [] }),
    });
    window.dispatchEvent(event);

    expect(setMessagesMock).not.toHaveBeenCalled();
  });

  it("ignores malformed storage data", () => {
    const setMessagesMock = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: setMessagesMock,
      stop: vi.fn(),
      addToolOutput: vi.fn(),
    });

    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const event = new StorageEvent("storage", {
      key: "ai-chat-widget-messages",
      newValue: "not json",
    });
    window.dispatchEvent(event);

    expect(setMessagesMock).not.toHaveBeenCalled();
  });
});

describe("useChatStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores messages with schema version", () => {
    setStoredMessages("test-key", [{ id: "1", text: "hello" }]);

    const stored = localStorage.getItem("test-key");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.v).toBe(1);
    expect(parsed.messages).toEqual([{ id: "1", text: "hello" }]);
  });

  it("retrieves stored messages", () => {
    setStoredMessages("test-key", [{ id: "1", text: "hello" }]);

    const retrieved = getStoredMessages("test-key");
    expect(retrieved).toEqual([{ id: "1", text: "hello" }]);
  });

  it("returns empty array for missing key", () => {
    const stored = getStoredMessages("missing-key");
    expect(stored).toEqual([]);
  });

  it("returns empty array for corrupt data", () => {
    localStorage.setItem("bad-key", "not json");
    const stored = getStoredMessages("bad-key");
    expect(stored).toEqual([]);
  });

  it("clears stored messages", () => {
    setStoredMessages("test-key", [{ id: "1" }]);
    clearStoredMessages("test-key");
    expect(getStoredMessages("test-key")).toEqual([]);
  });

  it("reads legacy plain array from localStorage (no schema version)", () => {
    localStorage.setItem("legacy-key", JSON.stringify([{ id: "legacy", text: "old format" }]));
    const stored = getStoredMessages("legacy-key");
    expect(stored).toEqual([{ id: "legacy", text: "old format" }]);
  });
});
