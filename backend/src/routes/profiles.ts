import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { randomUUID } from "crypto";
import { calculateProfilePower } from "../lib/profile-power";

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  birthDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
  gender: z.enum(["Erkek", "Kadın", "Diğer", "male", "female", "other"]),
  department: z.string().min(2).max(100),
  year: z.number().int().min(1).max(6),
  bio: z.string().max(200).optional(),
  photos: z.array(z.string()).min(2).max(6),
  hobbies: z.array(z.string()).min(1).max(5),
  university: z.string().min(2).max(100),
  selfieVerified: z.boolean().optional()
});

export const profilesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/profile - get current user's profile
profilesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return c.json({ data: profile });
});

// POST /api/profile - create or update profile
profilesRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json();
  console.log("Profile POST body:", JSON.stringify(body, null, 2));

  const result = profileSchema.safeParse(body);

  if (!result.success) {
    console.log("Profile validation failed:", JSON.stringify(result.error.issues, null, 2));
    return c.json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.issues
      }
    }, 400);
  }

  const {
    name, birthDate, gender, department, year, bio,
    photos, hobbies, university, selfieVerified
  } = result.data;

  // Convert arrays to JSON strings for Prisma storage
  const photosJson = JSON.stringify(photos);
  const hobbiesJson = JSON.stringify(hobbies);

  // Calculate profile power using shared function
  const power = calculateProfilePower({
    photos: photosJson,
    bio: bio ?? null,
    hobbies: hobbiesJson,
    selfieVerified: selfieVerified ?? false,
  });

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });

  if (existing) {
    const updated = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        name: name ?? existing.name,
        birthDate: birthDate ? new Date(birthDate) : existing.birthDate,
        gender: gender ?? existing.gender,
        department: department ?? existing.department,
        year: year ?? existing.year,
        bio: bio ?? existing.bio,
        photos: photosJson ?? existing.photos,
        hobbies: hobbiesJson ?? existing.hobbies,
        university: university ?? existing.university,
        selfieVerified: selfieVerified !== undefined ? selfieVerified : existing.selfieVerified,
        profilePower: power,
      },
    });
    return c.json({ data: updated });
  }

  const created = await prisma.profile.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      university: university || "",
      name: name || user.name || "",
      birthDate: birthDate ? new Date(birthDate) : new Date(),
      gender: gender || "other",
      department: department || "",
      year: year || 1,
      bio,
      photos: photosJson,
      hobbies: hobbiesJson,
      selfieVerified: selfieVerified || false,
      profilePower: power,
    },
  });
  return c.json({ data: created });
});

// POST /api/profile/push-token - save push notification token
profilesRouter.post("/push-token", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { token } = await c.req.json();
  if (!token || typeof token !== "string") {
    return c.json({ error: { message: "Token is required" } }, 400);
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return c.json({ error: { message: "Profile not found", code: "NOT_FOUND" } }, 404);
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: { pushToken: token },
  });

  return c.json({ data: { success: true } });
});
