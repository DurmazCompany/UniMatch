import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { applyAmbassador } from "../lib/monetization";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const ambassadorRouter = new Hono<HonoVars>();

ambassadorRouter.post(
  "/apply",
  zValidator(
    "json",
    z.object({
      university: z.string().min(1).max(120),
      faculty: z.string().min(1).max(120),
      year: z.string().min(1).max(20),
      motivation: z.string().min(20).max(2000),
      social_links: z.union([z.string(), z.record(z.string(), z.string())]).optional().nullable(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const body = c.req.valid("json");
    const socialLinks =
      body.social_links == null
        ? null
        : typeof body.social_links === "string"
        ? body.social_links
        : JSON.stringify(body.social_links);

    const application = await applyAmbassador(prisma, profile.id, {
      university: body.university,
      faculty: body.faculty,
      year: body.year,
      motivation: body.motivation,
      socialLinks,
    });
    return c.json({ data: application });
  }
);

ambassadorRouter.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const application = await prisma.ambassadorApplication.findUnique({ where: { userId: profile.id } });
  return c.json({ data: application });
});
