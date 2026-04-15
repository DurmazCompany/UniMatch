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

// POST /use — Use a referral code
referralsRouter.post(
  "/use",
  zValidator(
    "json",
    z.object({
      code: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    const body = c.req.valid("json");

    // Cannot use your own code
    if (myProfile.referralCode === body.code) {
      return c.json({ error: { message: "Cannot use your own referral code", code: "SELF_REFERRAL" } }, 400);
    }

    // Find the inviter by referral code
    const inviterProfile = await prisma.profile.findFirst({
      where: { referralCode: body.code },
    });
    if (!inviterProfile) {
      return c.json({ error: { message: "Invalid referral code", code: "INVALID_CODE" } }, 400);
    }

    // Check if the invitee has already been referred (@@unique([invitedId]))
    const existingReferral = await prisma.referral.findUnique({
      where: { invitedId: myProfile.id },
    });
    if (existingReferral) {
      return c.json({ error: { message: "You have already used a referral code", code: "ALREADY_REFERRED" } }, 400);
    }

    // Create referral record and reward both parties in a transaction
    await prisma.$transaction([
      prisma.referral.create({
        data: {
          inviterId: inviterProfile.id,
          invitedId: myProfile.id,
          rewardGiven: true,
        },
      }),
      // Give inviter +1 superLikesLeft
      prisma.profile.update({
        where: { id: inviterProfile.id },
        data: { superLikesLeft: { increment: 1 } },
      }),
      // Give invitee +1 superLikesLeft as reward
      prisma.profile.update({
        where: { id: myProfile.id },
        data: { superLikesLeft: { increment: 1 } },
      }),
    ]);

    return c.json({ data: { success: true } });
  }
);
