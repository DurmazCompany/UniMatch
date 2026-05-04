import type { Context, Next } from "hono";
import { prisma } from "../prisma";
import { effectiveTier, type Tier } from "../lib/monetization";

export function requireRole(allowed: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);
    if (!allowed.includes(profile.role)) {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }
    c.set("profile", profile);
    await next();
  };
}

export function requireTier(allowed: Tier[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);
    const tier = effectiveTier(profile);
    if (!allowed.includes(tier)) {
      return c.json({ error: { message: "Tier insufficient", code: "TIER_INSUFFICIENT" } }, 402);
    }
    c.set("profile", profile);
    await next();
  };
}
