"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, X, Send, Loader2, Trash2, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import py from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useChatWidgetConfig } from "../provider";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("jsx", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("tsx", ts);
SyntaxHighlighter.registerLanguage("python", py);
SyntaxHighlighter.registerLanguage("py", py);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", xml);
SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("sql", sql);

function getStoredMessages(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

interface ChatWidgetProps {
  onClose: () => void;
  onReady?: () => void;
  className?: string;
  style?: CSSProperties;
  renderMessage?: (message: ReturnType<typeof useChat>["messages"][number]) => ReactNode;
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
  } = useChatWidgetConfig();

  const messagesKey = `${storageKey}-messages`;
  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport({ api: apiEndpoint });
  }

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialMessages] = useState(() => getStoredMessages(messagesKey));

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: transportRef.current!,
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  }, [messages, messagesKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === messagesKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setMessages(parsed);
        } catch { /* ignore malformed storage */ }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [messagesKey, setMessages]);

  // Auto-focus input when panel opens
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Notify parent that the chunk has loaded
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Focus trap + Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(messagesKey);
  };

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
      <div className="acw-messages" aria-live="polite" role="log" aria-label="Conversation messages">
        {messages.length === 0 && (
          <div className="acw-empty-state">
            <div className="acw-icon-muted acw-h-12 acw-w-12">
              <MessageCircle className="acw-h-6 acw-w-6" />
            </div>
            <p>{emptyStateMessage}</p>
          </div>
        )}

        {messages.map((message) => {
          if (renderMessage) {
            return (
              <div key={message.id} className="acw-message-row">
                {renderMessage(message)}
              </div>
            );
          }

          const text = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");

          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`acw-message-row ${isUser ? "acw-user-row" : "acw-assistant-row"}`}
            >
              <div
                className={`acw-bubble ${isUser ? "acw-user-bubble" : "acw-assistant-bubble"}`}
              >
                {isUser ? (
                  text
                ) : (
                  <div className="acw-markdown">
                    <ReactMarkdown
                      components={{
                        a: ({ ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
                          const match = /language-(\w+)/.exec(className ?? "");
                          const codeStr = String(children).replace(/\n$/, "");
                          if (match) {
                            return (
                              <SyntaxHighlighter
                                language={match[1]}
                                style={docco}
                                PreTag="div"
                              >
                                {codeStr}
                              </SyntaxHighlighter>
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading &&
          messages[messages.length - 1]?.role !== "assistant" && (
            <div className="acw-message-row acw-assistant-row">
              <div className="acw-loading-bubble">
                <Loader2 className="acw-h-4 acw-w-4 acw-spinner" />
                <span>{labels.thinking}</span>
              </div>
            </div>
          )}

        {error && (
          <div className="acw-message-row acw-assistant-row">
            <div className="acw-error-bubble">
              {labels.error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="acw-input-area">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="acw-input"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="acw-send-btn"
          aria-label="Send message"
        >
          <Send className="acw-h-3.5 acw-w-3.5" />
        </button>
        {status === "streaming" && (
          <button
            type="button"
            onClick={() => stop()}
            className="acw-icon-btn acw-stop-btn"
            title={labels.stop}
            aria-label={labels.stop}
          >
            <Square className="acw-h-3.5 acw-w-3.5" />
          </button>
        )}
      </form>
    </div>
  );
}
