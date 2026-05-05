import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { DeactivateEventButton } from "@/components/DeactivateEventButton";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { university?: string; active?: string };
}) {
  const university = searchParams.university?.trim() ?? "";
  const active = searchParams.active ?? "";

  const where: Record<string, unknown> = {};
  if (university) where.university = { contains: university };
  if (active === "yes") where.isActive = true;
  if (active === "no") where.isActive = false;

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
    include: { createdBy: true, _count: { select: { participants: true } } },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Etkinlikler</h1>

      <form className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Üniversite</label>
          <input
            name="university"
            defaultValue={university}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Aktif</label>
          <select
            name="active"
            defaultValue={active}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Hepsi</option>
            <option value="yes">Aktif</option>
            <option value="no">Deaktif</option>
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
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Üniversite</th>
              <th className="px-4 py-3">Yaratıcı</th>
              <th className="px-4 py-3">Katılımcı</th>
              <th className="px-4 py-3">Ücret</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Etkinlik yok.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(e.date), "yyyy-MM-dd")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.university ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.createdBy?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e._count.participants}
                    {e.maxAttendees ? ` / ${e.maxAttendees}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.isPaid ? `₺${e.ticketPrice ?? 0}` : "Ücretsiz"}
                  </td>
                  <td className="px-4 py-3">
                    {e.isActive ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">
                        Deaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.isActive && <DeactivateEventButton eventId={e.id} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
