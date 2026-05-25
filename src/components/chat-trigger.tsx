"use client";

import React, { useState, lazy, Suspense, useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MessageCircle, X, Loader2, AlertCircle } from "lucide-react";
import { useChatWidgetConfig } from "../provider";

const ChatWidgetLazy = lazy(() =>
  import("./chat-widget").then((m) => ({ default: m.ChatWidget }))
);

interface LazyErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
}

class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.();
    if (process.env.NODE_ENV !== "production") {
      console.error("[ai-chat-widget] Failed to load chat widget chunk:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function ChatLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="acw-chat-panel acw-error-panel" role="alert" aria-live="assertive">
      <AlertCircle className="acw-h-6 acw-w-6" aria-hidden="true" />
      <p>Failed to load chat. Please try again.</p>
      <button type="button" onClick={onRetry} className="acw-icon-btn" aria-label="Retry loading chat">
        Retry
      </button>
    </div>
  );
}

export function ChatTrigger({ className, style }: { className?: string; style?: CSSProperties }) {
  const config = useChatWidgetConfig();
  const { storageKey, labels } = config;
  const uiKey = `${storageKey}-ui-state`;

  // Always initialize to false to avoid hydration mismatch
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [chunkLoaded, setChunkLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Read localStorage after mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(uiKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.isOpen === "boolean") {
          setIsOpen(parsed.isOpen);
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, [uiKey]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleReady = useCallback(() => {
    setChunkLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(uiKey, JSON.stringify({ isOpen }));
  }, [isOpen, uiKey]);

  const handleToggle = useCallback(() => {
    if (!loaded) {
      setLoaded(true);
      setIsOpen(true);
      return;
    }
    setIsOpen((prev) => !prev);
  }, [loaded]);

  const handleRetry = useCallback(() => {
    setChunkLoaded(false);
    setLoaded(false);
    setRetryKey((k) => k + 1);
    requestAnimationFrame(() => {
      setLoaded(true);
      setIsOpen(true);
    });
  }, []);

  return (
    <div className={`acw-trigger-wrapper${className ? ` ${className}` : ""}`} style={style}>
      {loaded && isOpen && (
        <Suspense
          fallback={
            <div className="acw-chat-panel acw-loading-panel">
              <Loader2 className="acw-h-6 acw-w-6 acw-spinner" aria-hidden="true" />
            </div>
          }
        >
          <LazyErrorBoundary
            key={retryKey}
            fallback={<ChatLoadError onRetry={handleRetry} />}
          >
            <ChatWidgetLazy onClose={handleClose} onReady={handleReady} />
          </LazyErrorBoundary>
        </Suspense>
      )}

      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="acw-trigger-btn"
        aria-label={labels.toggleChat}
      >
        {isOpen && chunkLoaded ? (
          <X className="acw-h-5 acw-w-5" aria-hidden="true" />
        ) : isOpen && !chunkLoaded ? (
          <Loader2 className="acw-h-5 acw-w-5 acw-spinner" aria-hidden="true" />
        ) : (
          <MessageCircle className="acw-h-5 acw-w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
