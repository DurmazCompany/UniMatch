import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import clsx from "clsx";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  role?: string;
  banned?: string;
  page?: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim() ?? "";
  const role = searchParams.role ?? "";
  const banned = searchParams.banned ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { user: { email: { contains: q } } },
      { university: { contains: q } },
    ];
  }
  if (role) where.role = role;
  if (banned === "yes") where.isBanned = true;
  if (banned === "no") where.isBanned = false;

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.profile.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Kullanıcılar</h1>

      <form className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs text-gray-500 block mb-1">Arama</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="İsim, email veya üniversite"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Rol</label>
          <select
            name="role"
            defaultValue={role}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Hepsi</option>
            <option value="user">user</option>
            <option value="ambassador">ambassador</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Banlı</label>
          <select
            name="banned"
            defaultValue={banned}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Hepsi</option>
            <option value="yes">Evet</option>
            <option value="no">Hayır</option>
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">İsim</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Üniversite</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Banlı</th>
              <th className="px-4 py-3">Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Sonuç bulunamadı.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/users/${p.id}`} className="font-medium text-gray-900 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{p.university}</td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        p.subscriptionTier === "crush"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {p.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.role}</td>
                  <td className="px-4 py-3">
                    {p.isBanned ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">
                        Evet
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(p.createdAt), "yyyy-MM-dd")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>
          {total} kullanıcı — Sayfa {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/users?${new URLSearchParams({ q, role, banned, page: String(page - 1) }).toString()}`}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Önceki
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/users?${new URLSearchParams({ q, role, banned, page: String(page + 1) }).toString()}`}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sonraki
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
