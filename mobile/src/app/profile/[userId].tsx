import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";
import { Colors, Radius } from "@/lib/theme";
import { UMButton, UMTag } from "@/components/ui";
import { usePrivacyStore } from "@/lib/state/privacyStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.6;

function parsePhotos(photos: string | string[] | undefined): string[] {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos;
  try {
    return JSON.parse(photos) as string[];
  } catch {
    return [];
  }
}

function parseHobbies(hobbies: string | string[] | undefined): string[] {
  if (!hobbies) return [];
  if (Array.isArray(hobbies)) return hobbies;
  try {
    return JSON.parse(hobbies) as string[];
  } catch {
    return [];
  }
}

function calcAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const blockUser = usePrivacyStore((s) => s.blockUser);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      try {
        return await api.get<Profile>(`/api/profile/${userId}`);
      } catch {
        return null;
      }
    },
    enabled: !!userId,
  });

  const photos = parsePhotos(profile?.photos);
  const hobbies = parseHobbies(profile?.hobbies);
  const age = calcAge(profile?.birthDate);

  const handleBlock = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      "Kullanıcıyı Engelle",
      `${profile.name} adlı kullanıcıyı engellemek istediğinden emin misin? Bu kişinin profilini ve mesajlarını artık göremezsin.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(profile.userId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Hata", "Engelleme işlemi başarısız oldu.");
            }
          },
        },
      ]
    );
  }, [profile, blockUser]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.primary} testID="profile-loading" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: Colors.textOnDark, fontSize: 17, fontFamily: "DMSans_600SemiBold", marginBottom: 12 }}>
          Profil bulunamadı
        </Text>
        <UMButton variant="ghost" label="Geri Dön" onPress={() => router.back()} fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="public-profile-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} bounces={false}>
        {/* Hero photo */}
        <View style={{ width: SCREEN_WIDTH, height: PHOTO_HEIGHT }}>
          {photos[0] ? (
            <Image source={{ uri: photos[0] }} style={{ width: SCREEN_WIDTH, height: PHOTO_HEIGHT }} resizeMode="cover" />
          ) : (
            <View style={{ width: SCREEN_WIDTH, height: PHOTO_HEIGHT, backgroundColor: Colors.cardDark }} />
          )}
          <LinearGradient
            colors={["rgba(19,19,31,0.55)", "rgba(19,19,31,0)", "rgba(19,19,31,0.95)"]}
            locations={[0, 0.4, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Top buttons */}
          <View
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              right: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              testID="profile-back"
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back-outline" size={22} color={Colors.white} />
            </Pressable>
            <Pressable
              testID="profile-block"
              onPress={handleBlock}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="ban-outline" size={20} color={Colors.coral} />
            </Pressable>
          </View>

          {/* Name overlay */}
          <View style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <Text style={{ color: Colors.white, fontSize: 30, fontFamily: "DMSerifDisplay_400Regular" }}>
              {profile.name}{age ? `, ${age}` : ""}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontFamily: "DMSans_500Medium", marginTop: 4 }}>
              {profile.university}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
              {profile.department} · {profile.year}. sınıf
            </Text>
          </View>
        </View>

        {/* Hobbies */}
        {hobbies.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_700Bold", letterSpacing: 0.5, marginBottom: 10 }}>
              İLGİ ALANLARI
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {hobbies.map((h, i) => (
                <UMTag key={i} variant="overlay" label={h} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Bio */}
        {profile.bio ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_700Bold", letterSpacing: 0.5, marginBottom: 10 }}>
              HAKKINDA
            </Text>
            <View
              style={{
                backgroundColor: Colors.surfaceDark,
                borderRadius: Radius.card,
                padding: 16,
              }}
            >
              <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_400Regular", lineHeight: 22 }}>
                {profile.bio}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Other photos */}
        {photos.length > 1 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
            {photos.slice(1).map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{
                  width: SCREEN_WIDTH - 40,
                  height: SCREEN_WIDTH - 40,
                  borderRadius: Radius.card,
                  backgroundColor: Colors.cardDark,
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        ) : null}

        {/* Back button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <UMButton variant="primary" label="Geri Dön" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </View>
  );
}
