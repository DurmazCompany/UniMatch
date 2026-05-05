import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  Ban,
  CheckCircle2,
  Crown,
  XCircle,
  UserCog,
  Award,
  CalendarOff,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof Activity> = {
  ban: Ban,
  unban: CheckCircle2,
  grant_premium: Crown,
  revoke_premium: XCircle,
  change_role: UserCog,
  approve_ambassador: Award,
  reject_ambassador: XCircle,
  deactivate_event: CalendarOff,
};

const ACTION_TYPES = [
  "ban",
  "unban",
  "grant_premium",
  "revoke_premium",
  "change_role",
  "approve_ambassador",
  "reject_ambassador",
  "deactivate_event",
];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams.type ?? "";
  const where = type ? { actionType: type } : {};

  const actions = await prisma.adminAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: true, targetUser: true },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Audit Log</h1>

      <form className="flex gap-3 mb-6 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Aksiyon Tipi</label>
          <select
            name="type"
            defaultValue={type}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Hepsi</option>
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Filtrele
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {actions.length === 0 ? (
          <p className="px-4 py-10 text-center text-gray-500">
            Aksiyon bulunamadı.
          </p>
        ) : (
          <ul>
            {actions.map((a) => {
              const Icon = ICONS[a.actionType] ?? Activity;
              let parsedDetails: Record<string, unknown> | null = null;
              if (a.details) {
                try {
                  parsedDetails = JSON.parse(a.details);
                } catch {
                  parsedDetails = null;
                }
              }
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-4 px-4 py-3 border-t border-gray-100 first:border-t-0"
                >
                  <div className="bg-gray-100 rounded-full p-2 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.actionType}</span>
                      {a.targetUser && (
                        <Link
                          href={`/users/${a.targetUser.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          → {a.targetUser.name}
                        </Link>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {format(new Date(a.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Admin: {a.admin?.name ?? a.adminId}
                    </p>
                    {parsedDetails && (
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2 overflow-x-auto">
                        {JSON.stringify(parsedDetails, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
