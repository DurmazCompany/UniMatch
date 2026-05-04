import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { effectiveTier, TIER_LIMITS } from "../lib/monetization";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const usersRouter = new Hono<HonoVars>();

usersRouter.patch(
  "/visibility",
  zValidator("json", z.object({ is_invisible: z.boolean() })),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const tier = effectiveTier(profile);
    if (!TIER_LIMITS[tier].invisibility) {
      return c.json({ error: { message: "Invisibility requires Aşk tier", code: "TIER_INSUFFICIENT" } }, 402);
    }

    const { is_invisible } = c.req.valid("json");
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: { isInvisible: is_invisible },
    });
    return c.json({ data: { is_invisible: updated.isInvisible } });
  }
);
