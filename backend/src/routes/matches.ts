import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { randomUUID } from "crypto";
import { notifyMatch } from "./sse";
import { sendPushNotification } from "../lib/push";
import { checkNotBlocked, BlockedError } from "../middleware/privacy";

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  messageType: z.enum(["text", "voice", "photo", "ephemeral_photo"]).optional().default("text"),
  voiceUrl: z.string().url().optional(),
  voiceDuration: z.number().int().min(1).max(300).optional() // Max 5 minutes
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

  // Block kontrolü: karşı taraf engellenmişse mesajları gösterme
  const otherProfileId = match.user1Id === profile.id ? match.user2Id : match.user1Id;
  const otherProfile = await prisma.profile.findUnique({ where: { id: otherProfileId }, select: { userId: true } });
  if (otherProfile) {
    try {
      await checkNotBlocked(user.id, otherProfile.userId);
    } catch (err) {
      if (err instanceof BlockedError) {
        return c.json({ error: { message: err.message, code: err.code } }, 403);
      }
      throw err;
    }
  }

  const messages = await prisma.message.findMany({
    where: { matchId, isDeleted: false },
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

  // Block kontrolü: engellenmiş kullanıcıya mesaj gönderilemez
  const otherProfileIdForSend = match.user1Id === profile.id ? match.user2Id : match.user1Id;
  const otherProfileForSend = await prisma.profile.findUnique({ where: { id: otherProfileIdForSend }, select: { userId: true } });
  if (otherProfileForSend) {
    try {
      await checkNotBlocked(user.id, otherProfileForSend.userId);
    } catch (err) {
      if (err instanceof BlockedError) {
        return c.json({ error: { message: err.message, code: err.code } }, 403);
      }
      throw err;
    }
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

  const { content, messageType, voiceUrl, voiceDuration } = result.data;

  const message = await prisma.message.create({
    data: {
      id: randomUUID(),
      matchId,
      senderId: profile.id,
      content: content.trim(),
      messageType: messageType ?? "text",
      voiceUrl: voiceUrl ?? null,
      voiceDuration: voiceDuration ?? null,
    },
    include: { sender: true },
  });

  // Notify SSE connections about the new message
  notifyMatch(matchId, { type: "new_message", data: message });

  // Send push notification to the recipient
  const recipientId = match.user1Id === profile.id ? match.user2Id : match.user1Id;
  const recipient = await prisma.profile.findUnique({ where: { id: recipientId } });

  if (recipient?.pushToken) {
    const preview =
      messageType === "voice"
        ? "Sesli mesaj gonderdi 🎤"
        : messageType === "photo"
          ? "Fotoğraf gönderdi 📷"
          : messageType === "ephemeral_photo"
            ? "Bir kez görüntülenebilir fotoğraf 🔥"
            : content.trim().length > 50
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

// POST /api/matches/seed-test - Create test matches for development
matchesRouter.post("/seed-test", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found" } }, 404);

  // Get other profiles to match with
  const otherProfiles = await prisma.profile.findMany({
    where: { userId: { not: user.id } },
    take: 5,
  });

  const iceBreakerQuestions = [
    "Hayalindeki tatil yeri neresi?",
    "En sevdigin yemek ne?",
    "Gelecekte kendini nerede goruyorsun?",
    "Hafta sonu genelde ne yaparsın?",
    "En son izledigin film ne?",
  ];

  const sampleMessages = [
    ["Merhaba! Profilini cok begendim 😊", "Merhaba! Tesekkurler, seninki de cok guzel", "Hangi bolumdusun?"],
    ["Hey! Fotograflarin cok guzel", "Sagol 😊 Sen nerden katiliyorsun?", "Istanbul'dan, sen?"],
    ["Muzik zevkin cok iyi!", "Tesekkurler! Konserlere gitmeyi severim", "Ben de bayilirim!"],
  ];

  const created: string[] = [];

  for (let i = 0; i < Math.min(3, otherProfiles.length); i++) {
    const partner = otherProfiles[i];
    if (!partner) continue;

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: myProfile.id, user2Id: partner.id },
          { user1Id: partner.id, user2Id: myProfile.id },
        ],
      },
    });

    if (existingMatch) {
      created.push(`Skipped ${partner.name} - already matched`);
      continue;
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        user1Id: myProfile.id,
        user2Id: partner.id,
        matchedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        iceBreakerQuestion: iceBreakerQuestions[i] ?? "Merhaba!",
        iceBreakerAccepted: i < 2, // First 2 have accepted icebreaker
        compatibilityScore: 70 + Math.floor(Math.random() * 25),
        isActive: true,
      },
    });

    // Add messages for first 2 matches
    if (i < 2) {
      const messages = sampleMessages[i] ?? [];
      for (let j = 0; j < messages.length; j++) {
        const msg = messages[j];
        if (!msg) continue;
        await prisma.message.create({
          data: {
            matchId: match.id,
            senderId: j % 2 === 0 ? myProfile.id : partner.id,
            content: msg,
            createdAt: new Date(Date.now() - (messages.length - j) * 5 * 60 * 1000),
          },
        });
      }
      created.push(`Created match with ${partner.name} (${messages.length} messages)`);
    } else {
      created.push(`Created match with ${partner.name} (no messages)`);
    }
  }

  return c.json({ data: { created, count: created.length } });
});
