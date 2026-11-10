import type { PaymentPort, PaymentReceipt, PaymentResult } from "@mir-games/platform-contracts";
import type { ShopApiClient } from "./shop-client.js";

export type TelegramPaymentOptions = {
  playerId: string;
  shopApi: ShopApiClient;
  provider?: "stub-web" | "stub-telegram";
};

/**
 * PaymentPort stub for Mini App — confirms stub: receipts on bot-server.
 * No real Telegram Stars / payment secrets in the client.
 */
export function createTelegramPayment(options: TelegramPaymentOptions): PaymentPort {
  const provider = options.provider ?? "stub-telegram";

  return {
    async purchase(productId: string): Promise<PaymentResult> {
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
