import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { GiftSent } from "@/lib/types";

interface SendGiftPayload {
  receiver_id: string;
  gift_id: string;
  match_id?: string;
}

export function useSendGift() {
  const qc = useQueryClient();
  return useMutation<GiftSent | null, unknown, SendGiftPayload>({
    mutationFn: (payload) => api.post<GiftSent>("/api/gifts/send", payload),
    onSuccess: (_data, vars) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      if (vars.match_id) {
        qc.invalidateQueries({ queryKey: ["chat", vars.match_id] });
        qc.invalidateQueries({ queryKey: ["gifts-by-match", vars.match_id] });
      }
      qc.invalidateQueries({ queryKey: ["gifts-received"] });
    },
  });
}
