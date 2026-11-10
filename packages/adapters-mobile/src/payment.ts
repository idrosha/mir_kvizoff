import type { PaymentPort, PaymentReceipt, PaymentResult } from "@mir-games/platform-contracts";
import type { ShopApiClient } from "@mir-games/adapters-web";

export type MobilePaymentOptions = {
  playerId: string;
  shopApi: ShopApiClient;
  /**
   * Play Billing path uses stub-play only — never real Play Console / Billing keys.
   * Receipts are synthesized with `stub:` prefix and confirmed on bot-server.
   */
  provider?: "stub-play";
};

/**
 * PaymentPort stub for Google Play Billing.
 * No BillingClient, no service account, no license keys in the client.
 */
export function createMobilePayment(options: MobilePaymentOptions): PaymentPort {
  const provider = options.provider ?? "stub-play";

  return {
    async purchase(productId: string, _payload?: unknown): Promise<PaymentResult> {
      // Future: Capacitor Purchases / Play Billing Library → purchaseToken.
      // Until then synthesize a stub receipt identical in shape to web/telegram stubs.
      const receiptId = `stub:play-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
          provider: receipt.provider || provider,
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
