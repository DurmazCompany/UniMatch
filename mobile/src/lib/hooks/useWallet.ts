import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

export interface Wallet {
  coin_balance: number;
  tier: "crush" | "flort" | "ask";
  expires_at: string | null;
  is_invisible: boolean;
  is_banned: boolean;
  quotas: {
    likes_left_today: number; // -1 = unlimited
    rewinds_left_today: number;
    boosts_left_period: number;
    who_liked_views_left: number;
    boost_active_until: string | null;
  };
}

export function useWallet() {
  return useQuery<Wallet | null>({
    queryKey: ["wallet"],
    queryFn: () => api.get<Wallet>("/api/me/wallet"),
    staleTime: 30_000,
  });
}

export function formatCoinBalance(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`.replace(".0K", "K");
  }
  return String(n);
}
