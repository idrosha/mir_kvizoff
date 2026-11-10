import type { PaymentPort, PaymentReceipt, PaymentResult } from "@mir-games/platform-contracts";
import type { ShopApiClient } from "./shop-client.js";

export type WebPaymentOptions = {
  playerId: string;
  shopApi: ShopApiClient;
  /** stub-web | stub-telegram — never real payment secrets. */
  provider?: "stub-web" | "stub-telegram";
};

/**
 * PaymentPort stub: synthesizes stub: receipts and confirms them on bot-server.
 * No Telegram Stars / IAP secrets in the client.
 */
export function createWebPayment(options: WebPaymentOptions): PaymentPort {
  const provider = options.provider ?? "stub-web";

  return {
    async purchase(productId: string, _payload?: unknown): Promise<PaymentResult> {
      const receiptId = `stub:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        await options.shopApi.confirmReceipt(options.playerId, {
          provider,
          receiptId,
          productId,
        });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    },
    async confirmReceipt(receipt: PaymentReceipt): Promise<PaymentResult> {
      try {
        await options.shopApi.confirmReceipt(options.playerId, {
          provider: receipt.provider,
          receiptId: receipt.receiptId,
          productId: receipt.productId,
        });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}
