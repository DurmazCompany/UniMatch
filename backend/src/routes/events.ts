import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth } from "../auth";

type HonoVars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const eventsRouter = new Hono<HonoVars>();

// GET / — List active events for the user's university
eventsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const where: {
    isActive: boolean;
    universityId?: string;
  } = { isActive: true };

  if (myProfile.universityId) {
    // Events are not directly linked to universityId on Event model,
    // but Event has a `university` string field (display name).
    // We filter by creator's universityId or match on university string.
    // Since Event has no universityId FK, we join via createdBy profile's universityId.
    // Instead, we use the Event.university string which is set from profile.university on creation.
    // The safest filter: get events whose createdBy profile has the same universityId.
    // We'll do an include-based approach via Prisma.
  }

  // Fetch all active events, then filter by university
  const allEvents = await prisma.event.findMany({
    where: { isActive: true },
    include: {
      participants: {
        select: { profileId: true },
      },
      createdBy: {
        select: { universityId: true, university: true },
      },
    },
    orderBy: { date: "asc" },
  });

  // Filter by university if the user has a universityId set
  const filteredEvents = myProfile.universityId
    ? allEvents.filter(
        (e) =>
          e.createdBy.universityId === myProfile.universityId ||
          e.university === myProfile.university
      )
    : allEvents;

  const result = filteredEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    university: event.university,
    participantCount: event.participants.length,
    isJoined: event.participants.some((p) => p.profileId === myProfile.id),
  }));

  return c.json({ data: result });
});

// POST / — Create a new event (ambassadors and admins only)
eventsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      date: z.string().min(1),
      location: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

    const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

    if (myProfile.role === "user") {
      return c.json({ error: { message: "Only ambassadors and admins can create events", code: "FORBIDDEN" } }, 403);
    }

    const body = c.req.valid("json");
    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      return c.json({ error: { message: "Invalid date format", code: "INVALID_DATE" } }, 400);
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        date: parsedDate,
        location: body.location,
        university: myProfile.university,
        createdById: myProfile.id,
        isActive: true,
      },
    });

    return c.json({ data: event });
  }
);

// POST /:id/join — Join an event (idempotent)
eventsRouter.post("/:id/join", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const eventId = c.req.param("id");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isActive) {
    return c.json({ error: { message: "Event not found", code: "EVENT_NOT_FOUND" } }, 404);
  }

  await prisma.eventParticipant.upsert({
    where: {
      eventId_profileId: {
        eventId,
        profileId: myProfile.id,
      },
    },
    create: {
      eventId,
      profileId: myProfile.id,
    },
    update: {},
  });

  return c.json({ data: { success: true } });
});

// DELETE /:id/join — Leave an event
eventsRouter.delete("/:id/join", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const eventId = c.req.param("id");

  await prisma.eventParticipant.deleteMany({
    where: {
      eventId,
      profileId: myProfile.id,
    },
  });

  return c.json({ data: { success: true } });
});
