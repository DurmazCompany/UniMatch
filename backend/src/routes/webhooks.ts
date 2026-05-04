import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { env } from "../env";
import {
  PRODUCT_TO_TIER,
  COIN_PACKAGES,
  applySubscriptionFromWebhook,
  applyCancellationFromWebhook,
  creditCoins,
} from "../lib/monetization";

const webhooksRouter = new Hono();

const revenueCatEventSchema = z.object({
  api_version: z.string().optional(),
  event: z.object({
    id: z.string().optional(),
    type: z.string(),
    app_user_id: z.string(),
    original_app_user_id: z.string().optional(),
    product_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).optional(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().optional(),
    store: z.string().optional(),
    environment: z.string().optional(),
    is_family_share: z.boolean().optional(),
    presented_offering_id: z.string().optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    price_in_purchased_currency: z.number().optional(),
    subscriber_attributes: z.record(z.string(), z.any()).optional(),
    takehome_percentage: z.number().optional(),
  }),
});

const SUBSCRIPTION_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "RESTORE",
  "UNCANCELLATION",
]);
const CANCELLATION_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "SUBSCRIPTION_PAUSED",
]);

webhooksRouter.post(
  "/revenuecat",
  zValidator("json", revenueCatEventSchema),
  async (c) => {
    // Auth check
    if (env.REVENUECAT_WEBHOOK_SECRET) {
      const authHeader = c.req.header("authorization") ?? c.req.header("Authorization");
      const expected = `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`;
      if (authHeader !== expected) {
        return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
      }
    }

    const { event } = c.req.valid("json");
    const userId = event.app_user_id;
    const eventType = event.type;
    const productId = event.product_id ?? "";

    console.log(`[RevenueCat] event=${eventType} user=${userId} product=${productId}`);

    try {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (!profile) {
        // RC sends app_user_id which equals our user.id
        return c.json({ data: { received: true, processed: false, reason: "profile_not_found" } });
      }

      // Subscription product → tier upgrade
      if (SUBSCRIPTION_EVENTS.has(eventType) && PRODUCT_TO_TIER[productId]) {
        const { tier, days } = PRODUCT_TO_TIER[productId];
        await applySubscriptionFromWebhook(prisma, profile.id, tier, days, event.id ?? null);
        return c.json({ data: { received: true, processed: true, action: "subscription_applied", tier } });
      }

      // Consumable coin pack
      if (eventType === "NON_RENEWING_PURCHASE" && COIN_PACKAGES[productId]) {
        const amount = COIN_PACKAGES[productId];
        await creditCoins(prisma, profile.id, amount, "rc_purchase", "rc_event", event.id ?? null);
        return c.json({ data: { received: true, processed: true, action: "coins_credited", amount } });
      }

      // Cancellation/expiration
      if (CANCELLATION_EVENTS.has(eventType)) {
        await applyCancellationFromWebhook(prisma, profile.id);
        return c.json({ data: { received: true, processed: true, action: "subscription_cleared" } });
      }

      return c.json({ data: { received: true, processed: false, reason: "no_action" } });
    } catch (error) {
      console.error("[RevenueCat] error:", error);
      // Always 200 to avoid retry storms
      return c.json({ data: { received: true, processed: false, reason: "error" } });
    }
  }
);

export { webhooksRouter };
