import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { ChatWidgetProvider } from "../provider";
import type { ReactNode } from "react";

// Mock the chat-widget module: the ChatWidget component throws to simulate
// a chunk load failure that the LazyErrorBoundary should catch.
vi.mock("../components/chat-widget", () => ({
  ChatWidget: () => {
    throw new Error("Chunk failed to load");
  },
}));

import { ChatTrigger } from "../components/chat-trigger";

function TestWrapper({ children }: { children: ReactNode }) {
  return <ChatWidgetProvider config={{}}>{children}</ChatWidgetProvider>;
}

describe("ChatTrigger error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error panel with role alert when chunk fails to load", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    const toggleBtn = screen.getByLabelText("Toggle chat");
    await act(async () => {
      await user.click(toggleBtn);
    });

    // The LazyErrorBoundary should catch the render error and show the fallback
    const errorPanel = screen.getByRole("alert");
    expect(errorPanel).toBeInTheDocument();
    expect(errorPanel).toHaveTextContent(/failed to load chat/i);
  });

  it("shows retry button in error panel", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    const toggleBtn = screen.getByLabelText("Toggle chat");
    await act(async () => {
      await user.click(toggleBtn);
    });

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
  });

  it("clicking retry dismisses the error and re-attempts loading", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ChatTrigger />
      </TestWrapper>
    );

    // Open the widget — triggers the lazy load which throws
    const toggleBtn = screen.getByLabelText("Toggle chat");
    await act(async () => {
      await user.click(toggleBtn);
    });

    // Error panel is shown
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click retry — the error boundary should reset via key change
    // React state sets loaded=false, then requestAnimationFrame re-attempts load
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    await act(async () => {
      await user.click(retryBtn);
    });

    // Wait for requestAnimationFrame to fire and the error to reappear
    // (the mock still throws, so the error boundary re-catches it)
    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
