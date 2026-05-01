/**
 * media.ts — Güvenli fotoğraf sunum katmanı
 *
 * Fotoğraflar local disk'te saklanıyor (uploads/). Bu route iki aşamalı
 * güvenlik sağlar:
 *
 * 1. GET /api/media/photo/:filename
 *    - Better Auth session kontrolü
 *    - Hedef kullanıcı ile active match VEYA kendi profili mi? kontrolü
 *    - Block kontrolü (çift yönlü)
 *    - Geçerliyse HMAC-SHA256 imzalı, 1 saat TTL'li signed token üretir
 *    - Yanıt: { url: "/api/media/serve/<token>" }
 *
 * 2. GET /api/media/serve/:token
 *    - Token'ı HMAC ile doğrular
 *    - Süresi dolmuş mu kontrol eder
 *    - Dosyayı binary olarak akıtır
 *
 * Token formatı (base64url):
 *   <filename>.<expiresAtUnixMs>.<hmac-hex>
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { createHmac } from "crypto";
import { readFile, stat } from "fs/promises";
import path from "path";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { env } from "../env";
import { checkNotBlocked, BlockedError } from "../middleware/privacy";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

// HMAC imzalama için secret: BETTER_AUTH_SECRET'ı yeniden kullan
const SIGNING_SECRET = env.BETTER_AUTH_SECRET;

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function signToken(filename: string, expiresAt: number): string {
  const payload = `${filename}.${expiresAt}`;
  const sig = createHmac("sha256", SIGNING_SECRET).update(payload).digest("hex");
  // base64url encode the full token
  const raw = `${payload}.${sig}`;
  return Buffer.from(raw).toString("base64url");
}

function parseAndVerifyToken(token: string): { filename: string; expiresAt: number } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    // Format: <filename>.<expiresAt>.<sig>
    // filename can contain dots (e.g. uuid.jpg), so we split from the right
    const lastDot = raw.lastIndexOf(".");
    const sigHex = raw.slice(lastDot + 1);
    const payloadPart = raw.slice(0, lastDot);

    const secondLastDot = payloadPart.lastIndexOf(".");
    const expiresAtStr = payloadPart.slice(secondLastDot + 1);
    const filename = payloadPart.slice(0, secondLastDot);

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt)) return null;

    // HMAC doğrulama
    const expectedSig = createHmac("sha256", SIGNING_SECRET)
      .update(payloadPart)
      .digest("hex");

    // Constant-time karşılaştırma (timing attack önleme)
    if (sigHex.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sigHex.length; i++) {
      diff |= sigHex.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    return { filename, expiresAt };
  } catch {
    return null;
  }
}

function isValidFilename(filename: string): boolean {
  // Dizin geçişini engelle, sadece izin verilen karakterler
  return (
    typeof filename === "string" &&
    filename.length > 0 &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\") &&
    /^[\w\-]+\.(jpg|jpeg|png|webp)$/i.test(filename)
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const mediaRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

/**
 * GET /api/media/photo/:filename
 *
 * Fotoğrafa erişim yetkisi kontrolü yapıp imzalı URL döner.
 *
 * Query params:
 *   - ownerUserId (zorunlu): Fotoğrafın sahibinin User.id'si
 *
 * Erişim kuralları:
 *   - Kendi fotoğrafı → her zaman izinli
 *   - Başkasının fotoğrafı → aktif match VEYA discover havuzunda görünmüş olması gerekir
 *   - Block ilişkisi varsa → 403
 */
mediaRouter.get("/photo/:filename", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const filename = c.req.param("filename");
  if (!isValidFilename(filename)) {
    return c.json({ error: { message: "Geçersiz dosya adı", code: "INVALID_FILENAME" } }, 400);
  }

  // ownerUserId: fotoğrafın kime ait olduğu (User.id)
  const ownerUserId = c.req.query("ownerUserId");
  if (!ownerUserId) {
    return c.json(
      { error: { message: "ownerUserId query parametresi zorunludur", code: "MISSING_PARAM" } },
      400
    );
  }

  // Kendi fotoğrafı → doğrudan izin ver
  if (ownerUserId === user.id) {
    return issueToken(c, filename);
  }

  // Block kontrolü (çift yönlü)
  try {
    await checkNotBlocked(user.id, ownerUserId);
  } catch (err) {
    if (err instanceof BlockedError) {
      return c.json({ error: { message: err.message, code: err.code } }, 403);
    }
    throw err;
  }

  // Requester'ın profilini bul
  const myProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!myProfile) {
    return c.json({ error: { message: "Profiliniz bulunamadı", code: "NO_PROFILE" } }, 403);
  }

  // Hedef kullanıcının profilini bul
  const ownerProfile = await prisma.profile.findUnique({
    where: { userId: ownerUserId },
    select: { id: true },
  });
  if (!ownerProfile) {
    return c.json({ error: { message: "Kullanıcı bulunamadı", code: "NOT_FOUND" } }, 404);
  }

  // Aktif match var mı?
  const activeMatch = await prisma.match.findFirst({
    where: {
      isActive: true,
      OR: [
        { user1Id: myProfile.id, user2Id: ownerProfile.id },
        { user1Id: ownerProfile.id, user2Id: myProfile.id },
      ],
    },
    select: { id: true },
  });

  if (activeMatch) {
    return issueToken(c, filename);
  }

  // Match yoksa 403
  return c.json(
    {
      error: {
        message: "Bu fotoğrafa erişim yetkiniz yok",
        code: "FORBIDDEN",
      },
    },
    403
  );
});

/**
 * GET /api/media/serve/:token
 *
 * İmzalı token'ı doğrulayıp dosyayı binary olarak sunar.
 * Auth gerektirmez — token kendi başına yeterli kimlik doğrulamasıdır.
 * Token TTL: 1 saat.
 */
mediaRouter.get("/serve/:token", async (c) => {
  const token = c.req.param("token");

  const parsed = parseAndVerifyToken(token);
  if (!parsed) {
    return c.json({ error: { message: "Geçersiz veya bozuk token", code: "INVALID_TOKEN" } }, 403);
  }

  if (Date.now() > parsed.expiresAt) {
    return c.json({ error: { message: "Token süresi dolmuş", code: "TOKEN_EXPIRED" } }, 403);
  }

  const { filename } = parsed;

  // Son güvenlik: dosya adını tekrar doğrula
  if (!isValidFilename(filename)) {
    return c.json({ error: { message: "Geçersiz dosya adı", code: "INVALID_FILENAME" } }, 400);
  }

  const filepath = path.join(UPLOAD_DIR, filename);

  // Dosya var mı?
  try {
    await stat(filepath);
  } catch {
    return c.json({ error: { message: "Dosya bulunamadı", code: "NOT_FOUND" } }, 404);
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPE_MAP[ext];
  if (!contentType) {
    return c.json({ error: { message: "Desteklenmeyen dosya türü", code: "INVALID_TYPE" } }, 400);
  }

  try {
    const fileBuffer = await readFile(filepath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Token süresince cache'e al, sonra yenile
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Media serve error:", error);
    return c.json({ error: { message: "Dosya sunulamadı", code: "SERVE_FAILED" } }, 500);
  }
});

// ─── Yardımcı: token üret ve yanıt döndür ────────────────────────────────────

type AppContext = Context<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>;

function issueToken(c: AppContext, filename: string) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = signToken(filename, expiresAt);
  const serveUrl = `${env.BACKEND_URL}/api/media/serve/${token}`;

  return c.json({
    data: {
      url: serveUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds: TOKEN_TTL_MS / 1000,
    },
  });
}
