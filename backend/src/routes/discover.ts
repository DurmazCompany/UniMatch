import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { calculateCompatibility } from "../lib/compatibility";

export const discoverRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

discoverRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found" } }, 404);

  // Get IDs already swiped
  const swiped = await prisma.swipe.findMany({
    where: { swiperId: myProfile.id },
    select: { swipedId: true },
  });
  const swipedIds = swiped.map(s => s.swipedId);

  // Build candidate filter — apply university filter if the user has a universityId
  const excludeIds = [myProfile.id, ...swipedIds];

  const candidates = await prisma.profile.findMany({
    where: {
      id: { notIn: excludeIds },
      ...(myProfile.universityId ? { universityId: myProfile.universityId } : {}),
    },
    take: 20,
    orderBy: { profilePower: "desc" },
  });

  // Determine events the current user has joined this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const myParticipations = await prisma.eventParticipant.findMany({
    where: {
      profileId: myProfile.id,
      event: {
        date: { gte: weekAgo },
        isActive: true,
      },
    },
    select: { eventId: true },
  });
  const myEventIds = new Set(myParticipations.map(p => p.eventId));

  // Calculate compatibility score for each candidate
  const scored = await Promise.all(
    candidates.map(async candidate => {
      // Use lastSwipeDate for activity calculation, falling back to updatedAt
      const activityDate = candidate.lastSwipeDate ?? candidate.updatedAt;
      let compatibilityScore = calculateCompatibility(
        { hobbies: myProfile.hobbies, university: myProfile.university },
        {
          hobbies: candidate.hobbies,
          university: candidate.university,
          profilePower: candidate.profilePower,
          updatedAt: activityDate,
        }
      );

      // Event boost: +15 per shared event this week
      if (myEventIds.size > 0) {
        const sharedParticipations = await prisma.eventParticipant.findMany({
          where: {
            profileId: candidate.id,
            eventId: { in: Array.from(myEventIds) },
          },
          select: { eventId: true },
        });
        compatibilityScore += sharedParticipations.length * 15;
      }

      // Campus boost: +10 if candidate is on campus today
      if (candidate.isOnCampusToday) {
        compatibilityScore += 10;
      }

      // Cap at 100
      compatibilityScore = Math.min(100, compatibilityScore);

      return { ...candidate, compatibilityScore };
    })
  );

  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return c.json({ data: scored });
});
