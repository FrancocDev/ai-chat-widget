"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChatWidgetConfig } from "../provider";

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
}

export function ChatWidget({ onClose }: ChatWidgetProps) {
  const {
    apiEndpoint,
    title,
    subtitle,
    placeholder,
    emptyStateMessage,
    storageKey,
  } = useChatWidgetConfig();

  const messagesKey = `${storageKey}-messages`;
  const transport = useRef(
    new DefaultChatTransport({ api: apiEndpoint })
  ).current;

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessages] = useState(() => getStoredMessages(messagesKey));

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  }, [messages, messagesKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

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
    <div className="acw-chat-panel">
      {/* Header */}
      <div className="acw-header">
        <div className="acw-header-left">
          <div className="acw-icon-muted">
            <MessageCircle className="acw-h-4 acw-w-4" />
          </div>
          <div>
            <h3 className="acw-title">{title}</h3>
            <p className="acw-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="acw-header-right">
          <button
            onClick={handleClear}
            className="acw-icon-btn"
            title="Clear chat"
          >
            <Trash2 className="acw-h-4 acw-w-4" />
          </button>
          <button onClick={onClose} className="acw-icon-btn" title="Close">
            <X className="acw-h-4 acw-w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="acw-messages">
        {messages.length === 0 && (
          <div className="acw-empty-state">
            <div className="acw-icon-muted acw-h-12 acw-w-12">
              <MessageCircle className="acw-h-6 acw-w-6" />
            </div>
            <p>{emptyStateMessage}</p>
          </div>
        )}

        {messages.map((message) => {
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
                        code: ({ className, ...props }: any) =>
                          className ? (
                            <pre>
                              <code {...props} />
                            </pre>
                          ) : (
                            <code {...props} />
                          ),
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
                <span>Thinking...</span>
              </div>
            </div>
          )}

        {error && (
          <div className="acw-message-row acw-assistant-row">
            <div className="acw-error-bubble">
              Chat is temporarily unavailable. Please try again later.
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="acw-input-area">
        <input
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
        >
          <Send className="acw-h-3.5 acw-w-3.5" />
        </button>
      </form>
    </div>
  );
}
