import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

export const blocksRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/blocks — Kullanıcı engelle
blocksRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json().catch(() => null);
  const blockedId: string | undefined = body?.blockedId;

  if (!blockedId || typeof blockedId !== "string") {
    return c.json({ error: { message: "blockedId zorunludur", code: "VALIDATION_ERROR" } }, 400);
  }

  if (blockedId === user.id) {
    return c.json({ error: { message: "Kendinizi engelleyemezsiniz", code: "VALIDATION_ERROR" } }, 400);
  }

  // Hedef kullanıcının var olduğunu doğrula
  const targetUser = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });
  if (!targetUser) {
    return c.json({ error: { message: "Kullanıcı bulunamadı", code: "NOT_FOUND" } }, 404);
  }

  // Zaten engellenmiş mi?
  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
  });
  if (existing) {
    return c.json({ data: existing });
  }

  const block = await prisma.block.create({
    data: {
      blockerId: user.id,
      blockedId,
    },
  });

  return c.json({ data: block }, 201);
});

// DELETE /api/blocks/:blockedId — Engeli kaldır
blocksRouter.delete("/:blockedId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const blockedId = c.req.param("blockedId");

  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
  });

  if (!block) {
    return c.json({ error: { message: "Engel bulunamadı", code: "NOT_FOUND" } }, 404);
  }

  await prisma.block.delete({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
  });

  return c.json({ data: { success: true } });
});

// GET /api/blocks — Engellediğim kullanıcıları listele
blocksRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: {
      blocked: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: blocks });
});
