/**
 * privacyStore.ts — Gizlilik ve block yönetimi Zustand store'u.
 *
 * Mevcut pattern'a uygun olarak (bkz. example-state.ts):
 * - zustand/persist + AsyncStorage ile kalıcı hale getirilir
 * - api modülü (expo/fetch + authClient) kullanılır
 */

import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api/api";

interface BlockRecord {
  id: string;
  blockedId: string;
  createdAt: string;
}

interface PrivacyStore {
  /** Engellediğimiz kullanıcıların User.id listesi */
  blockedUsers: string[];

  /** Kullanıcıyı engelle → POST /api/blocks */
  blockUser: (userId: string) => Promise<void>;

  /** Engeli kaldır → DELETE /api/blocks/:userId */
  unblockUser: (userId: string) => Promise<void>;

  /** Store'u backend ile senkronize et → GET /api/blocks */
  syncBlocks: () => Promise<void>;

  /** Belirli bir kullanıcının engellenip engellenmediğini kontrol et */
  isBlocked: (userId: string) => boolean;
}

type PrivacyStateCreator = StateCreator<PrivacyStore, [["zustand/persist", unknown]]>;

const createPrivacyStore: PrivacyStateCreator = (set, get) => ({
  blockedUsers: [],

  blockUser: async (userId: string) => {
    // Optimistik güncelleme: önce local state'i değiştir
    set((state) => ({
      blockedUsers: state.blockedUsers.includes(userId)
        ? state.blockedUsers
        : [...state.blockedUsers, userId],
    }));

    try {
      await api.post<BlockRecord>("/api/blocks", { blockedId: userId });
    } catch (error) {
      // Hata durumunda rollback yap
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((id) => id !== userId),
      }));
      throw error;
    }
  },

  unblockUser: async (userId: string) => {
    // Optimistik güncelleme
    const previous = get().blockedUsers;
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((id) => id !== userId),
    }));

    try {
      await api.delete<null>(`/api/blocks/${userId}`);
    } catch (error) {
      // Rollback
      set({ blockedUsers: previous });
      throw error;
    }
  },

  syncBlocks: async () => {
    try {
      const blocks = await api.get<BlockRecord[]>("/api/blocks");
      if (blocks) {
        set({
          blockedUsers: blocks.map((b) => b.blockedId),
        });
      }
    } catch {
      // Sessizce başarısız ol — local cache geçerli kalsın
    }
  },

  isBlocked: (userId: string) => {
    return get().blockedUsers.includes(userId);
  },
});

export const usePrivacyStore = create<PrivacyStore>()(
  persist(createPrivacyStore, {
    name: "privacy-storage",
    storage: createJSONStorage(() => AsyncStorage),
    // Sadece blockedUsers'ı persist et; fonksiyonlar Zustand tarafından otomatik atlanır
    partialize: (state) => ({ blockedUsers: state.blockedUsers }),
  })
);
