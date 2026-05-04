import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const gifts = await prisma.giftCatalog.findMany();
  console.log(`Gifts: ${gifts.length}`);
  console.log(gifts.map(g => `${g.emoji} ${g.nameTr} (${g.coinCost})`).join('\n'));
}
main().finally(() => prisma.$disconnect());
