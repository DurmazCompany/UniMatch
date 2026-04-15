import { Hono } from "hono";
import { prisma } from "../prisma";
import { randomUUID } from "crypto";
import { extractUniversityInfo } from "../lib/university";

export const universitiesRouter = new Hono();

// Seed universities if they don't exist
const SEED_UNIVERSITIES = [
  { displayName: "Boğaziçi Üniversitesi", slug: "boun", emailDomain: "boun.edu.tr" },
  { displayName: "Orta Doğu Teknik Üniversitesi (ODTÜ)", slug: "metu", emailDomain: "metu.edu.tr" },
  { displayName: "İstanbul Teknik Üniversitesi (İTÜ)", slug: "itu", emailDomain: "itu.edu.tr" },
  { displayName: "Hacettepe Üniversitesi", slug: "hacettepe", emailDomain: "hacettepe.edu.tr" },
  { displayName: "Ankara Üniversitesi", slug: "ankara", emailDomain: "ankara.edu.tr" },
  { displayName: "İstanbul Üniversitesi", slug: "istanbul", emailDomain: "istanbul.edu.tr" },
  { displayName: "Sabancı Üniversitesi", slug: "sabanciuniv", emailDomain: "sabanciuniv.edu" },
  { displayName: "Koç Üniversitesi", slug: "ku", emailDomain: "ku.edu.tr" },
  { displayName: "Bilkent Üniversitesi", slug: "bilkent", emailDomain: "bilkent.edu.tr" },
  { displayName: "Yıldız Teknik Üniversitesi", slug: "yildiz", emailDomain: "yildiz.edu.tr" },
];

async function seedUniversities() {
  for (const u of SEED_UNIVERSITIES) {
    await prisma.university.upsert({
      where: { emailDomain: u.emailDomain },
      update: { displayName: u.displayName, slug: u.slug },
      create: { id: randomUUID(), ...u },
    });
  }
}
seedUniversities().catch(console.error);

universitiesRouter.get("/", async (c) => {
  const universities = await prisma.university.findMany({ orderBy: { displayName: "asc" } });
  return c.json({ data: universities });
});
