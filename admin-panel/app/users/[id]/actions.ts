"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ADMIN_ID } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

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
  await notifyUser({
    userId: profileId,
    type: "banned",
    title: "Hesabın askıya alındı",
    body: reason,
  });
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
  await notifyUser({
    userId: profileId,
    type: "unbanned",
    title: "Hesabın aktif",
    body: "Hesabın yeniden aktifleştirildi.",
  });
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
  await notifyUser({
    userId: profileId,
    type: "premium_granted",
    title: "Premium aktivasyon!",
    body: `${tier === "ask" ? "Aşk" : "Flört"} premium hesabına eklendi.`,
  });
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
  await notifyUser({
    userId: profileId,
    type: "premium_revoked",
    title: "Premium iptal edildi",
    body: "Premium aboneliğin sona erdi.",
  });
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
  await notifyUser({
    userId: profileId,
    type: "role_changed",
    title: "Rol güncellendi",
    body: `Yeni rolün: ${role}`,
  });
  revalidatePath(`/users/${profileId}`);
}
