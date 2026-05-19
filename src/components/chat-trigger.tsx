"use client";

import { useState, lazy, Suspense, useCallback, useEffect, useRef, type CSSProperties } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { useChatWidgetConfig } from "../provider";

const ChatWidgetLazy = lazy(() =>
  import("./chat-widget").then((m) => ({ default: m.ChatWidget }))
);

export function ChatTrigger({ className, style }: { className?: string; style?: CSSProperties }) {
  const config = useChatWidgetConfig();
  const { storageKey, labels } = config;
  const uiKey = `${storageKey}-ui-state`;

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(uiKey);
      return stored ? JSON.parse(stored).isOpen : false;
    } catch {
      return false;
    }
  });

  const [loaded, setLoaded] = useState(false);
  const [chunkLoaded, setChunkLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className={`acw-trigger-wrapper${className ? ` ${className}` : ""}`} style={style}>
      {loaded && isOpen && (
        <Suspense
          fallback={
            <div className="acw-chat-panel acw-loading-panel">
              <Loader2 className="acw-h-6 acw-w-6 acw-spinner" />
            </div>
          }
        >
          <ChatWidgetLazy onClose={handleClose} onReady={handleReady} />
        </Suspense>
      )}

      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="acw-trigger-btn"
        aria-label={labels.toggleChat}
      >
        {isOpen && chunkLoaded ? (
          <X className="acw-h-5 acw-w-5" />
        ) : isOpen && !chunkLoaded ? (
          <Loader2 className="acw-h-5 acw-w-5 acw-spinner" />
        ) : (
          <MessageCircle className="acw-h-5 acw-w-5" />
        )}
      </button>
    </div>
  );
}
