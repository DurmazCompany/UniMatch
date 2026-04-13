import { Hono } from "hono";
import { prisma } from "../prisma";
import { randomUUID } from "crypto";

export const universitiesRouter = new Hono();

// Seed universities if they don't exist
const SEED_UNIVERSITIES = [
  { name: "Boğaziçi Üniversitesi", emailDomain: "boun.edu.tr" },
  { name: "Orta Doğu Teknik Üniversitesi (ODTÜ)", emailDomain: "metu.edu.tr" },
  { name: "İstanbul Teknik Üniversitesi (İTÜ)", emailDomain: "itu.edu.tr" },
  { name: "Hacettepe Üniversitesi", emailDomain: "hacettepe.edu.tr" },
  { name: "Ankara Üniversitesi", emailDomain: "ankara.edu.tr" },
  { name: "İstanbul Üniversitesi", emailDomain: "istanbul.edu.tr" },
  { name: "Sabancı Üniversitesi", emailDomain: "sabanciuniv.edu" },
  { name: "Koç Üniversitesi", emailDomain: "ku.edu.tr" },
  { name: "Bilkent Üniversitesi", emailDomain: "bilkent.edu.tr" },
  { name: "Yıldız Teknik Üniversitesi", emailDomain: "yildiz.edu.tr" },
];

async function seedUniversities() {
  for (const u of SEED_UNIVERSITIES) {
    await prisma.university.upsert({
      where: { emailDomain: u.emailDomain },
      update: {},
      create: { id: randomUUID(), ...u },
    });
  }
}
seedUniversities().catch(console.error);

universitiesRouter.get("/", async (c) => {
  const universities = await prisma.university.findMany({ orderBy: { name: "asc" } });
  return c.json({ data: universities });
});
