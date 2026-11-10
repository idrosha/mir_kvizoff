import type { StoragePort } from "@mir-games/platform-contracts";

/**
 * UI cache only — not the source of truth for progress / economy.
 * Prefers localStorage when available; falls back to in-memory Map.
 */
export function createTelegramStorage(prefix = "mir-quizov:"): StoragePort {
  const memory = new Map<string, string>();
  const hasLocalStorage = typeof localStorage !== "undefined";

  function keyOf(key: string): string {
    return `${prefix}${key}`;
  }

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const k = keyOf(key);
      try {
        const raw = hasLocalStorage ? localStorage.getItem(k) : (memory.get(k) ?? null);
        if (raw === null) {
          return null;
        }
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async set<T = unknown>(key: string, value: T): Promise<void> {
      const k = keyOf(key);
      const raw = JSON.stringify(value);
      if (hasLocalStorage) {
        localStorage.setItem(k, raw);
      } else {
        memory.set(k, raw);
      }
    },
    async remove(key: string): Promise<void> {
      const k = keyOf(key);
      if (hasLocalStorage) {
        localStorage.removeItem(k);
      }
      memory.delete(k);
    },
    async clear(): Promise<void> {
      if (hasLocalStorage) {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (k?.startsWith(prefix)) {
            toRemove.push(k);
          }
        }
        for (const k of toRemove) {
          localStorage.removeItem(k);
        }
      }
      memory.clear();
    },
  };
}
