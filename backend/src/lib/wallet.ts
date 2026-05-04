import { prisma } from "../prisma";
import type { Prisma, Profile } from "@prisma/client";

export type SubscriptionTier = "crush" | "flort" | "ask";

export type TierLimits = {
  monthlyCoins: number;
  rewindsPerDay: number;
  whoLikedViewsPerPeriod: number;
  boostsPerPeriod: number;
};

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  crush: {
    monthlyCoins: 0,
    rewindsPerDay: 0,
    whoLikedViewsPerPeriod: 0,
    boostsPerPeriod: 0,
  },
  flort: {
    monthlyCoins: 500,
    rewindsPerDay: 1,
    whoLikedViewsPerPeriod: 5,
    boostsPerPeriod: 1,
  },
  ask: {
    monthlyCoins: 1500,
    rewindsPerDay: -1,
    whoLikedViewsPerPeriod: -1,
    boostsPerPeriod: 4,
  },
};

export const PERIOD_DAYS = 30;

type PremiumLike = Pick<
  Profile,
  "subscriptionTier" | "subscriptionExpiresAt" | "isPremium" | "premiumUntil" | "premiumTier"
>;

export function isPremiumActive(profile: PremiumLike, now: Date = new Date()): boolean {
  const tier = (profile.subscriptionTier ?? "crush") as SubscriptionTier;
  if (tier !== "crush") {
    if (!profile.subscriptionExpiresAt) return true;
    if (profile.subscriptionExpiresAt > now) return true;
  }
  if (profile.isPremium && profile.premiumUntil && profile.premiumUntil > now) {
    return true;
  }
  return false;
}

export function getActiveTier(profile: PremiumLike, now: Date = new Date()): SubscriptionTier {
  if (!isPremiumActive(profile, now)) return "crush";
  const tier = (profile.subscriptionTier ?? profile.premiumTier ?? "crush") as SubscriptionTier;
  return tier === "flort" || tier === "ask" ? tier : "crush";
}

export type CoinReason =
  | "gift_sent"
  | "gift_received"
  | "boost_purchase"
  | "monthly_credit"
  | "rc_purchase"
  | "admin_grant"
  | "refund";

export type CoinTxnInput = {
  userId: string;
  amount: number;
  reason: CoinReason;
  refType?: string;
  refId?: string;
};

export class InsufficientCoinsError extends Error {
  code = "INSUFFICIENT_COINS" as const;
  constructor(public available: number, public required: number) {
    super(`Yetersiz coin: ${available} < ${required}`);
  }
}

async function applyDelta(
  tx: Prisma.TransactionClient,
  input: CoinTxnInput & { delta: number },
): Promise<{ balance: number }> {
  const { userId, delta, reason, refType, refId } = input;
  const existing = await tx.coinBalance.findUnique({ where: { userId } });

  if (delta < 0) {
    const available = existing?.balance ?? 0;
    if (available + delta < 0) {
      throw new InsufficientCoinsError(available, -delta);
    }
  }

  const balance = await tx.coinBalance.upsert({
    where: { userId },
    create: { userId, balance: Math.max(0, delta) },
    update: { balance: { increment: delta } },
  });

  await tx.coinLedger.create({
    data: { userId, delta, reason, refType, refId },
  });

  return { balance: balance.balance };
}

export async function spendCoins(input: CoinTxnInput): Promise<{ balance: number }> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive integer");
  }
  return prisma.$transaction((tx) => applyDelta(tx, { ...input, delta: -input.amount }));
}

export async function creditCoins(input: CoinTxnInput): Promise<{ balance: number }> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive integer");
  }
  return prisma.$transaction((tx) => applyDelta(tx, { ...input, delta: input.amount }));
}

export type GrantMonthlyResult = {
  granted: number;
  tier: SubscriptionTier;
  periodStart: Date;
  periodEnd: Date;
  alreadyGranted: boolean;
  balance: number;
};

export async function grantMonthlyCredits(
  userId: string,
  now: Date = new Date(),
): Promise<GrantMonthlyResult> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw new Error("Profile not found");

  const tier = getActiveTier(profile, now);
  const amount = TIER_LIMITS[tier].monthlyCoins;

  const quota = await prisma.subscriptionQuota.findUnique({ where: { userId } });
  const periodEnd = quota?.periodEnd ?? null;
  const inActivePeriod = periodEnd !== null && periodEnd > now;

  let nextPeriodStart: Date;
  let nextPeriodEnd: Date;
  let alreadyGranted = false;

  if (inActivePeriod) {
    nextPeriodStart = quota!.periodStart ?? now;
    nextPeriodEnd = periodEnd!;
    alreadyGranted = true;
  } else {
    nextPeriodStart = now;
    nextPeriodEnd = new Date(now.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);
  }

  if (alreadyGranted || amount <= 0) {
    await prisma.subscriptionQuota.upsert({
      where: { userId },
      create: {
        userId,
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
      },
      update: {
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
      },
    });
    const bal = await prisma.coinBalance.findUnique({ where: { userId } });
    return {
      granted: 0,
      tier,
      periodStart: nextPeriodStart,
      periodEnd: nextPeriodEnd,
      alreadyGranted,
      balance: bal?.balance ?? 0,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.subscriptionQuota.upsert({
      where: { userId },
      create: {
        userId,
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
        boostsUsedPeriod: 0,
        whoLikedViewsPeriod: 0,
      },
      update: {
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
        boostsUsedPeriod: 0,
        whoLikedViewsPeriod: 0,
      },
    });
    return applyDelta(tx, {
      userId,
      amount,
      delta: amount,
      reason: "monthly_credit",
      refType: "subscription_period",
      refId: nextPeriodStart.toISOString(),
    });
  });

  return {
    granted: amount,
    tier,
    periodStart: nextPeriodStart,
    periodEnd: nextPeriodEnd,
    alreadyGranted: false,
    balance: result.balance,
  };
}
