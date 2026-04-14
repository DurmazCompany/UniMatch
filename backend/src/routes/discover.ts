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

  // Get candidates: all profiles except self and already swiped (no university filter for testing)
  const candidates = await prisma.profile.findMany({
    where: {
      id: { notIn: [myProfile.id, ...swipedIds] },
    },
    take: 20,
    orderBy: { profilePower: "desc" },
  });

  // Calculate compatibility score for each candidate
  const scored = candidates.map(candidate => {
    // Use lastSwipeDate for activity calculation, falling back to updatedAt
    const activityDate = candidate.lastSwipeDate ?? candidate.updatedAt;
    const compatibilityScore = calculateCompatibility(
      { hobbies: myProfile.hobbies, university: myProfile.university },
      {
        hobbies: candidate.hobbies,
        university: candidate.university,
        profilePower: candidate.profilePower,
        updatedAt: activityDate,
      }
    );

    return { ...candidate, compatibilityScore };
  });

  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return c.json({ data: scored });
});
