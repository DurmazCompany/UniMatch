import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { AmbassadorApplication } from "@/lib/types";

export function useMyAmbassadorApplication() {
  return useQuery<AmbassadorApplication | null>({
    queryKey: ["ambassador-me"],
    queryFn: async () => {
      try {
        const res = await api.get<AmbassadorApplication>("/api/ambassador/me");
        return res ?? null;
      } catch {
        return null;
      }
    },
  });
}

export function useApplyAmbassador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      university: string;
      faculty: string;
      year: string;
      motivation: string;
      social_links?: { instagram?: string; twitter?: string };
    }) => api.post<AmbassadorApplication>("/api/ambassador/apply", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ambassador-me"] }),
  });
}
