import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { activateBoost, MonetizationError } from "../lib/monetization";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const boostsRouter = new Hono<HonoVars>();

boostsRouter.post(
  "/activate",
  zValidator(
    "json",
    z.object({
      use_subscription: z.boolean(),
      pack_size: z.union([z.literal(1), z.literal(3), z.literal(10)]).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const body = c.req.valid("json");
    try {
      const result = await activateBoost(prisma, profile.id, body.use_subscription, body.pack_size);
      return c.json({ data: result });
    } catch (err) {
      if (err instanceof MonetizationError) {
        if (err.code === "TIER_INSUFFICIENT" || err.code === "BOOST_QUOTA_EXCEEDED" || err.code === "INSUFFICIENT_COINS") {
          return c.json({ error: { message: err.code, code: err.code } }, 402);
        }
        if (err.code === "INVALID_PACK_SIZE") {
          return c.json({ error: { message: err.code, code: err.code } }, 422);
        }
      }
      throw err;
    }
  }
);

boostsRouter.get("/active", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const now = new Date();
  const active = profile.boostUntil && profile.boostUntil > now ? profile.boostUntil : null;
  return c.json({ data: { boost_active_until: active } });
});
