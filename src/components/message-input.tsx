"use client";

import { useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  placeholder: string;
  isLoading: boolean;
  isStreaming: boolean;
  onSubmit: () => void;
  onStop: () => void;
  label?: string;
  stopLabel?: string;
}

export function MessageInput({
  input,
  setInput,
  placeholder,
  isLoading,
  isStreaming,
  onSubmit,
  onStop,
  label = "Message input",
  stopLabel = "Stop",
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const isSendDisabled = isLoading || !input.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendDisabled) return;
    onSubmit();
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="acw-input-area">
      <label htmlFor="acw-message-input" className="acw-sr-only">
        {label}
      </label>
      <input
        id="acw-message-input"
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
        disabled={isSendDisabled}
        className="acw-send-btn"
        aria-label="Send message"
      >
        <Send className="acw-h-3.5 acw-w-3.5" aria-hidden="true" />
      </button>
      {isStreaming && (
        <button
          type="button"
          onClick={onStop}
          className="acw-icon-btn acw-stop-btn"
          title={stopLabel}
          aria-label={stopLabel}
        >
          <Square className="acw-h-3.5 acw-w-3.5" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
