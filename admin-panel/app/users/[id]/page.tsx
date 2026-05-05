import { prisma } from "@/lib/prisma";
import { AdminActionForm } from "@/components/AdminActionForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function UserDetail({
  params,
}: {
  params: { id: string };
}) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: { user: true, universityRef: true },
  });
  if (!profile) notFound();

  const actions = await prisma.adminAction.findMany({
    where: { targetUserId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { admin: true },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/users"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Kullanıcılar
        </Link>
        <h1 className="text-3xl font-bold mt-2">{profile.name}</h1>
        <p className="text-gray-600">{profile.user.email}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4 text-sm">
        <Field label="Üniversite" value={profile.university} />
        <Field
          label="Bölüm / Yıl"
          value={`${profile.department} — ${profile.year}. yıl`}
        />
        <Field label="Rol" value={profile.role} />
        <Field
          label="Tier"
          value={profile.subscriptionTier}
        />
        <Field
          label="Premium Bitiş"
          value={
            profile.subscriptionExpiresAt
              ? format(new Date(profile.subscriptionExpiresAt), "yyyy-MM-dd")
              : "—"
          }
        />
        <Field
          label="Elçi Onay"
          value={
            profile.ambassadorGrantedAt
              ? format(new Date(profile.ambassadorGrantedAt), "yyyy-MM-dd")
              : "—"
          }
        />
        <Field label="Banlı" value={profile.isBanned ? "Evet" : "Hayır"} />
        {profile.isBanned && (
          <Field label="Ban Sebebi" value={profile.banReason ?? "—"} />
        )}
        {profile.bannedUntil && (
          <Field
            label="Ban Bitiş"
            value={format(new Date(profile.bannedUntil), "yyyy-MM-dd")}
          />
        )}
        <Field
          label="Kayıt"
          value={format(new Date(profile.createdAt), "yyyy-MM-dd HH:mm")}
        />
      </div>

      <AdminActionForm
        profileId={profile.id}
        currentTier={profile.subscriptionTier}
        currentRole={profile.role}
        isBanned={profile.isBanned}
      />

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-lg mb-3">Audit Log</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz aksiyon kaydı yok.</p>
        ) : (
          <ul className="space-y-2">
            {actions.map((a) => (
              <li
                key={a.id}
                className="text-sm border-l-2 border-gray-200 pl-3 py-1"
              >
                <span className="font-mono text-xs text-gray-500">
                  {format(new Date(a.createdAt), "yyyy-MM-dd HH:mm")}
                </span>{" "}
                — <span className="font-medium">{a.actionType}</span>
                {a.details && (
                  <span className="text-gray-600"> · {a.details}</span>
                )}
                <span className="text-gray-400 text-xs ml-2">
                  by {a.admin?.name ?? a.adminId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}
