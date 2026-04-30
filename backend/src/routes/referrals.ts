import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const referralsRouter = new Hono<HonoVars>();

// GET /my-code — Return the current user's referral code
referralsRouter.get("/my-code", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  return c.json({ data: { code: myProfile.referralCode } });
});

// GET /stats — How many people the current user has referred
referralsRouter.get("/stats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const count = await prisma.referral.count({
    where: { inviterId: myProfile.id, rewardGiven: true },
  });

  return c.json({
    data: {
      referralCode: myProfile.referralCode,
      referralCount: count,
      isPremium: myProfile.isPremium,
      premiumUntil: myProfile.premiumUntil,
    },
  });
});

// POST /use — Use a referral code (legacy, kept for compat)
referralsRouter.post(
  "/use",
  zValidator("json", z.object({ code: z.string().min(1) })),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const body = c.req.valid("json");

    if (myProfile.referralCode === body.code) {
      return c.json({ error: { message: "Cannot use your own referral code", code: "SELF_REFERRAL" } }, 400);
    }

    const inviterProfile = await prisma.profile.findFirst({
      where: { referralCode: body.code },
    });
    if (!inviterProfile) {
      return c.json({ error: { message: "Invalid referral code", code: "INVALID_CODE" } }, 400);
    }

    const existingReferral = await prisma.referral.findUnique({
      where: { invitedId: myProfile.id },
    });
    if (existingReferral) {
      return c.json({ error: { message: "You have already used a referral code", code: "ALREADY_REFERRED" } }, 400);
    }

    await prisma.$transaction([
      prisma.referral.create({
        data: { inviterId: inviterProfile.id, invitedId: myProfile.id, rewardGiven: true },
      }),
      prisma.profile.update({
        where: { id: inviterProfile.id },
        data: { superLikesLeft: { increment: 1 } },
      }),
      prisma.profile.update({
        where: { id: myProfile.id },
        data: { superLikesLeft: { increment: 1 } },
      }),
    ]);

    return c.json({ data: { success: true } });
  }
);

// POST /apply — Apply a referral code with premium rewards
referralsRouter.post(
  "/apply",
  zValidator("json", z.object({ referralCode: z.string().min(1) })),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const { referralCode } = c.req.valid("json");

    if (myProfile.referralCode === referralCode) {
      return c.json({ error: { message: "Kendi referral kodunu kullanamazsın", code: "SELF_REFERRAL" } }, 400);
    }

    const inviterProfile = await prisma.profile.findFirst({
      where: { referralCode },
    });
    if (!inviterProfile) {
      return c.json({ error: { message: "Geçersiz referral kodu", code: "INVALID_CODE" } }, 400);
    }

    const existingReferral = await prisma.referral.findUnique({
      where: { invitedId: myProfile.id },
    });
    if (existingReferral) {
      return c.json({ error: { message: "Daha önce bir referral kodu kullandın", code: "ALREADY_REFERRED" } }, 400);
    }

    const now = new Date();

    // Inviter gets +7 days premium (stacks on top of existing)
    const inviterPremiumBase =
      inviterProfile.isPremium && inviterProfile.premiumUntil && inviterProfile.premiumUntil > now
        ? inviterProfile.premiumUntil
        : now;
    const inviterNewPremiumUntil = new Date(inviterPremiumBase.getTime() + 7 * 24 * 60 * 60 * 1000);

    // New user gets +3 days premium
    const myPremiumBase =
      myProfile.isPremium && myProfile.premiumUntil && myProfile.premiumUntil > now
        ? myProfile.premiumUntil
        : now;
    const myNewPremiumUntil = new Date(myPremiumBase.getTime() + 3 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.referral.create({
        data: { inviterId: inviterProfile.id, invitedId: myProfile.id, rewardGiven: true },
      }),
      prisma.profile.update({
        where: { id: inviterProfile.id },
        data: { isPremium: true, premiumUntil: inviterNewPremiumUntil },
      }),
      prisma.profile.update({
        where: { id: myProfile.id },
        data: { isPremium: true, premiumUntil: myNewPremiumUntil },
      }),
    ]);

    return c.json({
      data: {
        success: true,
        premiumUntil: myNewPremiumUntil,
        daysGranted: 3,
      },
    });
  }
);
