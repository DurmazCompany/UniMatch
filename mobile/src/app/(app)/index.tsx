import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SwipeStack } from "@/components/swipe/SwipeStack";
import { MatchModal } from "@/components/match/MatchModal";
import { api } from "@/lib/api/api";
import { Profile, Match, SwipeResponse } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { theme, gradients } from "@/lib/theme";
import { Heart } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

const SWIPE_LIMIT = 15;

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

  // Check profile existence
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

  // Redirect to onboarding if no profile
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

  const swipesUsed = SWIPE_LIMIT - swipesLeft;
  const limitReached = swipesLeft <= 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={gradients.background}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />

      {/* Header with Segmented Control */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", gap: 24 }}>
          <Pressable style={{ borderBottomWidth: 2, borderBottomColor: "#E8445A", paddingBottom: 6 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>Sana Özel</Text>
          </Pressable>
          <Pressable style={{ paddingBottom: 6 }}>
            <Text style={{ color: "#8E8E93", fontSize: 17, fontWeight: "600" }}>Kampüs</Text>
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 20, color: "#8E8E93" }}>⚡</Text>
        </Pressable>
      </View>

      {/* Stats row can be more subtle */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ color: "#48484A", fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
          KALAN SWIPE: {swipesLeft} / {SWIPE_LIMIT}
        </Text>
      </View>


      {/* Card stack */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        {limitReached ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⏰</Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Bugünkü hakkın bitti
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 24 }}>
              Yarın daha fazla profil keşfedebilirsin
            </Text>
            <Pressable
              style={{
                backgroundColor: "rgba(225,29,72,0.2)",
                borderWidth: 1,
                borderColor: theme.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 28,
              }}
            >
              <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "700" }}>
                Premium'a geç — sınırsız swipe
              </Text>
            </Pressable>
          </View>
        ) : discoverLoading ? (
          <ActivityIndicator color={theme.primary} size="large" />
        ) : profiles.length === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>❤️</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
              Hepsi bu kadar!
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 24 }}>
              Kampüsündeki herkesi gördün
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <LinearGradient
                colors={gradients.button}
                style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Yenile</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <SwipeStack profiles={profiles} onSwipe={handleSwipe} />
        )}
      </View>

      {/* Action buttons */}
      {!limitReached && profiles.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            paddingBottom: insets.bottom + 90,
            paddingHorizontal: 32,
          }}
        >
          {/* Pass */}
          <Pressable
            onPress={() => handleActionButton("pass")}
            testID="pass-button"
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#1A1A1A",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 22, color: "#E8445A" }}>✕</Text>
          </Pressable>

          {/* Super like can be hidden or styled simply */}
          <Pressable
            onPress={() => handleActionButton("super")}
            testID="super-button"
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#222",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 18 }}>⭐</Text>
          </Pressable>

          {/* Like */}
          <Pressable
            onPress={() => handleActionButton("like")}
            testID="like-button"
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#E8445A",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 24, color: "#fff" }}>♥</Text>
          </Pressable>

        </View>
      ) : null}

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
