import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { randomUUID } from "crypto";
import { notifyMatch } from "./sse";
import { sendPushNotification } from "../lib/push";

const messageSchema = z.object({
  content: z.string().min(1).max(500)
});

export const matchesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/matches - list active matches
matchesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ data: [] });

  // Expire old matches
  await prisma.match.updateMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  });

  const matches = await prisma.match.findMany({
    where: {
      isActive: true,
      OR: [{ user1Id: profile.id }, { user2Id: profile.id }],
    },
    include: {
      user1: true,
      user2: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { matchedAt: "desc" },
  });

  return c.json({ data: matches });
});

// POST /api/matches/:id/accept-icebreaker
matchesRouter.post("/:id/accept-icebreaker", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "NOT_FOUND" } }, 404);

  const matchId = c.req.param("id");

  // Get the match and verify ownership
  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!existingMatch) {
    return c.json({ error: { message: "Match not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify user is part of this match
  if (existingMatch.user1Id !== profile.id && existingMatch.user2Id !== profile.id) {
    return c.json({ error: { message: "Not authorized", code: "FORBIDDEN" } }, 403);
  }

  // Verify match is still active
  if (!existingMatch.isActive || new Date(existingMatch.expiresAt) < new Date()) {
    return c.json({ error: { message: "Match has expired", code: "EXPIRED" } }, 410);
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { iceBreakerAccepted: true },
  });

  // Notify the other user that icebreaker was accepted
  const otherUserId = existingMatch.user1Id === profile.id ? existingMatch.user2Id : existingMatch.user1Id;
  const otherProfile = await prisma.profile.findUnique({ where: { id: otherUserId } });
  if (otherProfile?.pushToken) {
    sendPushNotification(
      otherProfile.pushToken,
      "💬 Eşleşmen Seni Bekliyor!",
      `${profile.name} buz kırıcıyı kabul etti! Yanıtla 🔥`,
      { type: "icebreaker_accepted", matchId }
    );
  }

  return c.json({ data: match });
});

// GET /api/matches/:id/messages
matchesRouter.get("/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "NOT_FOUND" } }, 404);

  const matchId = c.req.param("id");

  // Get the match and verify ownership
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    return c.json({ error: { message: "Match not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify user is part of this match
  if (match.user1Id !== profile.id && match.user2Id !== profile.id) {
    return c.json({ error: { message: "Not authorized", code: "FORBIDDEN" } }, 403);
  }

  // Verify match is still active
  if (!match.isActive || new Date(match.expiresAt) < new Date()) {
    return c.json({ error: { message: "Match has expired", code: "EXPIRED" } }, 410);
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });

  return c.json({ data: messages });
});

// POST /api/matches/:id/messages
matchesRouter.post("/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Profile not found", code: "NOT_FOUND" } }, 404);

  const matchId = c.req.param("id");

  // Get the match and verify ownership
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    return c.json({ error: { message: "Match not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify user is part of this match
  if (match.user1Id !== profile.id && match.user2Id !== profile.id) {
    return c.json({ error: { message: "Not authorized", code: "FORBIDDEN" } }, 403);
  }

  // Verify match is still active
  if (!match.isActive || new Date(match.expiresAt) < new Date()) {
    return c.json({ error: { message: "Match has expired", code: "EXPIRED" } }, 410);
  }

  const body = await c.req.json();
  const result = messageSchema.safeParse(body);

  if (!result.success) {
    return c.json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.issues
      }
    }, 400);
  }

  const { content } = result.data;

  const message = await prisma.message.create({
    data: {
      id: randomUUID(),
      matchId,
      senderId: profile.id,
      content: content.trim(),
    },
    include: { sender: true },
  });

  // Notify SSE connections about the new message
  notifyMatch(matchId, { type: "new_message", data: message });

  // Send push notification to the recipient
  const recipientId = match.user1Id === profile.id ? match.user2Id : match.user1Id;
  const recipient = await prisma.profile.findUnique({ where: { id: recipientId } });

  if (recipient?.pushToken) {
    const preview = content.trim().length > 50
      ? content.trim().substring(0, 50) + "..."
      : content.trim();
    sendPushNotification(
      recipient.pushToken,
      `💬 ${profile.name}`,
      `${preview} 💕`,
      { type: "message", matchId, badge: 1 }
    );
  }

  return c.json({ data: message });
});
