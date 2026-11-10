import { useEffect, type ReactNode } from "react";
import { moveTvFocus } from "@mir-games/adapters-tv";
import type { InputPort } from "@mir-games/platform-contracts";

type Props = {
  input: InputPort;
  children: ReactNode;
};

/**
 * TV shell: marks focusable controls, wires InputPort dpad → stub spatial focus.
 */
export function TvShell({ input, children }: Props) {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) {
      return;
    }

    function markFocusable(): void {
      const candidates = root!.querySelectorAll<HTMLElement>(
        "button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])",
      );
      for (const el of candidates) {
        if ("disabled" in el && Boolean((el as HTMLButtonElement).disabled)) {
          continue;
        }
        el.setAttribute("data-tv-focusable", "");
        if (!el.hasAttribute("tabindex")) {
          el.setAttribute("tabindex", "0");
        }
      }
    }

    markFocusable();
    const mo = new MutationObserver(() => markFocusable());
    mo.observe(root, { childList: true, subtree: true });

    const unsubscribe = input.subscribe((event) => {
      if (event.kind !== "dpad" || !event.code) {
        return;
      }
      if (
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
      ) {
        moveTvFocus(event.code);
      }
    });

    // Initial focus for leanback.
    window.requestAnimationFrame(() => {
      const first = root.querySelector<HTMLElement>("[data-tv-focusable]");
      first?.focus();
    });

    return () => {
      mo.disconnect();
      unsubscribe();
    };
  }, [input]);

  return <div className="tv-shell">{children}</div>;
}
