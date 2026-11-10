import type { InputEvent, InputPort } from "@mir-games/platform-contracts";

const DPAD_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  " ",
  "Escape",
  "Backspace",
]);

/**
 * InputPort stub for TV remote / gamepad / keyboard.
 * Emits dpad / key / back events; does not implement full spatial focus itself —
 * the tv-web shell uses these events + CSS :focus-visible for navigation smoke.
 */
export function createTvInput(): InputPort {
  const handlers = new Set<(event: InputEvent) => void>();
  let attached = false;

  function emit(event: InputEvent): void {
    for (const handler of handlers) {
      handler(event);
    }
  }

  function onKeyDown(ev: KeyboardEvent): void {
    if (!DPAD_KEYS.has(ev.key)) {
      return;
    }
    const atMs = Date.now();
    if (ev.key === "Escape" || ev.key === "Backspace") {
      emit({ kind: "back", code: ev.key, atMs });
      return;
    }
    if (
      ev.key === "ArrowUp" ||
      ev.key === "ArrowDown" ||
      ev.key === "ArrowLeft" ||
      ev.key === "ArrowRight"
    ) {
      emit({ kind: "dpad", code: ev.key, atMs });
      return;
    }
    emit({ kind: "key", code: ev.key === " " ? "Space" : ev.key, atMs });
  }

  function onGamepadPoll(): void {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      return;
    }
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      // Standard mapping: 12–15 dpad, 0 = A / confirm, 1 = B / back.
      const atMs = Date.now();
      if (pad.buttons[12]?.pressed) emit({ kind: "dpad", code: "ArrowUp", atMs });
      if (pad.buttons[13]?.pressed) emit({ kind: "dpad", code: "ArrowDown", atMs });
      if (pad.buttons[14]?.pressed) emit({ kind: "dpad", code: "ArrowLeft", atMs });
      if (pad.buttons[15]?.pressed) emit({ kind: "dpad", code: "ArrowRight", atMs });
      if (pad.buttons[0]?.pressed) emit({ kind: "key", code: "Enter", atMs });
      if (pad.buttons[1]?.pressed) emit({ kind: "back", code: "Escape", atMs });
    }
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function ensureAttached(): void {
    if (attached || typeof window === "undefined") {
      return;
    }
    attached = true;
    window.addEventListener("keydown", onKeyDown);
    // Low-rate gamepad stub poll (focus nav smoke only — not a full input stack).
    pollTimer = setInterval(onGamepadPoll, 120);
  }

  function maybeDetach(): void {
    if (!attached || handlers.size > 0 || typeof window === "undefined") {
      return;
    }
    attached = false;
    window.removeEventListener("keydown", onKeyDown);
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  return {
    subscribe(handler) {
      handlers.add(handler);
      ensureAttached();
      return () => {
        handlers.delete(handler);
        maybeDetach();
      };
    },
  };
}

/**
 * Move document focus among `[data-tv-focusable]` elements (stub spatial nav).
 * Called by the TV shell when InputPort emits dpad events.
 */
export function moveTvFocus(direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"): void {
  if (typeof document === "undefined") {
    return;
  }
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-tv-focusable]:not([disabled])"),
  ).filter((el) => !el.hasAttribute("aria-disabled"));
  if (nodes.length === 0) {
    return;
  }
  const active = document.activeElement as HTMLElement | null;
  let index = active ? nodes.indexOf(active) : -1;
  if (index < 0) {
    nodes[0]?.focus();
    return;
  }
  if (direction === "ArrowDown" || direction === "ArrowRight") {
    index = (index + 1) % nodes.length;
  } else {
    index = (index - 1 + nodes.length) % nodes.length;
  }
  nodes[index]?.focus();
}
