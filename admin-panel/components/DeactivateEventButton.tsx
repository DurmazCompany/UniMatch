"use client";

import { useTransition } from "react";
import { deactivateEvent } from "@/app/events/actions";

export function DeactivateEventButton({ eventId }: { eventId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Etkinliği deaktif etmek istediğinden emin misin?")) return;
        start(async () => {
          await deactivateEvent(eventId);
        });
      }}
      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
    >
      Deaktif Et
    </button>
  );
}
