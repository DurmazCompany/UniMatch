import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MatchModal } from "@/components/match/MatchModal";
import { api } from "@/lib/api/api";
import { Profile, Match, SwipeResponse } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { theme, gradients } from "@/lib/theme";
import { Heart, X, Star, User, MessageCircle, MapPin, RotateCcw } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SWIPE_LIMIT = 10;

function parsePhotos(photos: string | string[]): string[] {
  if (Array.isArray(photos)) return photos;
  try {
    return JSON.parse(photos) as string[];
  } catch {
    return [];
  }
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swipesLeft, setSwipesLeft] = useState(SWIPE_LIMIT);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const { data: myProfile, isLoading: profileLoading } = useQuery<Profile | null>({
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

  const profileSettled = !profileLoading;
  useEffect(() => {
    if (!isMounted.current) return;
    if (profileSettled && myProfile === null) {
      setProfileLoaded(true);
      router.replace("/onboarding/step1");
    } else if (profileSettled && myProfile) {
      setProfileLoaded(true);
    }
  }, [profileSettled, myProfile]);

  const { isLoading: discoverLoading, refetch } = useQuery<Profile[] | null>({
    queryKey: ["discover"],
    queryFn: async () => {
      try {
        const data = await api.get<Profile[]>("/api/discover");
        const result = data ?? [];
        setProfiles(result);
        return result;
      } catch {
        setProfiles([]);
        return [];
      }
    },
    enabled: !!myProfile,
  });

  const { mutate: swipe } = useMutation({
    mutationFn: (vars: { targetProfileId: string; direction: "like" | "pass" | "super" }) =>
      api.post<SwipeResponse>("/api/swipe", vars),
    onSuccess: (data) => {
      if (data?.swipesLeft !== undefined) setSwipesLeft(data.swipesLeft);
      if (data?.match) {
        setCurrentMatch(data.match);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const handleSwipe = useCallback(
    (profileId: string, direction: "like" | "pass" | "super") => {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      swipe({ targetProfileId: profileId, direction });
    },
    [swipe]
  );

  const handleActionButton = useCallback((direction: "like" | "pass" | "super") => {
    if (profiles.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const profileId = profiles[0].id;
    handleSwipe(profileId, direction);
  }, [profiles, handleSwipe]);

  if (profileLoading || (!profileLoaded && discoverLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const limitReached = swipesLeft <= 0;
  const currentProfile = profiles[0];
  const currentPhotos = currentProfile ? parsePhotos(currentProfile.photos) : [];
  const currentAge = currentProfile
    ? Math.floor((Date.now() - new Date(currentProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  const distance = (Math.random() * 5 + 0.5).toFixed(1);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="discover-screen">
      {!limitReached && profiles.length > 0 && currentProfile ? (
        <View style={{ flex: 1 }}>
          {/* Full Screen Card */}
          <View
            style={{
              flex: 1,
              marginHorizontal: 8,
              marginTop: insets.top + 4,
              marginBottom: 8,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: theme.cardBackground,
            }}
          >
            {/* Photo */}
            {currentPhotos.length > 0 ? (
              <Image
                source={{ uri: currentPhotos[0] }}
                style={{ position: "absolute", width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={["#2C2C2E", "#1A1A1A"]}
                style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 80, fontWeight: "700" }}>
                  {currentProfile.name[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}

            {/* Top gradient overlay */}
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "transparent"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }}
            />

            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280 }}
            />

            {/* Top bar - Location */}
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MapPin size={14} color={theme.primary} fill={theme.primary} />
                <Text style={{ color: "#1A1A1A", fontSize: 13, fontWeight: "600" }}>
                  {currentProfile.university?.name ?? currentProfile.university ?? "Kampus"}
                </Text>
              </View>
            </View>

            {/* Right side action buttons */}
            <View
              style={{
                position: "absolute",
                right: 12,
                top: "35%",
                gap: 12,
              }}
            >
              <Pressable
                onPress={() => handleActionButton("like")}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Heart size={22} color="#fff" fill="#fff" />
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <User size={22} color="#fff" />
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <MessageCircle size={22} color="#fff" />
              </Pressable>
            </View>

            {/* Bottom info */}
            <View
              style={{
                position: "absolute",
                bottom: 24,
                left: 16,
                right: 80,
              }}
            >
              {/* Distance */}
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginBottom: 8 }}>
                {distance} Km Uzakta
              </Text>

              {/* Name and age with verified badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
                  {currentProfile.name}, {currentAge}
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#3B82F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
                </View>
              </View>

              {/* Bio */}
              <Text
                style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 }}
                numberOfLines={3}
              >
                {currentProfile.bio ?? `${currentProfile.department ?? "Universite"} ogrencisi. Yeni insanlarla tanismak ve guzel sohbetler etmek istiyorum...`}
              </Text>
            </View>
          </View>

          {/* Bottom Action Bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              paddingVertical: 12,
              paddingBottom: insets.bottom + 12,
              backgroundColor: theme.background,
            }}
          >
            {/* Rewind */}
            <Pressable
              testID="rewind-button"
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <RotateCcw size={22} color={theme.textSecondary} />
            </Pressable>

            {/* Pass (X) */}
            <Pressable
              onPress={() => handleActionButton("pass")}
              testID="pass-button"
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })}
            >
              <X size={28} color="#666" strokeWidth={3} />
            </Pressable>

            {/* Like (Heart) */}
            <Pressable
              onPress={() => handleActionButton("like")}
              testID="like-button"
              style={({ pressed }) => ({
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 5,
              })}
            >
              <Heart size={30} color="#fff" fill="#fff" />
            </Pressable>

            {/* Super Like (Star) */}
            <Pressable
              onPress={() => handleActionButton("super")}
              testID="super-button"
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })}
            >
              <Star size={26} color="#FFD700" fill="#FFD700" />
            </Pressable>

            {/* Boost */}
            <Pressable
              testID="boost-button"
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Empty state or limit reached */
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: insets.top }}>
          {limitReached ? (
            <>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Text style={{ fontSize: 36 }}>⏰</Text>
              </View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Gunluk hakkın bitti
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
                Yarın {SWIPE_LIMIT} yeni swipe hakkın olacak ya da Premium ile sınırsız swipe yap
              </Text>
              <Pressable
                onPress={() => router.push("/paywall")}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={gradients.button}
                  style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    Premium'a Yukselt
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : discoverLoading ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : (
            <>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Heart size={36} color={theme.primary} />
              </View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Hepsi bu kadar!
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
                Yakinindaki herkesi gordun. Daha sonra tekrar kontrol et.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={gradients.button}
                  style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    Yenile
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Match modal */}
      <MatchModal
        match={currentMatch}
        currentUserId={session?.user?.id ?? ""}
        onDismiss={() => {
          setCurrentMatch(null);
          queryClient.invalidateQueries({ queryKey: ["matches"] });
        }}
      />
    </View>
  );
}
