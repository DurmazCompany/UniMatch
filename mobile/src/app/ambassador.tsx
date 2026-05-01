import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { theme } from "@/lib/theme";
import { api } from "@/lib/api/api";
import {
  ChevronLeft,
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  Crown,
  Star,
} from "lucide-react-native";

type ReferralStats = {
  referralCode: string;
  referralCount: number;
  isPremium: boolean;
  premiumUntil: string | null;
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.borderDefault,
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${accent}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function RewardRow({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderDefault,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${accent}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "600" }}>{title}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function AmbassadorScreen() {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading } = useQuery<ReferralStats | null>({
    queryKey: ["referral-stats"],
    queryFn: () => api.get<ReferralStats>("/api/referrals/stats"),
  });

  const referralCode = stats?.referralCode ?? "";
  const referralLink = `https://unimatch.app/join?ref=${referralCode}`;

  const handleCopy = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `UniMatch'te uni hayatını daha renkli yaşa! Referral kodum ile kayıt olursan ikimiz de 7 gün ücretsiz Premium kazanıyoruz 🎉\n\n${referralLink}`,
        url: referralLink,
      });
    } catch {
      // user cancelled
    }
  };

  const premiumUntilFormatted = stats?.premiumUntil
    ? new Date(stats.premiumUntil).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="ambassador-screen">
      {/* Header */}
      <LinearGradient
        colors={["#1A0D12", theme.background]}
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={22} color={theme.textPrimary} />
        </Pressable>
        <View>
          <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "800" }}>
            Ambassador
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
            Arkadaşlarını davet et, ödül kazan
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Premium status banner */}
            {stats?.isPremium && premiumUntilFormatted ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "rgba(232,68,90,0.12)",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(232,68,90,0.3)",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 20,
                }}
              >
                <Crown size={18} color={theme.primary} />
                <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "600", flex: 1 }}>
                  Premium aktif —{" "}
                  <Text style={{ color: theme.primary }}>{premiumUntilFormatted}</Text>'e kadar
                </Text>
              </View>
            ) : null}

            {/* Referral code */}
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Referral Kodun
            </Text>
            <Pressable
              onPress={handleCopy}
              testID="referral-code-copy"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: 24 })}
            >
              <LinearGradient
                colors={["#1E0E14", "#1A1A1A"]}
                style={{
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: copied ? theme.success : theme.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 34,
                    fontWeight: "800",
                    letterSpacing: 6,
                    fontFamily: "Syne_700Bold",
                  }}
                  testID="referral-code-text"
                >
                  {referralCode || "------"}
                </Text>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: copied ? `${theme.success}20` : `${theme.primary}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copied ? (
                    <Check size={20} color={theme.success} />
                  ) : (
                    <Copy size={20} color={theme.primary} />
                  )}
                </View>
              </LinearGradient>
            </Pressable>

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
              <StatCard
                icon={<Users size={20} color={theme.primary} />}
                label="Davet ettiğin kişi"
                value={String(stats?.referralCount ?? 0)}
                accent={theme.primary}
              />
              <StatCard
                icon={<Crown size={20} color="#FFD700" />}
                label="Kazanılan premium gün"
                value={`${(stats?.referralCount ?? 0) * 7}`}
                accent="#FFD700"
              />
            </View>

            {/* Rewards section */}
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Ödül Sistemi
            </Text>
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingTop: 4,
                borderWidth: 1,
                borderColor: theme.borderDefault,
                marginBottom: 28,
              }}
            >
              <RewardRow
                icon={<Crown size={18} color="#FFD700" />}
                title="Sen 7 gün ücretsiz Premium"
                subtitle="Her başarılı davet için sana eklenir"
                accent="#FFD700"
              />
              <RewardRow
                icon={<Gift size={18} color={theme.primary} />}
                title="Arkadaşın 3 gün ücretsiz Premium"
                subtitle="Kodunu kullanan kişi hemen Premium olur"
                accent={theme.primary}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${theme.online}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Star size={18} color={theme.online} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "600" }}>
                    Premium birikir
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    Süreler üst üste eklenir, sona ermez
                  </Text>
                </View>
              </View>
            </View>

            {/* Share button */}
            <Pressable
              onPress={handleShare}
              testID="share-button"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                marginBottom: 16,
              })}
            >
              <LinearGradient
                colors={["#E8445A", "#FF5E73"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                }}
              >
                <Share2 size={20} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                  Davet Linkini Paylaş
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Link preview */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: theme.borderDefault,
              }}
            >
              <Text
                style={{ color: theme.textPlaceholder, fontSize: 12, fontFamily: "PlusJakartaSans_400Regular" }}
                numberOfLines={1}
              >
                {referralLink}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
