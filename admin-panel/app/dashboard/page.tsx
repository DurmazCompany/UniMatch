import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalUsers, activePremium, pendingAmbassadors, newUsers, recentActions] =
    await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: {
          AND: [
            { NOT: { subscriptionTier: "crush" } },
            {
              OR: [
                { subscriptionExpiresAt: { gt: now } },
                { ambassadorGrantedAt: { not: null } },
              ],
            },
          ],
        },
      }),
      prisma.ambassadorApplication.count({ where: { status: "pending" } }),
      prisma.profile.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.adminAction.count({ where: { createdAt: { gte: yesterday } } }),
    ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Toplam Kullanıcı" value={totalUsers} />
        <StatCard title="Aktif Premium" value={activePremium} accent="green" />
        <StatCard
          title="Bekleyen Elçi Başvurusu"
          value={pendingAmbassadors}
          accent="orange"
        />
        <StatCard title="Son 24s Yeni Kullanıcı" value={newUsers} accent="blue" />
        <StatCard title="Son 24s Admin Aksiyonu" value={recentActions} />
      </div>
    </div>
  );
}
