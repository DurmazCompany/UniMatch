import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StatusBar } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { api } from "@/lib/api/api";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { UMCard, UMButton, TabSelector } from "@/components/ui";
import { CoinIcon, GIFT_ICONS, GiftId } from "@/components/icons/UnimatchIcons";
import { useWallet, formatCoinBalance } from "@/lib/hooks/useWallet";
import { CoinLedgerEntry, GiftSent } from "@/lib/types";

const TAB_OPTIONS: { value: "history" | "gifts"; label: string }[] = [
  { value: "history", label: "Geçmiş" },
  { value: "gifts", label: "Hediyeler" },
];

const REASON_LABELS: Record<string, string> = {
  gift_sent: "Hediye gönderildi",
  gift_received: "Hediye alındı",
  boost_purchase: "Boost satın alındı",
  monthly_credit: "Aylık coin kredisi",
  rc_purchase: "Coin satın alındı",
  admin_grant: "Hediye coin",
  refund: "İade",
  rewind_purchase: "Geri al satın alındı",
};

const REASON_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  gift_sent: "gift-outline",
  gift_received: "gift-outline",
  boost_purchase: "flash-outline",
  monthly_credit: "calendar-outline",
  rc_purchase: "wallet-outline",
  admin_grant: "star-outline",
  refund: "refresh-outline",
  rewind_purchase: "arrow-undo-outline",
};

function formatRelative(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm", { locale: tr });
  if (isYesterday(d)) return "Dün";
  return format(d, "d MMM", { locale: tr });
}

function parsePhotos(photos?: string): string[] {
  if (!photos) return [];
  try {
    return JSON.parse(photos) as string[];
  } catch {
    return [];
  }
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"history" | "gifts">("history");
  const { data: wallet, isLoading: walletLoading } = useWallet();

  const { data: history, isLoading: historyLoading } = useQuery<CoinLedgerEntry[] | null>({
    queryKey: ["wallet-history"],
    queryFn: async () => {
      try {
        return await api.get<CoinLedgerEntry[]>("/api/me/wallet/history?limit=50");
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const { data: receivedGifts, isLoading: giftsLoading } = useQuery<GiftSent[] | null>({
    queryKey: ["gifts-received"],
    queryFn: async () => {
      try {
        return await api.get<GiftSent[]>("/api/gifts/received?limit=50");
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const balance = wallet?.coin_balance ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="wallet-screen">
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            testID="wallet-back-button"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.white,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            })}
          >
            <Ionicons name="chevron-back-outline" size={20} color={Colors.textDark} />
          </Pressable>
          <Text
            style={{
              color: Colors.textDark,
              fontSize: 28,
              fontFamily: "DMSerifDisplay_400Regular",
            }}
          >
            Bakiyem
          </Text>
        </View>

        {/* Hero balance */}
        <View style={{ paddingHorizontal: 16, marginBottom: Spacing.lg }}>
          <UMCard style={{ alignItems: "center", paddingVertical: 28 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <CoinIcon size={40} />
              {walletLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text
                  style={{
                    color: Colors.textDark,
                    fontSize: 48,
                    fontFamily: "DMSerifDisplay_400Regular",
                  }}
                >
                  {formatCoinBalance(balance)}
                </Text>
              )}
            </View>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 13,
                fontFamily: "DMSans_500Medium",
                marginBottom: 18,
              }}
            >
              Toplam coin bakiyesi
            </Text>
            <View style={{ alignSelf: "stretch" }}>
              <UMButton
                variant="primary"
                label="+ Coin Yükle"
                icon="add-circle-outline"
                onPress={() => router.push("/paywall")}
              />
            </View>
          </UMCard>
        </View>

        {/* Tabs */}
        <View style={{ paddingHorizontal: 16, marginBottom: Spacing.lg }}>
          <TabSelector value={tab} onChange={setTab} options={TAB_OPTIONS} />
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 16 }}>
          {tab === "history" ? (
            historyLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (history?.length ?? 0) === 0 ? (
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: 14,
                  fontFamily: "DMSans_400Regular",
                  textAlign: "center",
                  paddingVertical: 32,
                }}
              >
                Henüz işlem yok
              </Text>
            ) : (
              (history ?? []).map((entry) => {
                const positive = entry.delta > 0;
                const iconName = REASON_ICONS[entry.reason] ?? "ellipse-outline";
                const label = REASON_LABELS[entry.reason] ?? entry.reason;
                return (
                  <UMCard key={entry.id} style={{ marginBottom: 8, padding: 14 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: Colors.primaryPale,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name={iconName} size={18} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: Colors.textDark,
                            fontSize: 14,
                            fontFamily: "DMSans_600SemiBold",
                          }}
                        >
                          {label}
                        </Text>
                        <Text
                          style={{
                            color: Colors.textMuted,
                            fontSize: 12,
                            fontFamily: "DMSans_400Regular",
                            marginTop: 2,
                          }}
                        >
                          {formatRelative(entry.createdAt)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: positive ? "#4CD964" : "#FF3B30",
                          fontSize: 15,
                          fontFamily: "DMSans_700Bold",
                        }}
                      >
                        {positive ? "+" : ""}
                        {entry.delta}
                      </Text>
                    </View>
                  </UMCard>
                );
              })
            )
          ) : giftsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (receivedGifts?.length ?? 0) === 0 ? (
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 14,
                fontFamily: "DMSans_400Regular",
                textAlign: "center",
                paddingVertical: 32,
              }}
            >
              Henüz hediye almadın
            </Text>
          ) : (
            (receivedGifts ?? []).map((gift) => {
              const senderName = gift.sender?.name ?? "Birisi";
              const giftName = gift.gift?.nameTr ?? "Hediye";
              const emoji = gift.gift?.emoji ?? "🎁";
              const giftId = gift.gift?.id;
              const Icon = giftId && (giftId in GIFT_ICONS) ? GIFT_ICONS[giftId as GiftId] : null;
              return (
                <UMCard key={gift.id} style={{ marginBottom: 8, padding: 14 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: Radius.card,
                        backgroundColor: Colors.primaryPale,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {Icon ? <Icon size={36} /> : <Text style={{ fontSize: 28 }}>{emoji}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: Colors.textDark,
                          fontSize: 14,
                          fontFamily: "DMSans_600SemiBold",
                        }}
                      >
                        {senderName} kişisinden {giftName}
                      </Text>
                      <Text
                        style={{
                          color: Colors.textMuted,
                          fontSize: 12,
                          fontFamily: "DMSans_400Regular",
                          marginTop: 2,
                        }}
                      >
                        {formatRelative(gift.createdAt)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <CoinIcon size={12} />
                      <Text
                        style={{
                          color: Colors.textMuted,
                          fontSize: 12,
                          fontFamily: "DMSans_500Medium",
                        }}
                      >
                        {gift.coinCost}
                      </Text>
                    </View>
                  </View>
                </UMCard>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// silence unused-import lint if not referenced
void parsePhotos;
