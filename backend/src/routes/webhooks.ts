import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

const webhooksRouter = new Hono();

// RevenueCat webhook event types
const revenueCatEventSchema = z.object({
  api_version: z.string().optional(),
  event: z.object({
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

// Events that grant premium access
const PREMIUM_GRANT_EVENTS = [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "RESTORE",
  "UNCANCELLATION",
];

// Events that revoke premium access
const PREMIUM_REVOKE_EVENTS = [
  "EXPIRATION",
  "CANCELLATION",
  "BILLING_ISSUE",
  "SUBSCRIPTION_PAUSED",
];

webhooksRouter.post(
  "/revenuecat",
  zValidator("json", revenueCatEventSchema),
  async (c) => {
    const { event } = c.req.valid("json");
    const userId = event.app_user_id;
    const eventType = event.type;

    console.log(`[RevenueCat] Received event: ${eventType} for user: ${userId}`);

    try {
      // Find the profile by userId
      const profile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        console.log(`[RevenueCat] Profile not found for user: ${userId}`);
        // Return 200 anyway so RevenueCat doesn't retry
        return c.json({ data: { received: true, processed: false, reason: "profile_not_found" } });
      }

      // Check if this event grants premium
      if (PREMIUM_GRANT_EVENTS.includes(eventType)) {
        const expirationMs = event.expiration_at_ms;
        const premiumUntil = expirationMs ? new Date(expirationMs) : null;
        const productId = event.product_id ?? "";

        // Build update data based on product ID
        const updateData: {
          isPremium?: boolean;
          premiumUntil?: Date | null;
          premiumTier?: string | null;
          boostUntil?: Date;
          superLikesLeft?: number;
        } = {
          isPremium: true,
          premiumUntil,
        };

        if (productId === "unimatch_flort_monthly") {
          updateData.isPremium = true;
          updateData.premiumTier = "flort";
          updateData.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (productId === "unimatch_ask_yearly") {
          updateData.isPremium = true;
          updateData.premiumTier = "ask";
          updateData.premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else if (productId === "unimatch_boost_1") {
          const currentBoostEnd = profile.boostUntil && profile.boostUntil > new Date() ? profile.boostUntil : new Date();
          updateData.boostUntil = new Date(currentBoostEnd.getTime() + 30 * 60 * 1000);
          // Boost purchases don't set premium
          delete updateData.isPremium;
          delete updateData.premiumUntil;
        } else if (productId === "unimatch_boost_3") {
          const currentBoostEnd = profile.boostUntil && profile.boostUntil > new Date() ? profile.boostUntil : new Date();
          updateData.boostUntil = new Date(currentBoostEnd.getTime() + 3 * 30 * 60 * 1000);
          delete updateData.isPremium;
          delete updateData.premiumUntil;
        } else if (productId === "unimatch_superlikes_5") {
          updateData.superLikesLeft = profile.superLikesLeft + 5;
          delete updateData.isPremium;
          delete updateData.premiumUntil;
        } else if (productId === "unimatch_superlikes_15") {
          updateData.superLikesLeft = profile.superLikesLeft + 15;
          delete updateData.isPremium;
          delete updateData.premiumUntil;
        } else if (productId === "unimatch_superlikes_30") {
          updateData.superLikesLeft = profile.superLikesLeft + 30;
          delete updateData.isPremium;
          delete updateData.premiumUntil;
        }

        await prisma.profile.update({
          where: { userId },
          data: updateData,
        });

        console.log(`[RevenueCat] Granted premium to user: ${userId}, until: ${premiumUntil}, product: ${productId}`);
        return c.json({ data: { received: true, processed: true, action: "premium_granted" } });
      }

      // Check if this event revokes premium
      if (PREMIUM_REVOKE_EVENTS.includes(eventType)) {
        await prisma.profile.update({
          where: { userId },
          data: {
            isPremium: false,
            premiumUntil: null,
            premiumTier: null,
          },
        });

        console.log(`[RevenueCat] Revoked premium from user: ${userId}`);
        return c.json({ data: { received: true, processed: true, action: "premium_revoked" } });
      }

      // Other events we acknowledge but don't act on
      console.log(`[RevenueCat] Event ${eventType} received but no action taken`);
      return c.json({ data: { received: true, processed: false, reason: "no_action_required" } });
    } catch (error) {
      console.error("[RevenueCat] Error processing webhook:", error);
      // Return 500 so RevenueCat retries
      return c.json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } }, 500);
    }
  }
);

export { webhooksRouter };
