export interface ChatWidgetTheme {
  /** Primary brand color (HSL) */
  primary?: string;
  /** Muted background color (HSL) */
  muted?: string;
  /** Card/surface background color (HSL) */
  card?: string;
  /** Border color (HSL) */
  border?: string;
  /** Main text color (HSL) */
  foreground?: string;
  /** Secondary text color (HSL) */
  mutedForeground?: string;
  /** Text color on primary backgrounds (HSL) */
  primaryForeground?: string;
  /** Page background color (HSL) */
  background?: string;
  /** Destructive/error color (HSL) */
  destructive?: string;
  /** Focus ring color (HSL) */
  ring?: string;
}

export interface ChatWidgetLabels {
  /** Loading indicator text (default: "Thinking...") */
  thinking?: string;
  /** Error message shown to the user (default: "Chat is temporarily unavailable. Please try again later.") */
  error?: string;
  /** Aria label for the toggle chat button (default: "Toggle chat") */
  toggleChat?: string;
  /** Tooltip for the clear chat button (default: "Clear chat") */
  clearChat?: string;
  /** Tooltip for the close panel button (default: "Close") */
  close?: string;
  /** Stop generating button (default: "Stop") */
  stop?: string;
}

export interface ChatWidgetConfig {
  /** API endpoint for streaming chat (default: "/api/chat") */
  apiEndpoint?: string;
  /** Title shown in the chat header */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Placeholder text for the message input */
  placeholder?: string;
  /** Message shown when there are no messages yet */
  emptyStateMessage?: string;
  /** CSS custom property overrides for theming */
  theme?: ChatWidgetTheme;
  /** localStorage key prefix */
  storageKey?: string;
  /** Override built-in UI text labels */
  labels?: ChatWidgetLabels;
}

/** Resolved config with all defaults applied — theme props remain optional. */
export interface ResolvedChatWidgetConfig {
  apiEndpoint: string;
  title: string;
  subtitle: string;
  placeholder: string;
  emptyStateMessage: string;
  theme: ChatWidgetTheme;
  storageKey: string;
  labels: Required<ChatWidgetLabels>;
}

export const DEFAULT_CONFIG: ResolvedChatWidgetConfig = {
  apiEndpoint: "/api/chat",
  title: "Ask me anything",
  subtitle: "Powered by AI",
  placeholder: "Type a message...",
  emptyStateMessage: "Ask me anything — I'm here to help!",
  theme: {},
  storageKey: "ai-chat-widget",
  labels: {
    thinking: "Thinking...",
    error: "Chat is temporarily unavailable. Please try again later.",
    toggleChat: "Toggle chat",
    clearChat: "Clear chat",
    close: "Close",
    stop: "Stop",
  },
};

export interface ChatRouteConfig {
  /** API key for the AI provider */
  apiKey: string;
  /** Base URL for the AI provider (default: OpenAI) */
  baseURL?: string;
  /** Model ID to use */
  model?: string;
  /** System prompt — static string or async function */
  systemPrompt: string | (() => string | Promise<string>);
}
