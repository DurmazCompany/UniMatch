import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { EventModel, EventInvitation } from "@/lib/types";

export function useEvents(university?: string) {
  return useQuery<EventModel[]>({
    queryKey: ["events", university ?? null],
    queryFn: async () => {
      const url = `/api/events${
        university ? `?university=${encodeURIComponent(university)}` : ""
      }`;
      const res = await api.get<EventModel[]>(url);
      return res ?? [];
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      date: string;
      location: string;
      university?: string;
      capacity?: number;
      coverUrl?: string;
    }) => api.post<EventModel>("/api/events", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useInviteToEvent() {
  return useMutation({
    mutationFn: ({
      eventId,
      receiverId,
      matchId,
    }: {
      eventId: string;
      receiverId: string;
      matchId?: string;
    }) =>
      api.post(`/api/events/${eventId}/invite`, {
        receiver_id: receiverId,
        match_id: matchId,
      }),
  });
}

export function useRespondToInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      invId,
      status,
    }: {
      eventId: string;
      invId: string;
      status: "accepted" | "declined";
    }) =>
      api.post(`/api/events/${eventId}/invitations/${invId}/respond`, { status }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event-invitations"] });
      qc.invalidateQueries({ queryKey: ["chat"] });
      void variables;
    },
  });
}

export function useMatchInvitations(matchId: string | undefined) {
  return useQuery<EventInvitation[]>({
    queryKey: ["event-invitations", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      try {
        const res = await api.get<EventInvitation[]>(
          `/api/events/invitations/by-match/${matchId}`
        );
        return res ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });
}
