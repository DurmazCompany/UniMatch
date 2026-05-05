"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { approveAmbassador, rejectAmbassador } from "@/app/ambassadors/actions";

type AppItem = {
  id: string;
  userId: string;
  university: string;
  faculty: string;
  year: string;
  motivation: string;
  socialLinks: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  profile: { id: string; name: string };
};

export function AmbassadorCard({ app }: { app: AppItem }) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const truncated =
    app.motivation.length > 200 && !expanded
      ? app.motivation.slice(0, 200) + "…"
      : app.motivation;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href={`/users/${app.profile.id}`}
            className="font-semibold text-lg hover:underline"
          >
            {app.profile.name}
          </Link>
          <p className="text-sm text-gray-600">
            {app.university} — {app.faculty} — {app.year}. yıl
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(app.createdAt), "yyyy-MM-dd HH:mm")}
          </p>
        </div>
        <span
          className={
            app.status === "pending"
              ? "px-2 py-1 rounded text-xs bg-orange-100 text-orange-700 font-medium"
              : app.status === "approved"
                ? "px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700 font-medium"
                : "px-2 py-1 rounded text-xs bg-red-100 text-red-700 font-medium"
          }
        >
          {app.status}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase text-gray-500 mb-1">Motivasyon</p>
        <p className="text-sm whitespace-pre-wrap">{truncated}</p>
        {app.motivation.length > 200 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            {expanded ? "Daralt" : "Devamını oku"}
          </button>
        )}
      </div>

      {app.socialLinks && (
        <div>
          <p className="text-xs uppercase text-gray-500 mb-1">Sosyal</p>
          <p className="text-xs font-mono text-gray-600">{app.socialLinks}</p>
        </div>
      )}

      {app.rejectionReason && (
        <div className="text-sm text-red-700">
          <strong>Red sebebi:</strong> {app.rejectionReason}
        </div>
      )}

      {app.status === "pending" && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await approveAmbassador(app.id);
              })
            }
            className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Onayla
          </button>
          <button
            type="button"
            onClick={() => setShowReject((v) => !v)}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reddet
          </button>
        </div>
      )}

      {showReject && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Red sebebi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
          <button
            type="button"
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                await rejectAmbassador(app.id, reason.trim());
                setShowReject(false);
                setReason("");
              })
            }
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50"
          >
            Reddet
          </button>
        </div>
      )}
    </div>
  );
}
