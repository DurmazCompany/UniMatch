import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { Profile, WhoLikedMeResponse } from "@/lib/types";
import { theme, gradients } from "@/lib/theme";

import { Bell, Shield, CircleHelp, LogOut, ChevronRight, Settings, Edit2, Camera, Flame, Lightbulb, Sunrise, Moon, BookOpen, Coffee, Leaf } from "lucide-react-native";

function ProfilePowerBar({ power }: { power: number }) {
  const pct = Math.min(power, 100);
  const color = pct < 40 ? theme.error : pct < 70 ? theme.warning : theme.success;
  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Profil Gücü</Text>
        <Text style={{ color, fontSize: 15, fontWeight: "800" }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: "hidden" }}>
        <LinearGradient
          colors={pct < 40 ? [theme.error, "#F97316"] : pct < 70 ? [theme.warning, "#FBBF24"] : ["#059669", theme.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${pct}%`, borderRadius: 4 }}
        />
      </View>
      {pct < 80 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 9 }}>
          <Lightbulb size={14} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
            Profilini %80&apos;e tamamlarsan 3x daha fazla kisiye gosterilirsin!
          </Text>
        </View>
      ) : null}
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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const invalidateSession = useInvalidateSession();
  const [campusPressed, setCampusPressed] = useState(false);

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const photos = parsePhotos(profile.photos);
  const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};
  const alreadyOnCampus = profile.isOnCampusToday || campusPressed;

  const getAge = () => {
    const diff = Date.now() - new Date(profile.birthDate).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="profile-screen">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: "700" }}>Profil</Text>
          <Pressable
            onPress={() => router.push("/(app)/edit-profile")}
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
            <Settings size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Profile avatar + info */}
        <View style={{ alignItems: "center", paddingBottom: 28 }}>
          <View style={{ position: "relative", marginBottom: 16 }}>
            {photos.length > 0 ? (
              <Image
                source={{ uri: photos[0] }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: theme.primary,
                }}
              />
            ) : (
              <LinearGradient
                colors={gradients.button}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 48, fontWeight: "700" }}>
                  {profile.name[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <Pressable
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: theme.background,
              }}
            >
              <Camera size={16} color="#fff" />
            </Pressable>
          </View>

          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700" }}>
            {profile.name}, {getAge()}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 15, marginTop: 4 }}>
            {profile.department} · {profile.year}. Sınıf
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
            {profile.university?.name}
          </Text>

          {/* Streak */}
          {profile.streakCount > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(245,158,11,0.1)",
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 7,
                marginTop: 14,
                gap: 6,
              }}
            >
              <Flame size={16} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 14, fontWeight: "700" }}>
                {profile.streakCount} gunluk streak
              </Text>
            </View>
          ) : null}

          {/* Edit Profile Button */}
          <Pressable
            testID="edit-profile-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(app)/edit-profile");
            }}
            style={({ pressed }) => ({
              marginTop: 16,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <LinearGradient
              colors={gradients.button}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 28,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Edit2 size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                  Profili Düzenle
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Profile power bar */}
          <ProfilePowerBar power={profile.profilePower} />

          {/* Who liked me */}
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              padding: 18,
              marginBottom: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
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
                    backgroundColor: `hsl(${(i * 120 + 340) % 360}, 70%, 65%)`,
                    marginLeft: i > 0 ? -12 : 0,
                    borderWidth: 3,
                    borderColor: theme.cardBackground,
                  }}
                />
              ))}
              {(whoLikedMe?.count ?? 0) > 3 ? (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.surface,
                    marginLeft: -12,
                    borderWidth: 2,
                    borderColor: theme.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "700" }}>
                    +{(whoLikedMe?.count ?? 0) - 3}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 12 }}>
              {whoLikedMe?.count ?? 0} kişi seni beğendi
            </Text>
            <Pressable
              testID="premium-upgrade-button"
              onPress={() => router.push("/paywall")}
              style={({ pressed }) => ({
                backgroundColor: "rgba(232,68,90,0.1)",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: "600", textAlign: "center" }}>
                Premium ile kimler beğendiğini gör
              </Text>
            </Pressable>
          </View>

          {/* Lifestyle info */}
          {lifestyle.schedule || lifestyle.spot ? (
            <View
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
                Yaşam Tarzı
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {lifestyle.schedule === "morning" ? (
                  <View style={chipStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Sunrise size={12} color={theme.primary} />
                      <Text style={chipText}>Sabahci</Text>
                    </View>
                  </View>
                ) : lifestyle.schedule === "night" ? (
                  <View style={chipStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Moon size={12} color={theme.primary} />
                      <Text style={chipText}>Gece Kusu</Text>
                    </View>
                  </View>
                ) : null}
                {lifestyle.spot === "library" ? (
                  <View style={chipStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <BookOpen size={12} color={theme.primary} />
                      <Text style={chipText}>Kutuphane</Text>
                    </View>
                  </View>
                ) : lifestyle.spot === "cafeteria" ? (
                  <View style={chipStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Coffee size={12} color={theme.primary} />
                      <Text style={chipText}>Kafeterya</Text>
                    </View>
                  </View>
                ) : lifestyle.spot === "outdoor" ? (
                  <View style={chipStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Leaf size={12} color={theme.primary} />
                      <Text style={chipText}>Disarisi</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Settings List */}
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              marginBottom: 24,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <SettingsItem icon={<Bell size={20} color={theme.textSecondary} />} label="Bildirimler" onPress={() => router.push("/(app)/settings/notifications")} />
            <SettingsItem icon={<Shield size={20} color={theme.textSecondary} />} label="Gizlilik ve Güvenlik" />
            <SettingsItem icon={<CircleHelp size={20} color={theme.textSecondary} />} label="Yardım ve Destek" />
            <SettingsItem
              icon={<LogOut size={20} color={theme.error} />}
              label="Çıkış Yap"
              onPress={handleSignOut}
              isLast
              isDestructive
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  onPress,
  isLast,
  isDestructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.borderDefault,
        backgroundColor: pressed ? theme.surface : "transparent",
      })}
    >
      <View style={{ width: 36 }}>{icon}</View>
      <Text style={{ flex: 1, color: isDestructive ? theme.error : theme.textPrimary, fontSize: 16, fontWeight: "500" }}>
        {label}
      </Text>
      {!isDestructive ? <ChevronRight size={18} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

const chipStyle = {
  backgroundColor: "rgba(232,68,90,0.08)",
  borderRadius: 100,
  paddingHorizontal: 12,
  paddingVertical: 6,
} as const;

const chipText = {
  color: theme.primary,
  fontSize: 13,
  fontWeight: "600" as const,
};
