import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { ChatWidgetProvider } from "../provider";
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

  it("renders the chat panel", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    expect(screen.getByText("Ask me anything")).toBeInTheDocument();
    expect(screen.getByText("Powered by AI")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
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

  it("renders send button", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );
    // Send button is the submit button
    const sendBtn = document.querySelector(".acw-send-btn");
    expect(sendBtn).toBeInTheDocument();
  });

  it("calls onClose when X button clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatWidget onClose={onClose} />
      </TestWrapper>
    );
    const closeBtn = screen.getByTitle("Close");
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows loading indicator when status is submitted", () => {
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

  it("shows error message when error is set", () => {
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

  it("disables input and send when streaming", () => {
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

  it("accepts className and style props", () => {
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
          renderMessage={(msg) => <div data-testid="custom-msg">Custom: {String(msg)}</div>}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId("custom-msg")).toBeInTheDocument();
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
    const addToolOutput = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me help you with that." },
            {
              type: "tool-showForm",
              toolCallId: "tc-1",
              state: "input-available",
              input: { title: "Contact" },
            } as any,
          ],
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
      setMessages: vi.fn(),
      stop: vi.fn(),
      addToolOutput,
    });

    function ToolWrapper({ children }: { children: ReactNode }) {
      return (
        <ChatWidgetProvider
          config={{
            tools: {
              showForm: ({ args, addToolResult }) => (
                <div data-testid="tool-form">
                  <span data-testid="tool-args">{JSON.stringify(args)}</span>
                  <button
                    data-testid="tool-submit"
                    onClick={() => addToolResult({ success: true })}
                  >
                    Submit
                  </button>
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
              type: "tool-unknownTool",
              toolCallId: "tc-1",
              state: "input-available",
              input: {},
            } as any,
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

  it("passes tool result to component when available", () => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "2",
          role: "assistant",
          parts: [
            {
              type: "tool-showForm",
              toolCallId: "tc-1",
              state: "success",
              input: {},
              output: { success: true },
            } as any,
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

  it("toggles button icon on click (starts closed)", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );
    // Initially shows MessageCircle icon (closed state)
    const btn = screen.getByLabelText("Toggle chat");
    expect(btn.querySelector("svg")).toBeInTheDocument();

    // Click — should trigger lazy load + open
    await act(async () => {
      await user.click(btn);
    });

    // After click, button should still exist
    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });
});
