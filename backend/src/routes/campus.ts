import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

export const campusRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/campus/im-here - "I'm on campus today" button
campusRouter.post("/im-here", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found" } }, 404);

  const today = new Date().toDateString();
  const lastDay = profile.onCampusTodayDate ? new Date(profile.onCampusTodayDate).toDateString() : null;

  if (lastDay === today) {
    return c.json({ error: { message: "Already marked as on campus today" } }, 400);
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { isOnCampusToday: true, onCampusTodayDate: new Date() },
  });

  return c.json({ data: { success: true } });
});

// GET /api/campus/who-liked-me - returns blurred list (free) or full list (premium)
campusRouter.get("/who-liked-me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found" } }, 404);

  const swipers = await prisma.swipe.findMany({
    where: { swipedId: myProfile.id, direction: { in: ["like", "super"] } },
    include: { swiper: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Check if user has active premium
  const isPremiumActive = myProfile.isPremium &&
    (!myProfile.premiumUntil || new Date(myProfile.premiumUntil) > new Date());

  if (isPremiumActive) {
    // Premium user: return full swiper profiles
    return c.json({
      data: {
        isPremium: true,
        likers: swipers.map(s => ({
          id: s.swiper.id,
          name: s.swiper.name,
          photos: JSON.parse(s.swiper.photos || "[]"),
          department: s.swiper.department,
          year: s.swiper.year,
          profilePower: s.swiper.profilePower,
        })),
        count: swipers.length,
      }
    });
  }

  // Not premium: return blurred/limited data
  return c.json({
    data: {
      isPremium: false,
      likers: swipers.slice(0, 3).map(() => ({
        id: "hidden",
        photos: ["blur"],
        department: "???",
        year: null,
      })),
      count: swipers.length,
    }
  });
});
