import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { ChatWidgetProvider } from "../provider";
import type { ChatWidgetConfig } from "../types";

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

function TestWrapper({ children, config = {} }: { children: ReactNode; config?: Partial<ChatWidgetConfig> }) {
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

  it("input has an associated label", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const input = screen.getByLabelText("Message input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "acw-message-input");
  });

  it("error message has role alert", async () => {
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

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/temporarily unavailable/);
  });

  it("focus cycles within the dialog with Tab", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details:not([disabled]), summary:not([disabled]), [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the last element
    last.focus();
    expect(document.activeElement).toBe(last);

    // Simulate Tab keydown on the dialog — should cycle to first
    fireEvent.keyDown(dialog, { key: "Tab", code: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it("focus cycles backward within the dialog with Shift+Tab", () => {
    render(
      <TestWrapper>
        <ChatWidget onClose={vi.fn()} />
      </TestWrapper>
    );

    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details:not([disabled]), summary:not([disabled]), [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the first element
    first.focus();
    expect(document.activeElement).toBe(first);

    // Simulate Shift+Tab keydown on the dialog — should cycle to last
    fireEvent.keyDown(dialog, { key: "Tab", code: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
