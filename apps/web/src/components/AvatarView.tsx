import type { AvatarLoadout } from "@mir-games/game-core";

type Props = {
  loadout: AvatarLoadout;
  /** Compact chip for play HUD vs larger on map. */
  size?: "sm" | "md" | "lg";
  label?: string;
};

/**
 * Always-visible player avatar (product rule 2026-11-04).
 * Equipped cosmetics drive data-* attributes for CSS colors / layers.
 */
export function AvatarView({ loadout, size = "md", label = "Вы" }: Props) {
  const eq = loadout.equipped;
  const slots = Object.entries(eq);
  return (
    <div className={`avatar avatar-${size}`} aria-label={`Аватар: ${label}`}>
      <div
        className="avatar-figure"
        aria-hidden="true"
        data-hat={eq.hat ?? ""}
        data-glasses={eq.glasses ?? ""}
        data-shirt={eq.shirt ?? ""}
        data-sweater={eq.sweater ?? ""}
        data-accessory={eq.accessory ?? ""}
        data-pants={eq.pants ?? ""}
        data-shoes={eq.shoes ?? ""}
      >
        <div className="avatar-head" />
        <div className="avatar-torso" />
        <div className="avatar-sweater" />
        <div className="avatar-legs" />
        <div className="avatar-feet" />
        {eq.hat ? <div className="avatar-hat" /> : null}
        {eq.glasses ? <div className="avatar-glasses" /> : null}
        {eq.accessory ? <div className="avatar-accessory" /> : null}
      </div>
      <div className="avatar-meta">
        <span className="avatar-label">{label}</span>
        <ul className="avatar-slots">
          {slots.length === 0 ? (
            <li className="avatar-slot muted">без экипировки</li>
          ) : (
            slots.map(([slot, itemId]) => (
              <li key={slot} className="avatar-slot" title={itemId}>
                <span className="avatar-slot-name">{slot}</span>
                <span className="avatar-slot-id">{itemId}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
