import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { calculateCompatibility } from "../lib/compatibility";
import { getBlockedUserIds } from "../middleware/privacy";

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

  // Parse advanced filter query params
  const hobbiesParam = c.req.query("hobbies"); // CSV: "music,sports"
  const yearParam = c.req.query("year"); // "1" | "2" | "3" | "4"
  const lifestyleParam = c.req.query("lifestyle"); // "morning" | "night"
  const hobbyList = hobbiesParam ? hobbiesParam.split(",").map(h => h.trim()) : [];
  const filterYear = yearParam ? parseInt(yearParam) : null;

  // Get IDs already swiped
  const swiped = await prisma.swipe.findMany({
    where: { swiperId: myProfile.id },
    select: { swipedId: true },
  });
  const swipedIds = swiped.map(s => s.swipedId);

  // Get blocked user IDs (both directions)
  const blockedUserIds = await getBlockedUserIds(user.id);
  // Convert profile-level blocked ids: get Profile.id for each blocked User.id
  const blockedProfiles = blockedUserIds.size > 0
    ? await prisma.profile.findMany({
        where: { userId: { in: Array.from(blockedUserIds) } },
        select: { id: true },
      })
    : [];
  const blockedProfileIds = blockedProfiles.map(p => p.id);

  // Build candidate filter — apply university filter by string match
  const excludeIds = [myProfile.id, ...swipedIds, ...blockedProfileIds];

  let candidates = await prisma.profile.findMany({
    where: {
      id: { notIn: excludeIds },
      ...(myProfile.university ? { university: myProfile.university } : {}),
    },
    take: 50,
    orderBy: { profilePower: "desc" },
  });

  // Filter by year
  if (filterYear) {
    candidates = candidates.filter(p => p.year === filterYear);
  }
  // Filter by lifestyle
  if (lifestyleParam) {
    candidates = candidates.filter(p => {
      const lifestyle = (() => { try { return JSON.parse(p.lifestyle || "{}"); } catch { return {}; } })();
      return lifestyle.schedule === lifestyleParam;
    });
  }
  // Filter by hobbies (at least 1 matching)
  if (hobbyList.length > 0) {
    candidates = candidates.filter(p => {
      const pHobbies: string[] = (() => { try { return JSON.parse(p.hobbies || "[]"); } catch { return []; } })();
      return hobbyList.some(h => pHobbies.includes(h));
    });
  }

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

  const now = new Date();
  const isActive = (p: { subscriptionTier: string; subscriptionExpiresAt: Date | null }) =>
    p.subscriptionTier !== "crush" && (!p.subscriptionExpiresAt || p.subscriptionExpiresAt > now);

  // Sort: premium tier + boost + profilePower + compatibility + random jitter for variety
  scored.sort((a, b) => {
    let priorityA = 0;
    let priorityB = 0;

    const aPremium = isActive(a);
    const bPremium = isActive(b);

    // Premium tier priority scoring
    if (aPremium && a.subscriptionTier === "flort") priorityA += 0.5;
    if (aPremium && a.subscriptionTier === "ask") priorityA += 1.0;
    if (a.boostUntil && a.boostUntil > now) priorityA += 2.0;

    if (bPremium && b.subscriptionTier === "flort") priorityB += 0.5;
    if (bPremium && b.subscriptionTier === "ask") priorityB += 1.0;
    if (b.boostUntil && b.boostUntil > now) priorityB += 2.0;

    const scoreA = priorityA + (aPremium ? 0.3 : 0) + a.profilePower * 0.007 + a.compatibilityScore * 0.005 + Math.random() * 0.1;
    const scoreB = priorityB + (bPremium ? 0.3 : 0) + b.profilePower * 0.007 + b.compatibilityScore * 0.005 + Math.random() * 0.1;
    return scoreB - scoreA;
  });

  return c.json({ data: scored.slice(0, 20) });
});
