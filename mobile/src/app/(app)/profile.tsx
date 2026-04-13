import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
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

import { Bell, Shield, CircleHelp, LogOut, ChevronRight, Settings } from "lucide-react-native";

const BADGES = [
  { id: "verified", label: "Doğrulanmış", icon: "✓", condition: (p: Profile) => p.selfieVerified, color: theme.success },
  { id: "active", label: "Aktif", icon: "🔥", condition: (p: Profile) => p.streakCount >= 7, color: theme.warning },
  { id: "complete", label: "Tam Profil", icon: "⭐", condition: (p: Profile) => p.profilePower >= 100, color: theme.primary },
];

function ProfilePowerBar({ power }: { power: number }) {
  const pct = Math.min(power, 100);
  const color = pct < 40 ? theme.error : pct < 70 ? theme.warning : theme.success;
  return (
    <View
      style={{
        backgroundColor: "#1A1A1A",
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Profil Gücü</Text>
        <Text style={{ color, fontSize: 15, fontWeight: "800" }}>{pct}%</Text>
      </View>
      <View style={{ height: 7, backgroundColor: "#0D0D0D", borderRadius: 4, overflow: "hidden" }}>
        <LinearGradient
          colors={pct < 40 ? [theme.error, "#F97316"] : pct < 70 ? [theme.warning, "#FBBF24"] : ["#059669", theme.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${pct}%`, borderRadius: 4 }}
        />
      </View>
      {pct < 80 ? (
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 9, lineHeight: 18 }}>
          💡 Profilini %80&apos;e tamamlarsan 3x daha fazla kişiye gösterilirsin!
        </Text>
      ) : null}
    </View>
  );
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

  const photos = JSON.parse(profile.photos || "[]") as string[];
  const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};
  const earnedBadges = BADGES.filter((b) => b.condition(profile));
  const alreadyOnCampus = profile.isOnCampusToday || campusPressed;

  const getAge = () => {
    const diff = Date.now() - new Date(profile.birthDate).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="profile-screen">
      <LinearGradient
        colors={gradients.background}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontFamily: "Syne_700Bold" }}>Profilim</Text>
        </View>

        {/* Profile avatar + info */}
        <View style={{ alignItems: "center", paddingBottom: 28 }}>
          <LinearGradient
            colors={gradients.button}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800" }}>
              {profile.name[0]?.toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={{ color: theme.textPrimary, fontSize: 22, fontFamily: "Syne_700Bold" }}>
            {profile.name}, {getAge()}
          </Text>
          <Text style={{ color: theme.accent, fontSize: 14, marginTop: 4 }}>
            {profile.department} · {profile.year}. Sınıf
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
            {profile.university?.name}
          </Text>

          {/* Streak */}
          {profile.streakCount > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(245,158,11,0.12)",
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 7,
                marginTop: 12,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={{ color: theme.warning, fontSize: 14, fontWeight: "700" }}>
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
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 100,
              borderWidth: 1.5,
              borderColor: theme.primary,
              backgroundColor: "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: theme.primary, fontSize: 14, fontWeight: "600" }}>
              Profili Duzenle
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Profile power bar */}
          <ProfilePowerBar power={profile.profilePower} />

          {/* Badges */}
          {earnedBadges.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: theme.borderDefault,
              }}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
                Rozetler
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {earnedBadges.map((badge) => (
                  <View
                    key={badge.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: `${badge.color}18`,
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      gap: 5,
                      borderWidth: 1,
                      borderColor: `${badge.color}40`,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{badge.icon}</Text>
                    <Text style={{ color: badge.color, fontSize: 13, fontWeight: "600" }}>
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* On campus button */}
          <Pressable
            testID="on-campus-button"
            onPress={() => !alreadyOnCampus && campusMutation.mutate()}
            disabled={alreadyOnCampus || campusMutation.isPending}
            style={({ pressed }) => ({ opacity: pressed && !alreadyOnCampus ? 0.8 : 1, marginBottom: 14 })}
          >
            <LinearGradient
              colors={alreadyOnCampus ? ["#1E1E1E", "#1E1E1E"] : gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ color: alreadyOnCampus ? theme.textSecondary : "#fff", fontSize: 16, fontWeight: "700" }}>
                {alreadyOnCampus ? "✓ Bugün kampüstesin" : "🏫 Bugün Kampüsteydim"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Who liked me */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
              Beni Beğenenler
            </Text>
            {whoLikedMe?.isPremium ? (
              <>
                {/* Premium: show actual profile photos */}
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  {whoLikedMe.likers.slice(0, 4).map((liker, i) => {
                    const likerPhotos = liker.photos || [];
                    const firstPhoto = likerPhotos[0];
                    return (
                      <Pressable
                        key={liker.id}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          marginLeft: i > 0 ? -14 : 0,
                          borderWidth: 2,
                          borderColor: theme.primary,
                          backgroundColor: theme.surface,
                          overflow: "hidden",
                        }}
                      >
                        {firstPhoto && firstPhoto !== "blur" ? (
                          <View
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: `hsl(${(i * 90) % 360}, 60%, 50%)`,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                              {liker.name?.[0]?.toUpperCase() || "?"}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: `hsl(${(i * 90) % 360}, 60%, 50%)`,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                              {liker.name?.[0]?.toUpperCase() || "?"}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                  {whoLikedMe.count > 4 ? (
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: theme.surface,
                        marginLeft: -14,
                        borderWidth: 1.5,
                        borderColor: theme.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>
                        +{whoLikedMe.count - 4}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 12 }}>
                  {whoLikedMe.count} kişi seni beğendi
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(16,185,129,0.12)",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "rgba(16,185,129,0.3)",
                  }}
                >
                  <Text style={{ color: theme.success, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                    Premium aktif - Tüm profilleri görebilirsin
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Not premium: show blurred avatars */}
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: `hsl(${(i * 120) % 360}, 60%, 40%)`,
                        marginLeft: i > 0 ? -14 : 0,
                        opacity: 0.5,
                        borderWidth: 2,
                        borderColor: theme.background,
                      }}
                    />
                  ))}
                  {whoLikedMe?.count && whoLikedMe.count > 3 ? (
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: theme.surface,
                        marginLeft: -14,
                        borderWidth: 1.5,
                        borderColor: theme.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>
                        +{whoLikedMe.count - 3}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 12 }}>
                  {whoLikedMe?.count ?? 0} kişi seni beğendi
                </Text>
                <Pressable
                  testID="premium-upgrade-button"
                  style={({ pressed }) => ({
                    backgroundColor: "rgba(225,29,72,0.12)",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "rgba(225,29,72,0.3)",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                    Premium ile kimler beğendiğini gör
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Lifestyle info */}
          {lifestyle.schedule || lifestyle.spot ? (
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: theme.borderDefault,
              }}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
                Yaşam Tarzı
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {lifestyle.schedule === "morning" ? (
                  <View style={chipStyle}>
                    <Text style={chipText}>🌅 Sabahçı</Text>
                  </View>
                ) : lifestyle.schedule === "night" ? (
                  <View style={chipStyle}>
                    <Text style={chipText}>🌙 Gece Kuşu</Text>
                  </View>
                ) : null}
                {lifestyle.spot === "library" ? (
                  <View style={chipStyle}><Text style={chipText}>📚 Kütüphane</Text></View>
                ) : lifestyle.spot === "cafeteria" ? (
                  <View style={chipStyle}><Text style={chipText}>☕ Kafeterya</Text></View>
                ) : lifestyle.spot === "outdoor" ? (
                  <View style={chipStyle}><Text style={chipText}>🌿 Dışarısı</Text></View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Settings List */}
          <View style={{ marginBottom: 24 }}>
            <SettingsItem icon={<Bell size={20} color="#8E8E93" />} label="Bildirimler" />
            <SettingsItem icon={<Shield size={20} color="#8E8E93" />} label="Gizlilik ve Güvenlik" />
            <SettingsItem icon={<CircleHelp size={20} color="#8E8E93" />} label="Yardım ve Destek" />
            <SettingsItem
              icon={<LogOut size={20} color="#FF3B30" />}
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
        backgroundColor: "#1A1A1A",
        padding: 16,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: "rgba(255,255,255,0.05)",
        borderTopLeftRadius: onPress && !isLast ? 0 : 0, // Placeholder logic
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 32 }}>{icon}</View>
      <Text style={{ flex: 1, color: isDestructive ? "#FF3B30" : "#FFFFFF", fontSize: 16, fontWeight: "500" }}>
        {label}
      </Text>
      {!isDestructive && <ChevronRight size={18} color="#8E8E93" />}
    </Pressable>
  );
}


const chipStyle = {
  backgroundColor: "rgba(225,29,72,0.12)",
  borderRadius: 100,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "rgba(225,29,72,0.25)",
} as const;

const chipText = {
  color: theme.accent,
  fontSize: 13,
  fontWeight: "600" as const,
};
