import type {
  AccountSnapshotDto,
  ShopCatalogResponse,
  ShopCurrency,
} from "./shop-types.js";
import type { AvatarLoadout, EquipmentSlot } from "@mir-games/game-core";

export type ShopApiClient = {
  catalog(playerId?: string): Promise<ShopCatalogResponse>;
  account(playerId: string): Promise<AccountSnapshotDto>;
  buy(
    playerId: string,
    itemId: string,
    currency: ShopCurrency,
  ): Promise<AccountSnapshotDto>;
  equip(playerId: string, itemId: string): Promise<AccountSnapshotDto>;
  unequip(playerId: string, slot: EquipmentSlot): Promise<AccountSnapshotDto>;
  confirmReceipt(
    playerId: string,
    receipt: { provider: string; receiptId: string; productId: string },
  ): Promise<AccountSnapshotDto>;
  updateProfile(playerId: string, displayName: string): Promise<AccountSnapshotDto>;
  updateSettings(
    playerId: string,
    settings: { language?: string; soundEnabled?: boolean },
  ): Promise<AccountSnapshotDto>;
};

async function parseAccount(res: Response): Promise<AccountSnapshotDto> {
  const body = (await res.json()) as AccountSnapshotDto & { error?: string; account?: AccountSnapshotDto };
  if (!res.ok) {
    throw new Error(body.error ?? `Shop API ${res.status}`);
  }
  return body.account ?? body;
}

/**
 * Thin HTTP client for bot-server shop / account endpoints.
 * Server remains source of truth for economy and receipts.
 */
export function createShopApiClient(apiBaseUrl: string): ShopApiClient {
  return {
    async catalog(playerId) {
      const qs = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
      const res = await fetch(`${apiBaseUrl}/api/shop/catalog${qs}`);
      if (!res.ok) {
        throw new Error(`Shop catalog ${res.status}`);
      }
      return (await res.json()) as ShopCatalogResponse;
    },
    async account(playerId) {
      const res = await fetch(
        `${apiBaseUrl}/api/account?playerId=${encodeURIComponent(playerId)}`,
      );
      return parseAccount(res);
    },
    async buy(playerId, itemId, currency) {
      const res = await fetch(`${apiBaseUrl}/api/shop/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, itemId, currency }),
      });
      return parseAccount(res);
    },
    async equip(playerId, itemId) {
      const res = await fetch(`${apiBaseUrl}/api/shop/equip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, itemId }),
      });
      return parseAccount(res);
    },
    async unequip(playerId, slot) {
      const res = await fetch(`${apiBaseUrl}/api/shop/unequip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, slot }),
      });
      return parseAccount(res);
    },
    async confirmReceipt(playerId, receipt) {
      const res = await fetch(`${apiBaseUrl}/api/shop/confirm-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...receipt }),
      });
      return parseAccount(res);
    },
    async updateProfile(playerId, displayName) {
      const res = await fetch(`${apiBaseUrl}/api/account/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, displayName }),
      });
      return parseAccount(res);
    },
    async updateSettings(playerId, settings) {
      const res = await fetch(`${apiBaseUrl}/api/account/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...settings }),
      });
      return parseAccount(res);
    },
  };
}

export type { AvatarLoadout };
