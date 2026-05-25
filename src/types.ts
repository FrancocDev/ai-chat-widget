import type { ReactNode } from "react";
import type { Tool } from "ai";

/** Minimal message shape exposed by the widget.
 *  Decouples public API from @ai-sdk/react internals. */
export interface ChatWidgetMessage {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  parts: Array<ChatWidgetMessagePart>;
  /** @deprecated Use parts instead. */
  content?: string;
}

/** A text part of a chat message. */
export interface ChatWidgetTextPart {
  type: "text";
  text: string;
}

/** A tool invocation part of a chat message. */
export interface ChatWidgetToolPart {
  type: "tool-invocation";
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}

/** A part of a chat message. Text or tool invocation. */
export type ChatWidgetMessagePart = ChatWidgetTextPart | ChatWidgetToolPart;

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
  /** Aria label for the message input (default: "Message input") */
  messageInputLabel?: string;
}

/** Props passed to every registered tool component. */
export interface ToolComponentProps {
  /** The tool call ID from the AI model. */
  toolCallId: string;
  /** The arguments the model generated for this tool call. */
  args: unknown;
  /** Current execution status of the tool call. */
  status: "pending" | "success" | "error";
  /** Result returned after the tool executed (only when status is "success"). */
  result?: unknown;
  /** Error message if the tool execution failed (only when status is "error"). */
  error?: string;
  /** Call this to submit the tool result back to the AI model. */
  addToolResult: (result: unknown) => void;
}

/** A React component that renders a tool call inline in the chat. */
export type ToolComponent = React.FC<ToolComponentProps>;

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
  /** Registered tool components keyed by tool name. */
  tools?: Record<string, ToolComponent>;
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
  tools: Record<string, ToolComponent>;
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
    messageInputLabel: "Message input",
  },
  tools: {},
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
  /** Registered tools passed to the AI model. */
  tools?: Record<string, Tool>;
}
