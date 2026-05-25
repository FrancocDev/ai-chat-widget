"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import type { ChatWidgetMessage, ChatWidgetMessagePart, ChatWidgetTextPart, ChatWidgetToolPart, ToolComponent } from "../types";
import { MarkdownRenderer } from "./markdown-renderer";

function mapToolState(state: string): "pending" | "success" | "error" {
  switch (state) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "pending":
    case "input-available":
      return "pending";
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ai-chat-widget] Unknown tool state "${state}" mapped to "pending"`);
      }
      return "pending";
  }
}

interface MessageListProps {
  messages: ChatWidgetMessage[];
  labels: {
    thinking: string;
    error: string;
  };
  emptyStateMessage: string;
  tools: Record<string, ToolComponent>;
  addToolOutput: (params: { tool: string; toolCallId: string; output: unknown }) => void;
  isLoading: boolean;
  error: Error | null | undefined;
  renderMessage?: (message: ChatWidgetMessage) => ReactNode;
}

export function MessageList({
  messages,
  labels,
  emptyStateMessage,
  tools,
  addToolOutput,
  isLoading,
  error,
  renderMessage,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change (not on every status change)
  const prevLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="acw-messages" aria-live="polite" role="log" aria-label="Conversation messages">
      {messages.length === 0 && (
        <div className="acw-empty-state">
          <div className="acw-icon-muted acw-h-12 acw-w-12">
            <MessageCircle className="acw-h-6 acw-w-6" aria-hidden="true" />
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

        const isUser = message.role === "user";
        const text = message.parts
          .filter((part): part is ChatWidgetMessagePart & { type: "text" } => part.type === "text")
          .map((part) => part.text)
          .join("");

        if (isUser) {
          return (
            <div key={message.id} className="acw-message-row acw-user-row">
              <div className="acw-bubble acw-user-bubble">{text}</div>
            </div>
          );
        }

        // Assistant message — single pass over parts
        const textParts: string[] = [];
        const toolParts: ChatWidgetToolPart[] = [];
        for (const part of message.parts) {
          if (part.type === "text") {
            textParts.push(part.text);
          } else if (part.type === "tool-invocation") {
            toolParts.push(part);
          }
        }
        const assistantText = textParts.join("");

        return (
          <div key={message.id} className="acw-message-row acw-assistant-row">
            <div className="acw-bubble acw-assistant-bubble">
              {/* Text content */}
              {assistantText && <MarkdownRenderer text={assistantText} />}

              {/* Tool invocations */}
              {toolParts.map((part) => {
                const { toolCallId, toolName, state, input, output, errorText } = part.toolInvocation;
                const ToolComponent = tools[toolName];
                const toolStatus = mapToolState(state);

                if (!ToolComponent) {
                  return (
                    <div key={toolCallId} className="acw-tool-call-fallback">
                      Running {toolName}...
                    </div>
                  );
                }

                return (
                  <div key={toolCallId} className="acw-tool-call">
                    <ToolComponent
                      toolCallId={toolCallId}
                      args={input}
                      status={toolStatus}
                      result={output}
                      error={typeof errorText === "string" ? errorText : undefined}
                      addToolResult={(result) =>
                        addToolOutput({
                          tool: toolName,
                          toolCallId: toolCallId,
                          output: result,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {isLoading && lastMessage?.role !== "assistant" && (
        <div className="acw-message-row acw-assistant-row">
          <div className="acw-loading-bubble">
            <Loader2 className="acw-h-4 acw-w-4 acw-spinner" />
            <span>{labels.thinking}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="acw-message-row acw-assistant-row" role="alert" aria-live="assertive">
          <div className="acw-error-bubble">{labels.error}</div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
