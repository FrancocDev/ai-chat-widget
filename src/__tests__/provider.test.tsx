import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { ChatWidgetProvider, useChatWidgetConfig } from "../provider";
import { DEFAULT_CONFIG } from "../types";
import type { ReactNode } from "react";

function wrapper(config: Record<string, unknown>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ChatWidgetProvider config={config}>{children}</ChatWidgetProvider>
    );
  };
}

describe("ChatWidgetProvider", () => {
  it("returns defaults when no config is passed", () => {
    const { result } = renderHook(() => useChatWidgetConfig(), {
      wrapper: wrapper({}),
    });
    expect(result.current.title).toBe(DEFAULT_CONFIG.title);
    expect(result.current.apiEndpoint).toBe(DEFAULT_CONFIG.apiEndpoint);
    expect(result.current.storageKey).toBe(DEFAULT_CONFIG.storageKey);
  });

  it("merges partial config with defaults", () => {
    const { result } = renderHook(() => useChatWidgetConfig(), {
      wrapper: wrapper({
        title: "Custom Title",
        subtitle: "Custom Subtitle",
      }),
    });
    expect(result.current.title).toBe("Custom Title");
    expect(result.current.subtitle).toBe("Custom Subtitle");
    expect(result.current.apiEndpoint).toBe(DEFAULT_CONFIG.apiEndpoint);
  });

  it("merges theme overrides", () => {
    const { result } = renderHook(() => useChatWidgetConfig(), {
      wrapper: wrapper({
        theme: { primary: "hsl(0 0% 0%)" },
      }),
    });
    expect(result.current.theme.primary).toBe("hsl(0 0% 0%)");
    expect(result.current.theme.muted).toBe(DEFAULT_CONFIG.theme.muted);
  });

  it("renders style tag with CSS", () => {
    const { result } = renderHook(() => useChatWidgetConfig(), {
      wrapper: wrapper({}),
    });
    const styleEl = document.querySelector("style[data-acw]");
    expect(styleEl).toBeInTheDocument();
    expect(styleEl!.textContent).toContain("--acw-primary");
    expect(styleEl!.textContent).toContain(".acw-chat-panel");
  });
});
