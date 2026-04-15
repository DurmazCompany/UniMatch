import { prisma } from "../prisma";
import { randomUUID } from "crypto";

const TURKISH_MAP: Record<string, string> = {
  ş: "s", ı: "i", ö: "o", ü: "u", ç: "c", ğ: "g",
  Ş: "s", İ: "i", Ö: "o", Ü: "u", Ç: "c", Ğ: "g",
};

function normalizeTurkish(str: string): string {
  return str.replace(/[şıöüçğŞİÖÜÇĞ]/g, (c) => TURKISH_MAP[c] ?? c);
}

// Subdomains to strip when finding the main university domain
const SUBDOMAIN_PREFIXES = new Set(["std", "ogr", "mail", "student", "ogrenci", "stu", "edu"]);
const TLD_PARTS = new Set(["edu", "tr", "com", "org", "net", "ac", "uk"]);

export function extractUniversityInfo(email: string): {
  slug: string;
  displayName: string;
  domain: string;
} {
  const rawDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const parts = rawDomain.split(".");

  // Find the significant part (university name slug)
  // For std.yeditepe.edu.tr → parts = ["std","yeditepe","edu","tr"]
  // Strip leading subdomain prefixes and trailing tlds
  const meaningful = parts.filter(
    (p) => !SUBDOMAIN_PREFIXES.has(p) && !TLD_PARTS.has(p)
  );
  const slugRaw = meaningful[0] ?? parts[0] ?? "universite";

  // Build the canonical domain: take everything after the first subdomain prefix
  // e.g. std.yeditepe.edu.tr → yeditepe.edu.tr
  let domainParts = [...parts];
  while (domainParts.length > 0 && SUBDOMAIN_PREFIXES.has(domainParts[0] ?? "")) {
    domainParts = domainParts.slice(1);
  }
  const domain = domainParts.join(".");

  const slug = normalizeTurkish(slugRaw).toLowerCase();
  const displayName =
    slug.charAt(0).toUpperCase() + slug.slice(1) + " Üniversitesi";

  return { slug, displayName, domain };
}

export async function findOrCreateUniversity(email: string) {
  const { slug, displayName, domain } = extractUniversityInfo(email);

  const existing = await prisma.university.findFirst({
    where: { OR: [{ slug }, { emailDomain: domain }] },
  });
  if (existing) return existing;

  return prisma.university.create({
    data: {
      id: randomUUID(),
      slug,
      displayName,
      emailDomain: domain,
    },
  });
}
