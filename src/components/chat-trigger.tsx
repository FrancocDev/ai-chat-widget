"use client";

import { useState, lazy, Suspense, useCallback, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { useChatWidgetConfig } from "../provider";

const ChatWidgetLazy = lazy(() =>
  import("./chat-widget").then((m) => ({ default: m.ChatWidget }))
);

export function ChatTrigger() {
  const config = useChatWidgetConfig();
  const uiKey = `${config.storageKey}-ui-state`;

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
    <div className="acw-trigger-wrapper">
      {loaded && isOpen && (
        <Suspense fallback={null}>
          <ChatWidgetLazy onClose={() => setIsOpen(false)} />
        </Suspense>
      )}

      <button
        onClick={handleToggle}
        className="acw-trigger-btn"
        aria-label="Toggle chat"
      >
        {isOpen && loaded ? (
          <X className="acw-h-5 acw-w-5" />
        ) : (
          <MessageCircle className="acw-h-5 acw-w-5" />
        )}
      </button>
    </div>
  );
}
