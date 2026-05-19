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
}

export const DEFAULT_CONFIG: Required<ChatWidgetConfig> = {
  apiEndpoint: "/api/chat",
  title: "Ask me anything",
  subtitle: "Powered by AI",
  placeholder: "Type a message...",
  emptyStateMessage: "Ask me anything — I'm here to help!",
  theme: {},
  storageKey: "ai-chat-widget",
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
