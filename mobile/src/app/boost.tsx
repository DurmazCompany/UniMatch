import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Radius } from "@/lib/theme";
import { UMCard, UMButton } from "@/components/ui";
import { api } from "@/lib/api/api";
import { useWallet, formatCoinBalance } from "@/lib/hooks/useWallet";
import { openPaywallOnError } from "@/lib/hooks/usePaywallOnError";

const COIN_PACKS: { size: 1 | 3 | 10; cost: number; label: string; sub: string; badge?: string }[] = [
  { size: 1, cost: 750, label: "1× 30 dk", sub: "750 coin" },
  { size: 3, cost: 2000, label: "3× paket", sub: "2.000 coin", badge: "fırsat" },
  { size: 10, cost: 6000, label: "10× paket", sub: "6.000 coin", badge: "en iyi" },
];

function formatCountdown(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function BoostScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: wallet } = useWallet();

  const boostUntil = wallet?.quotas.boost_active_until
    ? new Date(wallet.quotas.boost_active_until)
    : null;
  const isActive = boostUntil ? boostUntil.getTime() > Date.now() : false;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const tier = wallet?.tier ?? "crush";
  const subQuotaLeft = wallet?.quotas.boosts_left_period ?? 0;
  const isPremium = tier !== "crush";
  const subQuotaUnlimited = subQuotaLeft === -1;

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const activateMutation = useMutation({
    mutationFn: (vars: { use_subscription: boolean; pack_size?: 1 | 3 | 10 }) =>
      api.post<{ boost_active_until: string }>("/api/boosts/activate", vars),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast("Boostun başladı 🚀");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => {
      if (!openPaywallOnError(err)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setToast("Bir şeyler ters gitti");
      }
    },
  });

  const handleSubscriptionBoost = () => {
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    if (!subQuotaUnlimited && subQuotaLeft <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    activateMutation.mutate({ use_subscription: true });
  };

  const handlePackBoost = (pack_size: 1 | 3 | 10) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    activateMutation.mutate({ use_subscription: false, pack_size });
  };

  const balance = wallet?.coin_balance ?? 0;

  const countdownText = useMemo(() => {
    if (!boostUntil) return "";
    return formatCountdown(boostUntil);
  }, [boostUntil, isActive]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="boost-screen">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="boost-back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceDark,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back-outline" size={20} color={Colors.textOnDark} />
        </Pressable>
        <Text style={{ color: Colors.textOnDark, fontSize: 22, fontFamily: "DMSerifDisplay_400Regular" }}>
          Boost
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active boost countdown */}
        {isActive && boostUntil ? (
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: Radius.card,
              padding: Spacing.xl,
              marginTop: Spacing.md,
              marginBottom: Spacing.xl,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Ionicons name="flash" size={22} color={Colors.white} />
              <Text style={{ color: Colors.white, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
                Boostun aktif
              </Text>
            </View>
            <Text style={{ color: Colors.white, fontSize: 36, fontFamily: "DMSans_700Bold" }}>
              {countdownText}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4 }}>
              dakika kaldı
            </Text>
          </LinearGradient>
        ) : null}

        {/* Coin balance */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: Spacing.md,
            marginBottom: Spacing.sm,
            gap: 6,
          }}
        >
          <Ionicons name="wallet-outline" size={14} color={Colors.textOnDarkMuted} />
          <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
            Bakiye: {formatCoinBalance(balance)} coin
          </Text>
        </View>

        <Text
          style={{
            color: Colors.textOnDark,
            fontSize: 18,
            fontFamily: "DMSans_700Bold",
            marginBottom: Spacing.md,
          }}
        >
          Boost Başlat
        </Text>

        {/* Subscription quota row */}
        {isPremium ? (
          <UMCard dark style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(124,111,247,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="flash-outline" size={20} color={Colors.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_700Bold" }}>
                  Aboneliğinle başlat
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
                  {subQuotaUnlimited
                    ? "Sınırsız"
                    : subQuotaLeft > 0
                    ? `${subQuotaLeft} kaldı`
                    : "Bu ayki hakkın bitti"}
                </Text>
              </View>
            </View>
            <UMButton
              variant="primary"
              label={
                subQuotaUnlimited
                  ? "Boostu başlat"
                  : subQuotaLeft > 0
                  ? `Boostu başlat (${subQuotaLeft} kaldı)`
                  : "Hak yok"
              }
              onPress={handleSubscriptionBoost}
              disabled={(!subQuotaUnlimited && subQuotaLeft <= 0) || activateMutation.isPending}
            />
          </UMCard>
        ) : (
          <UMCard dark style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textOnDarkMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_700Bold" }}>
                  Abonelik boostu
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
                  Premium üyelerin ayda 3 ücretsiz boostu var
                </Text>
              </View>
            </View>
            <UMButton
              variant="ghost"
              label="Premium'a yükselt"
              onPress={() => router.push("/paywall")}
            />
          </UMCard>
        )}

        {/* Coin packs */}
        <Text
          style={{
            color: Colors.textOnDark,
            fontSize: 16,
            fontFamily: "DMSans_700Bold",
            marginBottom: Spacing.sm,
          }}
        >
          Coin ile başlat
        </Text>

        <View style={{ gap: 10, marginBottom: Spacing.xl }}>
          {COIN_PACKS.map((p) => {
            const canAfford = balance >= p.cost;
            return (
              <UMCard key={p.size} dark>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "rgba(124,111,247,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="flash" size={20} color={Colors.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_700Bold" }}>
                        {p.label}
                      </Text>
                      {p.badge ? (
                        <View
                          style={{
                            backgroundColor: "rgba(232,99,90,0.18)",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: Radius.tag,
                          }}
                        >
                          <Text style={{ color: Colors.coral, fontSize: 10, fontFamily: "DMSans_700Bold" }}>
                            {p.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
                      {p.sub}
                    </Text>
                  </View>
                  <View style={{ minWidth: 110 }}>
                    <UMButton
                      variant={canAfford ? "secondary" : "ghost"}
                      label={canAfford ? "Başlat" : "Yetersiz"}
                      onPress={() => handlePackBoost(p.size)}
                      disabled={!canAfford || activateMutation.isPending}
                    />
                  </View>
                </View>
              </UMCard>
            );
          })}
        </View>

        <Text
          style={{
            color: Colors.textOnDarkMuted,
            fontSize: 12,
            fontFamily: "DMSans_400Regular",
            textAlign: "center",
            lineHeight: 18,
            marginBottom: Spacing.lg,
          }}
        >
          Boost aktifken profilin daha fazla kişiye gösterilir.
        </Text>
      </ScrollView>

      {/* Toast */}
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: insets.bottom + 24,
            left: 24,
            right: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: Colors.surfaceDark,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
              {toast}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
