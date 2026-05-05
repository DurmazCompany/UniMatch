import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { randomUUID } from "crypto";
import { calculateProfilePower } from "../lib/profile-power";
import { findOrCreateUniversity } from "../lib/university";
import { sendPushNotification } from "../lib/push";

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

  try {
    const profileWithMatches = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        matchesAsUser1: { select: { isActive: true } },
        matchesAsUser2: { select: { isActive: true } },
        universityRef: true,
      },
    });

    if (!profileWithMatches) {
      return c.json({ data: null });
    }

    // Streak danger notification: user has a streak but hasn't reached 5 swipes today
    // and it's been 20+ hours since last streak update — fire when app is opened
    if (profileWithMatches.streakCount > 0 && profileWithMatches.pushToken) {
      const now = new Date();
      const lastStreakTime = profileWithMatches.lastStreakDate
        ? new Date(profileWithMatches.lastStreakDate)
        : null;
      const hoursSinceStreak = lastStreakTime
        ? (now.getTime() - lastStreakTime.getTime()) / (1000 * 60 * 60)
        : 999;

      const todayStr = now.toDateString();
      const lastStreakDay = lastStreakTime ? lastStreakTime.toDateString() : null;
      const hasReachedStreakToday = lastStreakDay === todayStr;

      if (!hasReachedStreakToday && hoursSinceStreak >= 20) {
        sendPushNotification(
          profileWithMatches.pushToken,
          "Atesin sonmek uzere!",
          `${profileWithMatches.streakCount} gunluk serini korumak icin bugun 5 swipe yap!`,
          { type: "streak_danger" }
        );
      }
    }

    // Return profile data (exclude relation arrays, include universityRef)
    const { matchesAsUser1: _u1, matchesAsUser2: _u2, ...profileData } = profileWithMatches;
    return c.json({ data: profileData });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return c.json({ error: { message: "Internal server error" } }, 500);
  }
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

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });

  // Calculate profile power using shared function
  const power = calculateProfilePower({
    photos: photosJson,
    bio: bio ?? null,
    hobbies: hobbiesJson,
    selfieVerified: selfieVerified ?? false,
    isPremium: existing?.isPremium ?? false,
    streakCount: existing?.streakCount ?? 0,
  });

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

  // Auto-detect university from email
  try {
    const universityRecord = await findOrCreateUniversity(user.email);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await prisma.profile.update({
      where: { id: created.id },
      data: {
        universityId: universityRecord.id,
        university: universityRecord.displayName,
        referralCode,
      },
    });
  } catch (e) {
    // non-fatal: university detection failure shouldn't block profile creation
    console.error("University detection failed:", e);
  }

  return c.json({ data: created });
});

// POST /api/profile/boost — activate/stack a 30-minute profile boost
profilesRouter.post("/boost", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found" } }, 404);

  // Extend boost by 30 minutes (stack if already active)
  const now = new Date();
  const currentBoostEnd = myProfile.boostUntil && myProfile.boostUntil > now
    ? myProfile.boostUntil
    : now;
  const newBoostUntil = new Date(currentBoostEnd.getTime() + 30 * 60 * 1000);

  await prisma.profile.update({
    where: { id: myProfile.id },
    data: { boostUntil: newBoostUntil },
  });

  return c.json({ data: { boostUntil: newBoostUntil } });
});

// GET /api/profile/:id - get public profile by Profile.id
profilesRouter.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const id = c.req.param("id");
  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      university: true,
      department: true,
      year: true,
      bio: true,
      photos: true,
      hobbies: true,
      lifestyle: true,
      birthDate: true,
      gender: true,
      profilePower: true,
      streakCount: true,
      role: true,
      isOnCampusToday: true,
    },
  });
  if (!profile) return c.json({ error: { message: "Not found" } }, 404);
  return c.json({ data: profile });
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
