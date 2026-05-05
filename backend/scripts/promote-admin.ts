import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: bun run scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }
  if (!user.profile) {
    console.error(`User ${email} has no profile yet — onboarding incomplete`);
    process.exit(1);
  }

  await prisma.profile.update({
    where: { id: user.profile.id },
    data: { role: "admin" },
  });

  console.log(`✅ Promoted ${email} to admin`);
  console.log(`   Profile ID: ${user.profile.id}`);
  console.log(`   Set ADMIN_ID="${user.profile.id}" in admin-panel/.env.local`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
