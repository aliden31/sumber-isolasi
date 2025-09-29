"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage key "${key}"`, error);
    }
    // we only want to run on mount when key changes
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to persist localStorage key "${key}"`, error);
    }
  }, [key, state]);

  return [state, setState] as const;
}
