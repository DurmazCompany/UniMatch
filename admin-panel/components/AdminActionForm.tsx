"use client";

import { useState, useTransition } from "react";
import {
  banUser,
  unbanUser,
  grantPremium,
  revokePremium,
  changeRole,
} from "@/app/users/[id]/actions";

export function AdminActionForm({
  profileId,
  currentTier,
  currentRole,
  isBanned,
}: {
  profileId: string;
  currentTier: string;
  currentRole: string;
  isBanned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showBan, setShowBan] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [showRole, setShowRole] = useState(false);

  const [banReason, setBanReason] = useState("");
  const [banUntil, setBanUntil] = useState("");

  const [tier, setTier] = useState<"flort" | "ask">("flort");
  const [until, setUntil] = useState("");

  const [role, setRole] = useState<"user" | "ambassador" | "admin">(
    (currentRole as "user" | "ambassador" | "admin") ?? "user",
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-lg">Admin Aksiyonları</h2>

      <div className="flex flex-wrap gap-2">
        {isBanned ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await unbanUser(profileId);
              })
            }
            className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Banı Kaldır
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowBan((v) => !v)}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Banla
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowGrant((v) => !v)}
          className="px-3 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Manuel Premium Ver
        </button>

        {currentTier !== "crush" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await revokePremium(profileId);
              })
            }
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            Premium İptal Et
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowRole((v) => !v)}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Rol Değiştir
        </button>
      </div>

      {showBan && !isBanned && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Ban Sebebi</h3>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Sebep"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Bitiş tarihi (opsiyonel)
            </label>
            <input
              type="date"
              value={banUntil}
              onChange={(e) => setBanUntil(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            disabled={pending || !banReason.trim()}
            onClick={() =>
              startTransition(async () => {
                await banUser(
                  profileId,
                  banReason.trim(),
                  banUntil ? new Date(banUntil) : undefined,
                );
                setShowBan(false);
                setBanReason("");
                setBanUntil("");
              })
            }
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50"
          >
            Banla
          </button>
        </div>
      )}

      {showGrant && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Premium Ver</h3>
          <div className="flex gap-3">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "flort" | "ask")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="flort">flort</option>
              <option value="ask">ask</option>
            </select>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            disabled={pending || !until}
            onClick={() =>
              startTransition(async () => {
                await grantPremium(profileId, tier, new Date(until));
                setShowGrant(false);
                setUntil("");
              })
            }
            className="px-3 py-2 text-sm bg-amber-500 text-white rounded-lg disabled:opacity-50"
          >
            Ver
          </button>
        </div>
      )}

      {showRole && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Rol Değiştir</h3>
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "user" | "ambassador" | "admin")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="user">user</option>
            <option value="ambassador">ambassador</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await changeRole(profileId, role);
                setShowRole(false);
              })
            }
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
