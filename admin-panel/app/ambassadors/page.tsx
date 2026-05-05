import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { AmbassadorCard } from "@/components/AmbassadorCard";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilmiş" },
];

export default async function AmbassadorsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status =
    searchParams.status && ["pending", "approved", "rejected"].includes(searchParams.status)
      ? searchParams.status
      : "pending";

  const apps = await prisma.ambassadorApplication.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Elçi Başvuruları</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/ambassadors?status=${t.key}`}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
              status === t.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {apps.length === 0 ? (
        <p className="text-gray-500">Bu sekmede başvuru yok.</p>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <AmbassadorCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
