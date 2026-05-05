import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type TierId = "crush" | "flort" | "ask";

export interface TierFeature {
  icon: IconName;
  text: string;
  included: boolean;
}

export interface TierDefinition {
  id: TierId;
  storeId: string | null; // RC product identifier; null for free
  name: string;
  price: string;
  period: string;
  perMonthHint?: string;
  savings?: string;
  isFree?: boolean;
  isRecommended?: boolean;
  accentColor: string;
  features: TierFeature[];
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: "crush",
    storeId: null,
    name: "Crush",
    price: "Ücretsiz",
    period: "",
    isFree: true,
    accentColor: "#8B8BAA",
    features: [
      { icon: "heart-outline", text: "Günlük 10 beğeni", included: true },
      { icon: "refresh-outline", text: "Geri alma yok", included: false },
      { icon: "flash-outline", text: "Boost yok", included: false },
      { icon: "eye-outline", text: "Kim beğendi göremez", included: false },
      { icon: "wallet-outline", text: "Aylık coin yok", included: false },
      { icon: "eye-off-outline", text: "Görünmezlik yok", included: false },
    ],
  },
  {
    id: "flort",
    storeId: "unimatch_flort_monthly",
    name: "Flört",
    price: "₺79,99",
    period: "/ay",
    isRecommended: true,
    accentColor: "#7C6FF7",
    features: [
      { icon: "infinite-outline", text: "Sınırsız beğeni", included: true },
      { icon: "refresh-outline", text: "Günlük 3 geri alma", included: true },
      { icon: "flash-outline", text: "Aylık 3 boost", included: true },
      { icon: "eye-outline", text: "Aylık 10 kim beğendi", included: true },
      { icon: "wallet-outline", text: "Aylık 2.000 coin", included: true },
      { icon: "eye-off-outline", text: "Görünmezlik yok", included: false },
    ],
  },
  {
    id: "ask",
    storeId: "unimatch_ask_yearly",
    name: "Aşk",
    price: "₺58",
    period: "/ay",
    perMonthHint: "Yıllık ödenir · ₺699/yıl",
    savings: "%27 tasarruf",
    accentColor: "#FFD700",
    features: [
      { icon: "infinite-outline", text: "Sınırsız beğeni", included: true },
      { icon: "refresh-outline", text: "Sınırsız geri alma", included: true },
      { icon: "flash-outline", text: "Aylık 10 boost", included: true },
      { icon: "eye-outline", text: "Sınırsız kim beğendi", included: true },
      { icon: "wallet-outline", text: "Aylık 5.000 coin", included: true },
      { icon: "eye-off-outline", text: "Görünmezlik modu", included: true },
    ],
  },
];

export interface CoinPackage {
  id: string;
  storeId: string;
  coins: number;
  price: string;
  badge?: string;
  bestValue?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coins_400", storeId: "coins_400", coins: 560, price: "₺49,99", badge: "+%40 BONUS" },
  { id: "coins_750", storeId: "coins_750", coins: 750, price: "₺79,99" },
  { id: "coins_1700", storeId: "coins_1700", coins: 2550, price: "₺199,99", badge: "+%50 BONUS", bestValue: true },
];
