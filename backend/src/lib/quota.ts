import { prisma } from "../prisma";
import { getActiveTier, isPremiumActive, PERIOD_DAYS, TIER_LIMITS } from "./wallet";
import type { SubscriptionTier } from "./wallet";

export type QuotaErrorCode =
  | "PREMIUM_REQUIRED"
  | "REWIND_LIMIT"
  | "WHO_LIKED_LIMIT";

export class QuotaError extends Error {
  constructor(
    public code: QuotaErrorCode,
    message: string,
    public limit?: number,
    public used?: number,
  ) {
    super(message);
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date | null | undefined, b: Date): boolean {
  if (!a) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

async function ensureQuota(userId: string, now: Date) {
  const existing = await prisma.subscriptionQuota.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.subscriptionQuota.create({
    data: {
      userId,
      periodStart: now,
      periodEnd: new Date(now.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

export type ConsumeResult = {
  tier: SubscriptionTier;
  used: number;
  limit: number;
};

export async function consumeRewind(
  profileId: string,
  now: Date = new Date(),
): Promise<ConsumeResult> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Profile not found");

  if (!isPremiumActive(profile, now)) {
    throw new QuotaError(
      "PREMIUM_REQUIRED",
      "Geri alma özelliği premium üyeler içindir.",
    );
  }

  const tier = getActiveTier(profile, now);
  const limit = TIER_LIMITS[tier].rewindsPerDay;
  const quota = await ensureQuota(profileId, now);

  const sameDay = isSameDay(quota.rewindsDayAnchor ?? null, now);
  const used = sameDay ? quota.rewindsUsedToday : 0;

  if (limit !== -1 && used >= limit) {
    throw new QuotaError(
      "REWIND_LIMIT",
      "Günlük geri alma limitine ulaştın.",
      limit,
      used,
    );
  }

  await prisma.subscriptionQuota.update({
    where: { userId: profileId },
    data: {
      rewindsUsedToday: used + 1,
      rewindsDayAnchor: now,
    },
  });

  return { tier, used: used + 1, limit };
}

export async function consumeWhoLikedView(
  profileId: string,
  now: Date = new Date(),
): Promise<ConsumeResult> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Profile not found");

  if (!isPremiumActive(profile, now)) {
    throw new QuotaError(
      "PREMIUM_REQUIRED",
      "Seni beğenenleri görmek premium üyelere özeldir.",
    );
  }

  const tier = getActiveTier(profile, now);
  const limit = TIER_LIMITS[tier].whoLikedViewsPerPeriod;
  const quota = await ensureQuota(profileId, now);

  const periodActive = quota.periodEnd && quota.periodEnd > now;
  const used = periodActive ? quota.whoLikedViewsPeriod : 0;
  const periodStart = periodActive ? (quota.periodStart ?? now) : now;
  const periodEnd = periodActive
    ? quota.periodEnd!
    : new Date(now.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (limit !== -1 && used >= limit) {
    throw new QuotaError(
      "WHO_LIKED_LIMIT",
      "Seni beğenenler görüntüleme limitine ulaştın.",
      limit,
      used,
    );
  }

  await prisma.subscriptionQuota.update({
    where: { userId: profileId },
    data: {
      whoLikedViewsPeriod: used + 1,
      periodStart,
      periodEnd,
    },
  });

  return { tier, used: used + 1, limit };
}
