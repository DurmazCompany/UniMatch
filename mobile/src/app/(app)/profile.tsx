import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StatusBar } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { Profile, WhoLikedMeResponse } from "@/lib/types";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { UMAvatar, UMCard, UMButton } from "@/components/ui";
import { getZodiacSign, getZodiacInfo } from "@/lib/astrology";
import { useScreenProtection } from "@/lib/hooks/useScreenProtection";
import { usePrivacyStore } from "@/lib/state/privacyStore";
import { Alert } from "react-native";

const ERROR_RED = "#FF6B6B";
const SUCCESS_GREEN = "#4CD964";
const WARN_YELLOW = "#FFCC00";

function ProfilePowerBar({ power }: { power: number }) {
  const pct = Math.min(power, 100);
  const color = pct < 40 ? ERROR_RED : pct < 70 ? WARN_YELLOW : SUCCESS_GREEN;
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(2, { duration: 1200 })),
        withTiming(-1, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [-1, 0.5, 1.5, 2], [0, 0.6, 0.6, 0]),
    left: `${interpolate(shimmer.value, [-1, 2], [-20, 120])}%`,
  }));

  return (
    <UMCard dark style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_700Bold" }}>Profil Gücü</Text>
        <Text style={{ color, fontSize: 15, fontFamily: "DMSans_700Bold" }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
        <LinearGradient
          colors={
            pct < 40
              ? [ERROR_RED, "#F97316"]
              : pct < 70
              ? [WARN_YELLOW, "#FBBF24"]
              : ["#34D399", SUCCESS_GREEN]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${pct}%`, borderRadius: 4, overflow: "hidden" }}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "20%",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 4,
              },
              shimmerStyle,
            ]}
          />
        </LinearGradient>
      </View>
      {pct < 80 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
          <Ionicons name="bulb-outline" size={14} color={Colors.textOnDarkMuted} />
          <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18, flex: 1 }}>
            Profilini %80&apos;e tamamlarsan 3x daha fazla kişiye gösterilirsin!
          </Text>
        </View>
      ) : null}
    </UMCard>
  );
}

function ZodiacSection({ birthDate }: { birthDate: string }) {
  const sign = getZodiacSign(birthDate);
  const info = getZodiacInfo(sign);

  const elementColors: Record<string, [string, string]> = {
    fire: [Colors.coral, "#FF8C00"],
    earth: ["#4CAF50", "#2E7D32"],
    air: ["#29B6F6", "#0288D1"],
    water: [Colors.primary, Colors.primaryDark],
  };
  const [gradStart, gradEnd] = elementColors[info.element] ?? [Colors.coral, "#FF5E73"];

  return (
    <View
      style={{
        backgroundColor: Colors.cardDark,
        borderRadius: Radius.card,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <LinearGradient colors={[`${gradStart}33`, "transparent"]} style={{ padding: Spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <LinearGradient
            colors={[gradStart, gradEnd]}
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 22 }}>{info.symbol}</Text>
          </LinearGradient>
          <View>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
              Burç
            </Text>
            <Text style={{ color: Colors.textOnDark, fontSize: 20, fontFamily: "DMSans_700Bold" }}>
              {info.symbol} {info.turkishName}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8, marginBottom: 12 }}>
          {info.traits.map((trait, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: gradStart }} />
              <Text style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 }}>
                {trait}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ color: Colors.textOnDarkMuted, fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5, marginBottom: 4 }}>
            İLİŞKİ TARZI
          </Text>
          <Text style={{ color: Colors.textOnDark, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 }}>
            {info.relationshipStyle}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function parsePhotos(photos: string | string[]): string[] {
  if (Array.isArray(photos)) return photos;
  try {
    return JSON.parse(photos) as string[];
  } catch {
    return [];
  }
}

export default function ProfileScreen() {
  useScreenProtection();

  const blockUser = usePrivacyStore((state) => state.blockUser);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();
  const [campusPressed, setCampusPressed] = useState(false);

  const streakGlow = useSharedValue(0);
  useEffect(() => {
    streakGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.4, { duration: 1200 })),
      -1,
      false
    );
  }, []);
  const streakGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(streakGlow.value, [0, 1], [0.3, 0.7]),
    shadowRadius: interpolate(streakGlow.value, [0, 1], [6, 16]),
  }));

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        const result = await api.get<Profile>("/api/profile");
        return result ?? null;
      } catch {
        return null;
      }
    },
  });

  const { data: whoLikedMe } = useQuery<WhoLikedMeResponse | null>({
    queryKey: ["who-liked-me"],
    queryFn: async () => {
      try {
        const result = await api.get<WhoLikedMeResponse>("/api/campus/who-liked-me");
        return result ?? null;
      } catch {
        return null;
      }
    },
  });

  const campusMutation = useMutation({
    mutationFn: () => api.post("/api/campus/im-here", {}),
    onSuccess: () => {
      setCampusPressed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    await invalidateSession();
    router.replace("/");
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    Alert.alert(
      "Kullanıcıyı Engelle",
      "Bu kullanıcıyı engellemek istediğinize emin misiniz? (Bir daha eşleşemezsiniz)",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(profile.userId);
              Alert.alert("Başarılı", "Kullanıcı engellendi.");
              if (router.canGoBack()) {
                router.back();
              }
            } catch (error: any) {
              Alert.alert("Hata", error.message || "Engelleme işlemi başarısız oldu.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) return null;

  const photos = parsePhotos(profile.photos);
  const alreadyOnCampus = profile.isOnCampusToday || campusPressed;

  const getAge = () => {
    const diff = Date.now() - new Date(profile.birthDate).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="profile-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: Colors.textOnDark, fontSize: 28, fontFamily: "DMSerifDisplay_400Regular" }}>Profilim</Text>
          <Pressable
            onPress={() => router.push("/(app)/edit-profile")}
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
            <Ionicons name="settings-outline" size={20} color={Colors.textOnDark} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Profile card */}
          <UMCard dark style={{ alignItems: "center", marginBottom: 14, paddingTop: 24, paddingBottom: 20 }}>
            <View style={{ position: "relative", marginBottom: 14 }}>
              <UMAvatar uri={photos[0]} size="xl" ring fallback={profile.name} />
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(app)/edit-profile");
                }}
                style={({ pressed }) => ({
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: Colors.cardDark,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="camera-outline" size={16} color={Colors.white} />
              </Pressable>
            </View>

            <Text style={{ color: Colors.textOnDark, fontSize: 24, fontFamily: "DMSans_700Bold" }}>
              {profile.name}, {getAge()}
            </Text>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 15, fontFamily: "DMSans_400Regular", marginTop: 4 }}>
              {profile.department} · {profile.year}. Sınıf
            </Text>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
              {profile.university}
            </Text>

            {profile.streakCount > 0 ? (
              <Animated.View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,149,0,0.12)",
                    borderRadius: Radius.tag,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 14,
                    gap: 6,
                    shadowColor: "#FF9500",
                    shadowOffset: { width: 0, height: 0 },
                    borderWidth: 1,
                    borderColor: "rgba(255,149,0,0.3)",
                  },
                  streakGlowStyle,
                ]}
              >
                <Ionicons name="flame-outline" size={16} color="#FF9500" />
                <Text style={{ color: "#FF9500", fontSize: 14, fontFamily: "DMSans_700Bold" }}>
                  {profile.streakCount} günlük streak
                </Text>
              </Animated.View>
            ) : null}

            <View style={{ marginTop: 18, alignSelf: "stretch" }}>
              <UMButton
                variant="primary"
                label="Profili Düzenle"
                icon="create-outline"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(app)/edit-profile");
                }}
              />
            </View>
          </UMCard>

          {/* Profile power */}
          <ProfilePowerBar power={profile.profilePower} />

          {/* Zodiac */}
          <ZodiacSection birthDate={profile.birthDate} />

          {/* Who liked me */}
          <UMCard dark style={{ marginBottom: 14 }}>
            <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_700Bold", marginBottom: 12 }}>
              Seni Beğenenler
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: i === 0 ? Colors.primaryLight : i === 1 ? Colors.primary : Colors.coral,
                    marginLeft: i > 0 ? -14 : 0,
                    borderWidth: 3,
                    borderColor: Colors.cardDark,
                  }}
                />
              ))}
              {(whoLikedMe?.count ?? 0) > 3 ? (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.surfaceDark,
                    marginLeft: -14,
                    borderWidth: 2,
                    borderColor: Colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: Colors.primaryLight, fontSize: 12, fontFamily: "DMSans_700Bold" }}>
                    +{(whoLikedMe?.count ?? 0) - 3}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 14 }}>
              {whoLikedMe?.count ?? 0} kişi seni beğendi
            </Text>
            <Pressable
              testID="premium-upgrade-button"
              onPress={() => router.push("/paywall")}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <UMButton variant="ghost" label="Premium ile gör" onPress={() => router.push("/paywall")} />
            </Pressable>
          </UMCard>

          {/* Settings list */}
          <UMCard dark style={{ padding: 0, marginBottom: Spacing.xxl, overflow: "hidden" }}>
            <SettingsItem
              iconName="notifications-outline"
              label="Bildirimler"
              onPress={() => router.push("/(app)/settings/notifications")}
            />
            <SettingsItem iconName="shield-checkmark-outline" label="Gizlilik ve Güvenlik" />
            <SettingsItem iconName="help-circle-outline" label="Yardım ve Destek" />
            <SettingsItem
              iconName="ban-outline"
              label="Engelle"
              onPress={handleBlockUser}
              isDestructive
            />
            <SettingsItem
              iconName="log-out-outline"
              label="Çıkış Yap"
              onPress={handleSignOut}
              isLast
              isDestructive
            />
          </UMCard>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsItem({
  iconName,
  label,
  onPress,
  isLast,
  isDestructive,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
}) {
  const color = isDestructive ? ERROR_RED : Colors.textOnDark;
  const iconBg = isDestructive ? "rgba(255,107,107,0.12)" : "rgba(124,111,247,0.15)";
  const iconColor = isDestructive ? ERROR_RED : Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        gap: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: pressed ? "rgba(255,255,255,0.03)" : "transparent",
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          color,
          fontSize: 15,
          fontFamily: "DMSans_600SemiBold",
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
      {!isDestructive ? <Ionicons name="chevron-forward-outline" size={18} color={Colors.textOnDarkMuted} /> : null}
    </Pressable>
  );
}
