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
    isPaid: event.isPaid,
    ticketPrice: event.ticketPrice,
    maxAttendees: event.maxAttendees,
    ticketsSold: event.ticketsSold,
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
      isPaid: z.boolean().optional().default(false),
      ticketPrice: z.number().positive().optional(),
      maxAttendees: z.number().int().positive().optional(),
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
        isPaid: body.isPaid ?? false,
        ticketPrice: body.isPaid ? body.ticketPrice : null,
        maxAttendees: body.maxAttendees ?? null,
      },
    });

    return c.json({ data: event });
  }
);

// POST /:id/join — Join an event
eventsRouter.post("/:id/join", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const eventId = c.req.param("id");
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: { select: { profileId: true } } },
  });
  if (!event || !event.isActive) {
    return c.json({ error: { message: "Event not found", code: "EVENT_NOT_FOUND" } }, 404);
  }

  // Check capacity
  if (event.maxAttendees !== null && event.ticketsSold >= event.maxAttendees) {
    return c.json({ error: { message: "Etkinlik kapasitesi doldu", code: "EVENT_FULL" } }, 400);
  }

  // Check if already joined
  const alreadyJoined = event.participants.some((p) => p.profileId === myProfile.id);
  if (alreadyJoined) {
    return c.json({ data: { success: true, alreadyJoined: true } });
  }

  // For paid events: record with hasPaid: false (Shopier webhook will update later)
  // For free events: record with hasPaid: true
  await prisma.$transaction([
    prisma.eventParticipant.create({
      data: {
        eventId,
        profileId: myProfile.id,
        hasPaid: !event.isPaid,
      },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: { ticketsSold: { increment: 1 } },
    }),
  ]);

  return c.json({
    data: {
      success: true,
      isPaid: event.isPaid,
      requiresPayment: event.isPaid,
      ticketPrice: event.ticketPrice,
    },
  });
});

// DELETE /:id/join — Leave an event
eventsRouter.delete("/:id/join", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const eventId = c.req.param("id");

  const deleted = await prisma.eventParticipant.deleteMany({
    where: { eventId, profileId: myProfile.id },
  });

  if (deleted.count > 0) {
    await prisma.event.update({
      where: { id: eventId },
      data: { ticketsSold: { decrement: 1 } },
    });
  }

  return c.json({ data: { success: true } });
});

// GET /:id/attendees — List attendees (only visible to event creator)
eventsRouter.get("/:id/attendees", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!myProfile) return c.json({ error: { message: "Profile not found", code: "PROFILE_NOT_FOUND" } }, 404);

  const eventId = c.req.param("id");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isActive) {
    return c.json({ error: { message: "Event not found", code: "EVENT_NOT_FOUND" } }, 404);
  }

  if (event.createdById !== myProfile.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: {
      profile: {
        select: { id: true, name: true, university: true, department: true, year: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = participants.map((p) => ({
    profileId: p.profileId,
    name: p.profile.name,
    university: p.profile.university,
    department: p.profile.department,
    year: p.profile.year,
    hasPaid: p.hasPaid,
    paymentRef: p.paymentRef,
    joinedAt: p.createdAt,
  }));

  return c.json({ data: result });
});
