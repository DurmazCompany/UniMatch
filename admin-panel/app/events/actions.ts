"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ADMIN_ID } from "@/lib/auth";

export async function deactivateEvent(eventId: string) {
  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { isActive: false },
    }),
    prisma.adminAction.create({
      data: {
        adminId: ADMIN_ID,
        actionType: "deactivate_event",
        details: JSON.stringify({ eventId }),
      },
    }),
  ]);
  revalidatePath("/events");
}
