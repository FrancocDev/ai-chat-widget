import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { ChatWidgetProvider } from "../provider";
import type { ReactNode } from "react";

const { mockUseChat } = vi.hoisted(() => ({
  mockUseChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
    error: null,
    setMessages: vi.fn(),
  })),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: mockUseChat,
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
