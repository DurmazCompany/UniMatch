import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { sendGift, MonetizationError } from "../lib/monetization";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const giftsRouter = new Hono<HonoVars>();

giftsRouter.get("/catalog", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const gifts = await prisma.giftCatalog.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return c.json({ data: gifts });
});

giftsRouter.post(
  "/send",
  zValidator(
    "json",
    z.object({
      receiver_id: z.string().min(1),
      gift_id: z.string().min(1),
      match_id: z.string().optional().nullable(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const body = c.req.valid("json");
    try {
      const result = await sendGift(prisma, profile.id, body.receiver_id, body.gift_id, body.match_id ?? null);
      return c.json({ data: result });
    } catch (err) {
      if (err instanceof MonetizationError) {
        if (err.code === "INSUFFICIENT_COINS") {
          return c.json({ error: { message: "Insufficient coins", code: err.code } }, 402);
        }
        if (err.code === "GIFT_NOT_FOUND") {
          return c.json({ error: { message: "Gift not found", code: err.code } }, 404);
        }
        if (err.code === "MATCH_NOT_FOUND" || err.code === "MATCH_MISMATCH") {
          return c.json({ error: { message: "Invalid match", code: err.code } }, 422);
        }
      }
      throw err;
    }
  }
);

giftsRouter.get("/match/:matchId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const matchId = c.req.param("matchId");
  const gifts = await prisma.giftSent.findMany({
    where: {
      matchId,
      OR: [{ senderId: profile.id }, { receiverId: profile.id }],
    },
    include: { gift: true },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: gifts });
});

giftsRouter.get("/received", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 200);
  const received = await prisma.giftSent.findMany({
    where: { receiverId: profile.id },
    include: { gift: true, sender: { select: { id: true, name: true, photos: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return c.json({ data: received });
});
