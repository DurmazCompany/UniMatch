import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { randomUUID } from "crypto";
import { calculateCompatibility } from "../lib/compatibility";
import { sendPushNotification } from "../lib/push";

const swipeSchema = z.object({
  targetProfileId: z.string().min(1),
  direction: z.enum(["like", "pass", "super"])
});

export const swipesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Generate ice breaker question based on profiles
function generateIceBreaker(profile1: { hobbies?: string | null }, profile2: { hobbies?: string | null }): string {
  const hobbies1: string[] = JSON.parse(profile1.hobbies || "[]");
  const hobbies2: string[] = JSON.parse(profile2.hobbies || "[]");
  const shared = hobbies1.filter(h => hobbies2.includes(h));

  if (shared.length > 0) {
    return `İkiniz de ${shared[0]} ile ilgileniyorsunuz — nasıl başladın?`;
  }

  return "Kampüste en çok hangi kafeteryada zaman geçiriyorsun?";
}

swipesRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json();
  const result = swipeSchema.safeParse(body);

  if (!result.success) {
    return c.json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.issues
      }
    }, 400);
  }

  const { targetProfileId, direction } = result.data;

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found" } }, 404);

  // Check daily swipe limit (15 for free users)
  const today = new Date().toDateString();
  const lastSwipeDay = myProfile.lastSwipeDate ? new Date(myProfile.lastSwipeDate).toDateString() : null;

  if (lastSwipeDay !== today) {
    await prisma.profile.update({
      where: { id: myProfile.id },
      data: { swipesToday: 0, lastSwipeDate: new Date() },
    });
    myProfile.swipesToday = 0;
  }

  if (myProfile.swipesToday >= 15) {
    return c.json({ error: { message: "Daily swipe limit reached", code: "LIMIT_REACHED" } }, 429);
  }

  // Record swipe
  await prisma.swipe.upsert({
    where: { swiperId_swipedId: { swiperId: myProfile.id, swipedId: targetProfileId } },
    update: { direction },
    create: { id: randomUUID(), swiperId: myProfile.id, swipedId: targetProfileId, direction },
  });

  // Update streak
  let newStreak = myProfile.streakCount;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastStreakDay = myProfile.lastStreakDate ? new Date(myProfile.lastStreakDate).toDateString() : null;
  if (lastStreakDay !== today) {
    if (lastStreakDay === yesterday.toDateString()) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  await prisma.profile.update({
    where: { id: myProfile.id },
    data: {
      swipesToday: myProfile.swipesToday + 1,
      lastSwipeDate: new Date(),
      streakCount: newStreak,
      lastStreakDate: new Date(),
    },
  });

  // Check for mutual match
  let match = null;
  if (direction === "like" || direction === "super") {
    const theirSwipe = await prisma.swipe.findFirst({
      where: {
        swiperId: targetProfileId,
        swipedId: myProfile.id,
        direction: { in: ["like", "super"] },
      },
    });

    if (theirSwipe) {
      // Check no existing match
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: myProfile.id, user2Id: targetProfileId },
            { user1Id: targetProfileId, user2Id: myProfile.id },
          ],
        },
      });

      if (!existingMatch) {
        const theirProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
        const iceBreaker = generateIceBreaker(myProfile, theirProfile ?? {});

        // Calculate actual compatibility score
        const activityDate = theirProfile?.lastSwipeDate ?? theirProfile?.updatedAt ?? new Date();
        const compatibilityScore = theirProfile
          ? calculateCompatibility(
              { hobbies: myProfile.hobbies, university: myProfile.university },
              {
                hobbies: theirProfile.hobbies,
                university: theirProfile.university,
                profilePower: theirProfile.profilePower,
                updatedAt: activityDate,
              }
            )
          : 50;

        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        match = await prisma.match.create({
          data: {
            id: randomUUID(),
            user1Id: myProfile.id,
            user2Id: targetProfileId,
            expiresAt,
            iceBreakerQuestion: iceBreaker,
            compatibilityScore,
          },
          include: {
            user1: true,
            user2: true,
          },
        });

        // Send push notifications to both users
        const isSuperMatch = direction === "super" || theirSwipe.direction === "super";

        if (myProfile.pushToken) {
          if (isSuperMatch) {
            sendPushNotification(
              myProfile.pushToken,
              "⭐ Süper Eşleşme!",
              `${theirProfile?.name ?? "Biri"} seni süper beğendi ve eşleştiniz! 🎉`,
              { type: "match", matchId: match.id }
            );
          } else {
            sendPushNotification(
              myProfile.pushToken,
              "💕 Yeni Eşleşme!",
              `${theirProfile?.name ?? "Biri"} ile eşleştin! Hemen merhaba de 👋`,
              { type: "match", matchId: match.id }
            );
          }
        }
        if (theirProfile?.pushToken) {
          if (isSuperMatch) {
            sendPushNotification(
              theirProfile.pushToken,
              "⭐ Süper Eşleşme!",
              `${myProfile.name} seni süper beğendi ve eşleştiniz! 🎉`,
              { type: "match", matchId: match.id }
            );
          } else {
            sendPushNotification(
              theirProfile.pushToken,
              "💕 Yeni Eşleşme!",
              `${myProfile.name} ile eşleştin! Hemen merhaba de 👋`,
              { type: "match", matchId: match.id }
            );
          }
        }
      }
    }
  }

  // Send super-like notification if no match was created
  if (direction === "super" && !match) {
    const theirProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
    if (theirProfile?.pushToken) {
      // Only notify if they haven't already matched (double check)
      const alreadyMatched = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: myProfile.id, user2Id: targetProfileId },
            { user1Id: targetProfileId, user2Id: myProfile.id },
          ],
        },
      });
      if (!alreadyMatched) {
        sendPushNotification(
          theirProfile.pushToken,
          "⭐ Biri Seni Süper Beğendi!",
          "Keşfet'e bak, belki eşleşirsiniz ✨",
          { type: "super_like" }
        );
      }
    }
  }

  return c.json({ data: { match, swipesLeft: 15 - myProfile.swipesToday - 1 } });
});
