"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ADMIN_ID } from "@/lib/auth";

export async function banUser(
  profileId: string,
  reason: string,
  until?: Date,
) {
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { isBanned: true, banReason: reason, bannedUntil: until ?? null },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "ban",
        targetUserId: profileId,
        details: JSON.stringify({ reason, until }),
      },
    }),
  ]);
  revalidatePath(`/users/${profileId}`);
}

export async function unbanUser(profileId: string) {
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { isBanned: false, banReason: null, bannedUntil: null },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "unban",
        targetUserId: profileId,
      },
    }),
  ]);
  revalidatePath(`/users/${profileId}`);
}

export async function grantPremium(
  profileId: string,
  tier: "flort" | "ask",
  until: Date,
) {
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { subscriptionTier: tier, subscriptionExpiresAt: until },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "grant_premium",
        targetUserId: profileId,
        details: JSON.stringify({ tier, until }),
      },
    }),
  ]);
  revalidatePath(`/users/${profileId}`);
}

export async function revokePremium(profileId: string) {
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: {
        subscriptionTier: "crush",
        subscriptionExpiresAt: null,
        isInvisible: false,
      },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "revoke_premium",
        targetUserId: profileId,
      },
    }),
  ]);
  revalidatePath(`/users/${profileId}`);
}

export async function changeRole(
  profileId: string,
  role: "user" | "ambassador" | "admin",
) {
  await prisma.$transaction([
    prisma.profile.update({ where: { id: profileId }, data: { role } }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "change_role",
        targetUserId: profileId,
        details: JSON.stringify({ role }),
      },
    }),
  ]);
  revalidatePath(`/users/${profileId}`);
}
