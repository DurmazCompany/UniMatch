"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ADMIN_ID } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function approveAmbassador(applicationId: string) {
  const app = await prisma.ambassadorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  const now = new Date();
  await prisma.$transaction([
    prisma.ambassadorApplication.update({
      where: { id: applicationId },
      data: { status: "approved" },
    }),
    prisma.profile.update({
      where: { id: app.userId },
      data: {
        role: "ambassador",
        subscriptionTier: "ask",
        ambassadorGrantedAt: now,
      },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "approve_ambassador",
        targetUserId: app.userId,
        details: JSON.stringify({ applicationId }),
      },
    }),
  ]);
  await notifyUser({
    userId: app.userId,
    type: "ambassador_approved",
    title: "Tebrikler! 🎉",
    body: "Kampüs Elçisi başvurun onaylandı.",
  });
  revalidatePath("/ambassadors");
}

export async function rejectAmbassador(
  applicationId: string,
  reason: string,
) {
  const app = await prisma.ambassadorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("Application not found");

  await prisma.$transaction([
    prisma.ambassadorApplication.update({
      where: { id: applicationId },
      data: { status: "rejected", rejectionReason: reason },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "reject_ambassador",
        targetUserId: app.userId,
        details: JSON.stringify({ applicationId, reason }),
      },
    }),
  ]);
  await notifyUser({
    userId: app.userId,
    type: "ambassador_rejected",
    title: "Başvurun değerlendirildi",
    body: `Sebep: ${reason}`,
  });
  revalidatePath("/ambassadors");
}
