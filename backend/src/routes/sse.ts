import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { prisma } from "../prisma";
import { auth } from "../auth";

export const sseRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Store active connections by matchId
const connections = new Map<string, Set<(data: { type: string; data: unknown }) => void>>();

export function notifyMatch(matchId: string, event: { type: string; data: unknown }) {
  const listeners = connections.get(matchId);
  if (listeners) {
    listeners.forEach((send) => send(event));
  }
}

sseRouter.get("/matches/:matchId", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const matchId = c.req.param("matchId");

  // Get user's profile
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return c.json({ error: { message: "Profile not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify user is part of this match
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return c.json({ error: { message: "Match not found", code: "NOT_FOUND" } }, 404);
  }

  if (match.user1Id !== profile.id && match.user2Id !== profile.id) {
    return c.json({ error: { message: "Not authorized", code: "FORBIDDEN" } }, 403);
  }

  // Verify match is still active
  if (!match.isActive) {
    return c.json({ error: { message: "Match is no longer active", code: "INACTIVE" } }, 410);
  }

  return streamSSE(c, async (stream) => {
    const send = (event: { type: string; data: unknown }) => {
      stream.writeSSE({ data: JSON.stringify(event) });
    };

    // Add to connections
    if (!connections.has(matchId)) {
      connections.set(matchId, new Set());
    }
    connections.get(matchId)!.add(send);

    // Keep connection alive with ping every 30 seconds
    const keepAlive = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "" });
    }, 30000);

    // Cleanup on close
    stream.onAbort(() => {
      clearInterval(keepAlive);
      connections.get(matchId)?.delete(send);
      // Clean up empty sets
      if (connections.get(matchId)?.size === 0) {
        connections.delete(matchId);
      }
    });

    // Keep stream open indefinitely
    await new Promise(() => {});
  });
});
