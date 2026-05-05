import type { PrismaClient, Prisma } from "@prisma/client";

export type Tier = "crush" | "flort" | "ask";

type ProfileForTier = {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  ambassadorGrantedAt: Date | null;
};

export function isPremiumActive(profile: ProfileForTier): boolean {
  if (profile.subscriptionTier === "crush") return false;
  if (profile.ambassadorGrantedAt) return true;
  if (!profile.subscriptionExpiresAt) return false;
  return profile.subscriptionExpiresAt > new Date();
}

export function effectiveTier(profile: ProfileForTier): Tier {
  if (!isPremiumActive(profile)) return "crush";
  return profile.subscriptionTier as Tier;
}

export const TIER_LIMITS = {
  crush: { dailyLikes: 10, rewindsDaily: 0, boostsMonthly: 0, whoLikedMonthly: 0, monthlyCredit: 0, invisibility: false },
  flort: { dailyLikes: -1, rewindsDaily: 3, boostsMonthly: 3, whoLikedMonthly: 10, monthlyCredit: 2000, invisibility: false },
  ask:   { dailyLikes: -1, rewindsDaily: -1, boostsMonthly: 10, whoLikedMonthly: -1, monthlyCredit: 5000, invisibility: true },
} as const;

export const COIN_PACKAGES: Record<string, number> = {
  coins_400: 550,
  coins_750: 900,
  coins_1700: 2800,
};

export const BOOST_COIN_COST: Record<number, number> = { 1: 750, 3: 2000, 10: 6000 };
export const BOOST_DURATION_MIN = 30;

export const PRODUCT_TO_TIER: Record<string, { tier: Tier; days: number }> = {
  unimatch_flort_monthly: { tier: "flort", days: 30 },
  unimatch_ask_monthly: { tier: "ask", days: 30 },
  unimatch_ask_yearly: { tier: "ask", days: 365 },
};

export class MonetizationError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

type Tx = Prisma.TransactionClient;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date | null | undefined, b: Date): boolean {
  if (!a) return false;
  return a.toDateString() === b.toDateString();
}

async function spendCoinsTx(
  tx: Tx,
  userId: string,
  amount: number,
  reason: string,
  refType: string | null = null,
  refId: string | null = null
): Promise<void> {
  if (amount <= 0) throw new MonetizationError("INVALID_AMOUNT");
  const balance = await tx.coinBalance.findUnique({ where: { userId } });
  const current = balance?.balance ?? 0;
  if (current < amount) throw new MonetizationError("INSUFFICIENT_COINS");
  await tx.coinBalance.upsert({
    where: { userId },
    create: { userId, balance: -amount + current /* fallback impossible */ },
    update: { balance: { decrement: amount } },
  });
  await tx.coinLedger.create({
    data: { userId, delta: -amount, reason, refType, refId },
  });
}

async function creditCoinsTx(
  tx: Tx,
  userId: string,
  amount: number,
  reason: string,
  refType: string | null = null,
  refId: string | null = null
): Promise<void> {
  if (amount <= 0) return;
  await tx.coinBalance.upsert({
    where: { userId },
    create: { userId, balance: amount },
    update: { balance: { increment: amount } },
  });
  await tx.coinLedger.create({
    data: { userId, delta: amount, reason, refType, refId },
  });
}

export async function spendCoins(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  reason: string,
  refType: string | null = null,
  refId: string | null = null
) {
  return prisma.$transaction((tx) => spendCoinsTx(tx, userId, amount, reason, refType, refId));
}

export async function creditCoins(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  reason: string,
  refType: string | null = null,
  refId: string | null = null
) {
  return prisma.$transaction((tx) => creditCoinsTx(tx, userId, amount, reason, refType, refId));
}

export async function sendGift(
  prisma: PrismaClient,
  senderId: string,
  receiverId: string,
  giftId: string,
  matchId?: string | null
) {
  if (matchId) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MonetizationError("MATCH_NOT_FOUND");
    const ok =
      (match.user1Id === senderId && match.user2Id === receiverId) ||
      (match.user2Id === senderId && match.user1Id === receiverId);
    if (!ok) throw new MonetizationError("MATCH_MISMATCH");
  }
  const gift = await prisma.giftCatalog.findUnique({ where: { id: giftId } });
  if (!gift || !gift.isActive) throw new MonetizationError("GIFT_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const created = await tx.giftSent.create({
      data: {
        senderId,
        receiverId,
        giftId,
        matchId: matchId ?? null,
        coinCost: gift.coinCost,
      },
    });
    await spendCoinsTx(tx, senderId, gift.coinCost, "gift_sent", "gift", created.id);
    const balance = await tx.coinBalance.findUnique({ where: { userId: senderId } });
    return { gift: created, newBalance: balance?.balance ?? 0 };
  });
}

async function ensureQuota(tx: Tx, userId: string) {
  const existing = await tx.subscriptionQuota.findUnique({ where: { userId } });
  if (existing) return existing;
  return tx.subscriptionQuota.create({ data: { userId } });
}

export async function activateBoost(
  prisma: PrismaClient,
  userId: string,
  useSubscription: boolean,
  packSize?: 1 | 3 | 10
) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new MonetizationError("PROFILE_NOT_FOUND");
  const tier = effectiveTier(profile);

  return prisma.$transaction(async (tx) => {
    let source: "subscription" | "coin";
    let pack: 1 | 3 | 10;

    if (useSubscription) {
      if (tier === "crush") throw new MonetizationError("TIER_INSUFFICIENT");
      const quota = await ensureQuota(tx, userId);
      const now = new Date();
      let periodStart = quota.periodStart;
      let periodEnd = quota.periodEnd;
      let boostsUsed = quota.boostsUsedPeriod;
      if (!periodEnd || periodEnd < now) {
        periodStart = now;
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        boostsUsed = 0;
      }
      const limit: number = TIER_LIMITS[tier].boostsMonthly;
      if (limit !== -1 && boostsUsed >= limit) {
        throw new MonetizationError("BOOST_QUOTA_EXCEEDED");
      }
      await tx.subscriptionQuota.update({
        where: { userId },
        data: {
          periodStart,
          periodEnd,
          boostsUsedPeriod: boostsUsed + 1,
        },
      });
      source = "subscription";
      pack = 1;
    } else {
      if (!packSize || ![1, 3, 10].includes(packSize)) {
        throw new MonetizationError("INVALID_PACK_SIZE");
      }
      pack = packSize;
      const cost = BOOST_COIN_COST[pack] ?? 0;
      await spendCoinsTx(tx, userId, cost, "boost_purchase", "boost", null);
      source = "coin";
    }

    const now = new Date();
    const durationMs = pack * BOOST_DURATION_MIN * 60 * 1000;
    const baseEnd =
      profile.boostUntil && profile.boostUntil > now ? profile.boostUntil : now;
    const newBoostUntil = new Date(baseEnd.getTime() + durationMs);

    await tx.profile.update({
      where: { id: userId },
      data: { boostUntil: newBoostUntil },
    });

    await tx.boostLedger.create({
      data: {
        userId,
        source,
        durationMinutes: pack * BOOST_DURATION_MIN,
        expiresAt: newBoostUntil,
      },
    });

    return { boostUntil: newBoostUntil };
  });
}

export async function consumeRewind(prisma: PrismaClient, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new MonetizationError("PROFILE_NOT_FOUND");
  const tier = effectiveTier(profile);
  if (tier === "crush") throw new MonetizationError("TIER_INSUFFICIENT");

  return prisma.$transaction(async (tx) => {
    const quota = await ensureQuota(tx, userId);
    const today = startOfToday();
    let used = quota.rewindsUsedToday;
    let anchor = quota.rewindsDayAnchor;
    if (!isSameDay(anchor, today)) {
      used = 0;
      anchor = today;
    }
    const limit = TIER_LIMITS[tier].rewindsDaily;
    if (limit !== -1 && used >= limit) {
      throw new MonetizationError("REWIND_QUOTA_EXCEEDED");
    }
    await tx.subscriptionQuota.update({
      where: { userId },
      data: { rewindsUsedToday: used + 1, rewindsDayAnchor: anchor },
    });
    return {
      rewindsLeftToday: limit === -1 ? -1 : limit - (used + 1),
    };
  });
}

export async function viewWhoLiked(prisma: PrismaClient, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new MonetizationError("PROFILE_NOT_FOUND");
  const tier = effectiveTier(profile);
  if (tier === "crush") throw new MonetizationError("TIER_INSUFFICIENT");

  return prisma.$transaction(async (tx) => {
    const quota = await ensureQuota(tx, userId);
    const now = new Date();
    let periodStart = quota.periodStart;
    let periodEnd = quota.periodEnd;
    let used = quota.whoLikedViewsPeriod;
    if (!periodEnd || periodEnd < now) {
      periodStart = now;
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      used = 0;
    }
    const limit = TIER_LIMITS[tier].whoLikedMonthly;
    if (limit !== -1 && used >= limit) {
      throw new MonetizationError("WHO_LIKED_QUOTA_EXCEEDED");
    }
    await tx.subscriptionQuota.update({
      where: { userId },
      data: { periodStart, periodEnd, whoLikedViewsPeriod: used + 1 },
    });
    return {
      viewsLeft: limit === -1 ? -1 : limit - (used + 1),
    };
  });
}

export async function grantMonthlyCredits(
  prisma: PrismaClient,
  userId: string,
  tier: Tier
) {
  const amount = TIER_LIMITS[tier].monthlyCredit;
  if (amount > 0) {
    await creditCoins(prisma, userId, amount, "monthly_credit", "subscription", null);
  }
}

async function grantMonthlyCreditsTx(tx: Tx, userId: string, tier: Tier) {
  const amount = TIER_LIMITS[tier].monthlyCredit;
  if (amount > 0) {
    await creditCoinsTx(tx, userId, amount, "monthly_credit", "subscription", null);
  }
}

export type AmbassadorFields = {
  university: string;
  faculty: string;
  year: string;
  motivation: string;
  socialLinks?: string | null;
};

export async function applyAmbassador(
  prisma: PrismaClient,
  userId: string,
  fields: AmbassadorFields
) {
  const existing = await prisma.ambassadorApplication.findUnique({ where: { userId } });
  if (existing) {
    return prisma.ambassadorApplication.update({
      where: { userId },
      data: {
        university: fields.university,
        faculty: fields.faculty,
        year: fields.year,
        motivation: fields.motivation,
        socialLinks: fields.socialLinks ?? null,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    });
  }
  return prisma.ambassadorApplication.create({
    data: {
      userId,
      university: fields.university,
      faculty: fields.faculty,
      year: fields.year,
      motivation: fields.motivation,
      socialLinks: fields.socialLinks ?? null,
      status: "pending",
    },
  });
}

export async function approveAmbassador(
  prisma: PrismaClient,
  adminId: string,
  applicationId: string
) {
  return prisma.$transaction(async (tx) => {
    const app = await tx.ambassadorApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new MonetizationError("APPLICATION_NOT_FOUND");
    const updated = await tx.ambassadorApplication.update({
      where: { id: applicationId },
      data: {
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
    await tx.profile.update({
      where: { id: app.userId },
      data: {
        role: "ambassador",
        subscriptionTier: "ask",
        subscriptionExpiresAt: null,
        ambassadorGrantedAt: new Date(),
      },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        actionType: "approve_ambassador",
        targetUserId: app.userId,
        details: JSON.stringify({ applicationId }),
      },
    });
    return updated;
  });
}

export async function revokeAmbassador(
  prisma: PrismaClient,
  adminId: string,
  userId: string,
  reason: string
) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new MonetizationError("PROFILE_NOT_FOUND");
    const data: Prisma.ProfileUpdateInput = { role: "user" };
    if (profile.subscriptionExpiresAt === null && profile.ambassadorGrantedAt) {
      data.subscriptionTier = "crush";
      data.ambassadorGrantedAt = null;
    }
    await tx.profile.update({ where: { id: userId }, data });
    await tx.adminAction.create({
      data: {
        adminId,
        actionType: "revoke_ambassador",
        targetUserId: userId,
        details: JSON.stringify({ reason }),
      },
    });
  });
}

export async function banUser(
  prisma: PrismaClient,
  adminId: string,
  userId: string,
  reason: string,
  until?: Date | null
) {
  return prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason,
        bannedUntil: until ?? null,
      },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        actionType: "ban",
        targetUserId: userId,
        details: JSON.stringify({ reason, until: until?.toISOString() ?? null }),
      },
    });
  });
}

export async function unbanUser(
  prisma: PrismaClient,
  adminId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: userId },
      data: { isBanned: false, banReason: null, bannedUntil: null },
    });
    await tx.adminAction.create({
      data: { adminId, actionType: "unban", targetUserId: userId },
    });
  });
}

export async function grantPremiumManual(
  prisma: PrismaClient,
  adminId: string,
  userId: string,
  tier: Tier,
  until: Date
) {
  return prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: userId },
      data: { subscriptionTier: tier, subscriptionExpiresAt: until },
    });
    if (tier === "flort" || tier === "ask") {
      await grantMonthlyCreditsTx(tx, userId, tier);
    }
    await tx.adminAction.create({
      data: {
        adminId,
        actionType: "grant_premium",
        targetUserId: userId,
        details: JSON.stringify({ tier, until: until.toISOString() }),
      },
    });
  });
}

// Webhook helper: apply RC subscription event atomically.
export async function applySubscriptionFromWebhook(
  prisma: PrismaClient,
  userId: string,
  tier: Tier,
  durationDays: number,
  rcEventId: string | null
) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({ where: { id: userId } });
    const previousTier = (profile?.subscriptionTier ?? "crush") as Tier;
    const expires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await tx.profile.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: expires,
      },
    });
    if (tier !== previousTier && (tier === "flort" || tier === "ask")) {
      await grantMonthlyCreditsTx(tx, userId, tier);
    }
    if (rcEventId) {
      await tx.adminAction.create({
        data: {
          adminId: userId,
          actionType: "rc_subscription",
          targetUserId: userId,
          details: JSON.stringify({ tier, expires: expires.toISOString(), rcEventId }),
        },
      });
    }
  });
}

export async function applyCancellationFromWebhook(
  prisma: PrismaClient,
  userId: string
) {
  await prisma.profile.update({
    where: { id: userId },
    data: {
      subscriptionTier: "crush",
      subscriptionExpiresAt: null,
      isInvisible: false,
    },
  });
}
