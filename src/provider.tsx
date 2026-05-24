"use client";

import {
  createContext,
  useContext,
  useInsertionEffect,
  type ReactNode,
} from "react";
import type { ChatWidgetConfig, ResolvedChatWidgetConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { CHAT_WIDGET_CSS } from "./styles/css-string";

const ChatContext = createContext<ResolvedChatWidgetConfig>(DEFAULT_CONFIG);

export interface ChatWidgetProviderProps {
  config: Partial<ChatWidgetConfig>;
  children: ReactNode;
}

let cssInjected = false;

function StyleInjector() {
  useInsertionEffect(() => {
    if (cssInjected) return;
    cssInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-acw", "");
    style.textContent = CHAT_WIDGET_CSS;
    document.head.appendChild(style);
  }, []);
  return null;
}

export function ChatWidgetProvider({
  config,
  children,
}: ChatWidgetProviderProps) {
  const merged: ResolvedChatWidgetConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    theme: { ...DEFAULT_CONFIG.theme, ...config.theme },
    labels: { ...DEFAULT_CONFIG.labels, ...config.labels },
    tools: { ...DEFAULT_CONFIG.tools, ...config.tools },
  };

  return (
    <ChatContext.Provider value={merged}>
      <StyleInjector />
      {children}
    </ChatContext.Provider>
  );
}

export function useChatWidgetConfig(): ResolvedChatWidgetConfig {
  return useContext(ChatContext);
}
