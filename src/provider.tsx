"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ChatWidgetConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { CHAT_WIDGET_CSS } from "./styles/css-string";

const ChatContext = createContext<Required<ChatWidgetConfig>>(DEFAULT_CONFIG);

export interface ChatWidgetProviderProps {
  config: Partial<ChatWidgetConfig>;
  children: ReactNode;
}

export function ChatWidgetProvider({
  config,
  children,
}: ChatWidgetProviderProps) {
  const merged: Required<ChatWidgetConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    theme: { ...DEFAULT_CONFIG.theme, ...config.theme },
  };

  return (
    <ChatContext.Provider value={merged}>
      <style data-acw="">{CHAT_WIDGET_CSS}</style>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatWidgetConfig(): Required<ChatWidgetConfig> {
  return useContext(ChatContext);
}
