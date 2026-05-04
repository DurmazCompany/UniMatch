import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GIFTS = [
  { id: "rose",     nameTr: "Gül",                emoji: "🌹", coinCost: 100,  sortOrder: 1 },
  { id: "bouquet",  nameTr: "Buket",              emoji: "💐", coinCost: 250,  sortOrder: 2 },
  { id: "teddy",    nameTr: "Ayıcık",             emoji: "🧸", coinCost: 500,  sortOrder: 3 },
  { id: "cake",     nameTr: "Doğum Günü Pastası", emoji: "🎂", coinCost: 750,  sortOrder: 4 },
  { id: "heart",    nameTr: "Kalp",               emoji: "💖", coinCost: 1000, sortOrder: 5 },
  { id: "ring",     nameTr: "Yüzük",              emoji: "💍", coinCost: 2500, sortOrder: 6 },
];

async function main() {
  for (const g of GIFTS) {
    await prisma.giftCatalog.upsert({
      where: { id: g.id },
      update: g,
      create: g,
    });
  }
  console.log(`✅ Seeded ${GIFTS.length} gifts`);
}

main().finally(() => prisma.$disconnect());
