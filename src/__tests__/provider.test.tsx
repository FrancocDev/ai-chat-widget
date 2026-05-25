import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(result.current.tools).toEqual({});
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

  it("merges tool overrides", () => {
    const mockTool = () => null;
    const { result } = renderHook(() => useChatWidgetConfig(), {
      wrapper: wrapper({
        tools: { myTool: mockTool },
      }),
    });
    expect(result.current.tools.myTool).toBe(mockTool);
  });

  it("renders children with merged config", () => {
    function Consumer() {
      const config = useChatWidgetConfig();
      return <div data-testid="title">{config.title}</div>;
    }

    render(
      <ChatWidgetProvider config={{ title: "Provider Test" }}>
        <Consumer />
      </ChatWidgetProvider>
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Provider Test");
  });
});
