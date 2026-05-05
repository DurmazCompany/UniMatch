import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { sendPushNotification } from "../lib/push";
import { env } from "../env";

const schema = z.object({
  user_id: z.string().min(1),
  type: z.enum([
    "banned",
    "unbanned",
    "premium_granted",
    "premium_revoked",
    "ambassador_approved",
    "ambassador_rejected",
    "role_changed",
    "event_deleted",
    "generic",
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const adminNotifyRouter = new Hono();

adminNotifyRouter.post("/", async (c) => {
  const auth = c.req.header("authorization");
  const expected = `Bearer ${env.ADMIN_PANEL_SECRET}`;
  if (!auth || auth !== expected) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const body = await c.req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { message: "Validation failed", details: parsed.error.issues } },
      422,
    );
  }
  const { user_id, type, title, body: msgBody, data } = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { id: user_id },
    select: { pushToken: true, name: true },
  });
  if (!profile) {
    return c.json({ error: { message: "Profile not found" } }, 404);
  }
  if (!profile.pushToken) {
    return c.json({ data: { sent: false, reason: "no_push_token" } });
  }

  await sendPushNotification(profile.pushToken, title, msgBody, {
    type,
    ...(data ?? {}),
  });

  return c.json({ data: { sent: true } });
});
