"use client";

import { useState, useRef, useCallback, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, X, Trash2 } from "lucide-react";
import { useChatWidgetConfig } from "../provider";
import { useChatStorage } from "../hooks/use-chat-storage";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import type { ChatWidgetMessage } from "../types";

function isValidRole(role: string): role is ChatWidgetMessage["role"] {
  return role === "user" || role === "assistant" || role === "system" || role === "data";
}

function mapUIMessage(msg: UIMessage): ChatWidgetMessage {
  return {
    id: msg.id,
    role: isValidRole(msg.role) ? msg.role : "assistant",
    parts: msg.parts as ChatWidgetMessage["parts"],
  };
}

interface ChatWidgetProps {
  onClose: () => void;
  onReady?: () => void;
  className?: string;
  style?: CSSProperties;
  renderMessage?: (message: ChatWidgetMessage) => ReactNode;
}

export function ChatWidget({ onClose, onReady, className, style, renderMessage }: ChatWidgetProps) {
  const {
    apiEndpoint,
    title,
    subtitle,
    placeholder,
    emptyStateMessage,
    storageKey,
    labels,
    tools,
  } = useChatWidgetConfig();

  const messagesKey = `${storageKey}-messages`;
  const { initialMessages, persist, clear } = useChatStorage(messagesKey);

  // Lazy initialization of transport (fix: no side effects during render)
  const [transport, setTransport] = useState(() => new DefaultChatTransport({ api: apiEndpoint }));
  useEffect(() => {
    setTransport(new DefaultChatTransport({ api: apiEndpoint }));
  }, [apiEndpoint]);

  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages, stop, addToolOutput } = useChat({
    transport,
    messages: initialMessages as UIMessage[],
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Debounced persistence of messages
  useEffect(() => {
    persist(messages);
  }, [messages, persist]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === messagesKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          // New format: { v: 1, messages: [...] }
          const msgs = parsed.v === 1 && Array.isArray(parsed.messages) ? parsed.messages : parsed;
          if (Array.isArray(msgs)) setMessages(msgs);
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ai-chat-widget] Failed to parse cross-tab storage event:", err);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [messagesKey, setMessages]);

  // Notify parent that the chunk has loaded (only once)
  const hasFiredReadyRef = useRef(false);
  useEffect(() => {
    if (!hasFiredReadyRef.current) {
      hasFiredReadyRef.current = true;
      onReady?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- should only fire once on mount
  }, []);

  // Focus trap + Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details:not([disabled]), summary:not([disabled]), [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleClear = () => {
    const shouldClear =
      typeof window === "undefined" ||
      typeof window.confirm !== "function" ||
      window.confirm("Are you sure you want to clear the chat history?");
    if (shouldClear) {
      setMessages([]);
      clear();
    }
  };

  const mappedMessages: ChatWidgetMessage[] = useMemo(() => messages.map(mapUIMessage), [messages]);

  return (
    <div
      className={`acw-chat-panel${className ? ` ${className}` : ""}`}
      style={style}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="acw-title"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="acw-header">
        <div className="acw-header-left">
          <div className="acw-icon-muted">
            <MessageCircle className="acw-h-4 acw-w-4" />
          </div>
          <div>
            <h3 id="acw-title" className="acw-title">{title}</h3>
            <p className="acw-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="acw-header-right">
          <button
            onClick={handleClear}
            className="acw-icon-btn"
            title={labels.clearChat}
            aria-label={labels.clearChat}
          >
            <Trash2 className="acw-h-4 acw-w-4" />
          </button>
          <button onClick={onClose} className="acw-icon-btn" title={labels.close} aria-label={labels.close}>
            <X className="acw-h-4 acw-w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={mappedMessages}
        labels={labels}
        emptyStateMessage={emptyStateMessage}
        tools={tools}
        addToolOutput={addToolOutput}
        isLoading={isLoading}
        error={error}
        renderMessage={renderMessage}
      />

      {/* Input */}
      <MessageInput
        input={input}
        setInput={setInput}
        placeholder={placeholder}
        isLoading={isLoading}
        isStreaming={status === "streaming"}
        onSubmit={handleSubmit}
        onStop={stop}
        label={labels.messageInputLabel}
        stopLabel={labels.stop}
      />
    </div>
  );
}
