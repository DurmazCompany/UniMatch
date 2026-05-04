import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { effectiveTier, TIER_LIMITS } from "../lib/monetization";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const walletRouter = new Hono<HonoVars>();

walletRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const balance = await prisma.coinBalance.findUnique({ where: { userId: profile.id } });
  const quota = await prisma.subscriptionQuota.findUnique({ where: { userId: profile.id } });

  const tier = effectiveTier(profile);
  const limits = TIER_LIMITS[tier];
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Daily likes left (crush only counts; premium is unlimited -> -1)
  let likesLeftToday: number;
  if (limits.dailyLikes === -1) {
    likesLeftToday = -1;
  } else {
    const lastSwipeDay = profile.lastSwipeDate ? new Date(profile.lastSwipeDate).toDateString() : null;
    const usedToday = lastSwipeDay === today.toDateString() ? profile.swipesToday : 0;
    likesLeftToday = Math.max(0, limits.dailyLikes - usedToday);
  }

  // Rewinds left today
  let rewindsLeftToday: number;
  if (limits.rewindsDaily === -1) {
    rewindsLeftToday = -1;
  } else if (limits.rewindsDaily === 0) {
    rewindsLeftToday = 0;
  } else {
    const anchor = quota?.rewindsDayAnchor;
    const sameDay = anchor && new Date(anchor).toDateString() === today.toDateString();
    const used = sameDay ? quota?.rewindsUsedToday ?? 0 : 0;
    rewindsLeftToday = Math.max(0, limits.rewindsDaily - used);
  }

  // Boosts left in period
  const boostsMonthly: number = limits.boostsMonthly;
  let boostsLeftPeriod: number;
  if (boostsMonthly === -1) {
    boostsLeftPeriod = -1;
  } else if (boostsMonthly === 0) {
    boostsLeftPeriod = 0;
  } else {
    const periodActive = quota?.periodEnd && quota.periodEnd > now;
    const used = periodActive ? quota?.boostsUsedPeriod ?? 0 : 0;
    boostsLeftPeriod = Math.max(0, boostsMonthly - used);
  }

  // Who-liked views left
  let whoLikedViewsLeft: number;
  if (limits.whoLikedMonthly === -1) {
    whoLikedViewsLeft = -1;
  } else if (limits.whoLikedMonthly === 0) {
    whoLikedViewsLeft = 0;
  } else {
    const periodActive = quota?.periodEnd && quota.periodEnd > now;
    const used = periodActive ? quota?.whoLikedViewsPeriod ?? 0 : 0;
    whoLikedViewsLeft = Math.max(0, limits.whoLikedMonthly - used);
  }

  const boostActiveUntil = profile.boostUntil && profile.boostUntil > now ? profile.boostUntil : null;

  return c.json({
    data: {
      coin_balance: balance?.balance ?? 0,
      tier,
      expires_at: profile.subscriptionExpiresAt,
      is_invisible: profile.isInvisible,
      is_banned: profile.isBanned,
      quotas: {
        likes_left_today: likesLeftToday,
        rewinds_left_today: rewindsLeftToday,
        boosts_left_period: boostsLeftPeriod,
        who_liked_views_left: whoLikedViewsLeft,
        boost_active_until: boostActiveUntil,
      },
    },
  });
});
