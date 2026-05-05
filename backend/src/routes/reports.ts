import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";

export const reportsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const reportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.string().min(1).max(80),
  details: z.string().max(800).optional(),
});

// POST /api/reports — file a user report
reportsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Validation failed", code: "VALIDATION_ERROR" } }, 400);
  }

  const { reportedId, reason, details } = parsed.data;

  // Resolve reporter Profile.id from user
  const reporterProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!reporterProfile) {
    return c.json({ error: { message: "Profile not found" } }, 404);
  }

  // Resolve reportedId — can be either Profile.id or User.id
  let targetProfile = await prisma.profile.findUnique({
    where: { id: reportedId },
    select: { id: true },
  });
  if (!targetProfile) {
    targetProfile = await prisma.profile.findUnique({
      where: { userId: reportedId },
      select: { id: true },
    });
  }

  const action = await prisma.adminAction.create({
    data: {
      adminId: reporterProfile.id,
      actionType: "user_report",
      targetUserId: targetProfile?.id ?? null,
      details: JSON.stringify({ reason, text: details ?? "", reportedId }),
    },
  });

  return c.json({ data: { id: action.id, status: "pending" } }, 201);
});
