import type { LifecycleEvent, LifecycleHandler, LifecyclePort } from "@mir-games/platform-contracts";

/** Document visibility + pageshow/pagehide bridge. */
export function createTelegramLifecycle(): LifecyclePort {
  const handlers = new Set<LifecycleHandler>();

  function emit(event: LifecycleEvent): void {
    for (const handler of handlers) {
      handler(event);
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      emit(document.hidden ? "hide" : "show");
      emit(document.hidden ? "blur" : "focus");
      emit(document.hidden ? "pause" : "resume");
    });
  }

  return {
    subscribe(handler: LifecycleHandler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}
