import { useState, useEffect, useRef, useCallback } from "react";

const SCHEMA_VERSION = 1;

interface StoredData {
  v: number;
  messages: unknown[];
}

function isValidStoredData(data: unknown): data is StoredData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return d.v === SCHEMA_VERSION && Array.isArray(d.messages);
}

export function getStoredMessages(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (isValidStoredData(parsed)) {
      return parsed.messages;
    }
    // Fallback: legacy plain array
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

export function setStoredMessages(key: string, messages: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    const data: StoredData = { v: SCHEMA_VERSION, messages };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota exceeded or private mode
  }
}

export function clearStoredMessages(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/** Hook that returns messages from localStorage and persists changes with a debounce. */
export function useChatStorage(key: string) {
  const [initialMessages] = useState<unknown[]>(() => getStoredMessages(key));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (messages: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setStoredMessages(key, messages);
      }, 500);
    },
    [key]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { initialMessages, persist, clear: () => clearStoredMessages(key) };
}
