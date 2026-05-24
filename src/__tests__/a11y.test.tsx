import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { ChatWidgetProvider } from "../provider";

expect.extend(toHaveNoViolations);

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

describe("Accessibility", () => {
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

  it("ChatWidget has no axe violations", async () => {
    const { container } = render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ChatWidget has dialog role and aria-modal", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const panel = screen.getByRole("dialog");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAttribute("aria-labelledby", "acw-title");
  });

  it("ChatWidget messages area has aria-live polite", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const messages = screen.getByRole("log");
    expect(messages).toHaveAttribute("aria-live", "polite");
    expect(messages).toHaveAttribute("aria-label", "Conversation messages");
  });

  it("ChatTrigger button has aria-label", () => {
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    expect(screen.getByLabelText("Toggle chat")).toBeInTheDocument();
  });

  it("input has accessible label via placeholder", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("uses custom aria-label from labels config", () => {
    render(
      <TestWrapper
        config={{
          labels: { toggleChat: "Abrir asistente virtual" },
        }}
      >
        <ChatTrigger />
      </TestWrapper>
    );

    expect(screen.getByLabelText("Abrir asistente virtual")).toBeInTheDocument();
  });
});
