import { View, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/BadgeChip";
import { theme, gradients } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.35;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// Generate deterministic gradient color from profile id
function getProfileGradient(id: string): [string, string] {
  const profileGradients: [string, string][] = [
    [theme.gradientStart, "#2D1B29"],
    ["#0A1A2E", "#0D2B4E"],
    ["#1A0A1A", "#3D0D3D"],
    ["#0A1A0A", "#0D3D1B"],
    ["#1A1A0A", "#3D3D0D"],
  ];
  const idx = id.charCodeAt(0) % profileGradients.length;
  return profileGradients[idx];
}

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "like" | "pass" | "super") => void;
  isTop: boolean;
  index: number;
}

export function SwipeCard({ profile, onSwipe, isTop, index }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const photos = (() => {
    try {
      return JSON.parse(profile.photos) as string[];
    } catch {
      return [] as string[];
    }
  })();

  const hobbies = (() => {
    try {
      return (JSON.parse(profile.hobbies ?? "[]") as string[]).slice(0, 3);
    } catch {
      return [] as string[];
    }
  })();

  const age = calculateAge(profile.birthDate);
  const gradientColors = getProfileGradient(profile.id);

  const triggerSwipe = (direction: "like" | "pass" | "super") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipe(direction);
  };

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? "like" : "pass";
        const targetX = e.translationX > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        translateX.value = withSpring(targetX, { velocity: e.velocityX });
        runOnJS(triggerSwipe)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);
    const scale = isTop ? 1 : interpolate(index, [1, 2], [0.95, 0.9]);
    const offsetY = isTop ? translateY.value : index * -10;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: offsetY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.3], [0, 1], "clamp"),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH * 0.3, 0], [1, 0], "clamp"),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.borderDefault,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isTop ? 0.3 : 0.1,
            shadowRadius: 20,
            elevation: 10 - index * 2,
          },
          cardStyle,
        ]}
        testID={`swipe-card-${profile.id}`}
      >
        {/* Photo or Gradient Background */}
        {photos.length > 0 ? (
          <Animated.Image
            source={{ uri: photos[0] }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
          locations={[0, 0.4, 0.7, 1]}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />

        {/* Top badges */}
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {profile.selfieVerified ? (
            <View
              style={{
                backgroundColor: "rgba(16,185,129,0.85)",
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12 }}>✓</Text>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Doğrulandı</Text>
            </View>
          ) : (
            <View />
          )}
          {profile.compatibilityScore !== undefined ? (
            <LinearGradient
              colors={["#10B981", "#34D399"]}
              style={{
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                %{profile.compatibilityScore} uyum
              </Text>
            </LinearGradient>
          ) : null}
        </View>

        {/* Like overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 60,
              left: 24,
              borderWidth: 3,
              borderColor: "#10B981",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              transform: [{ rotate: "-15deg" }],
            },
            likeOpacity,
          ]}
        >
          <Text style={{ color: "#10B981", fontSize: 28, fontWeight: "900" }}>LIKE</Text>
        </Animated.View>

        {/* Nope overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 60,
              right: 24,
              borderWidth: 3,
              borderColor: "#EF4444",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              transform: [{ rotate: "15deg" }],
            },
            nopeOpacity,
          ]}
        >
          <Text style={{ color: "#EF4444", fontSize: 28, fontWeight: "900" }}>NOPE</Text>
        </Animated.View>

        {/* Bottom info */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            paddingBottom: 32,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "700" }}>
              {profile.name}, {age}
            </Text>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4CD964",
                marginTop: 4,
              }}
            />
            {profile.streakCount > 0 ? (
              <Text style={{ fontSize: 20 }}>🔥</Text>
            ) : null}
          </View>

          <Text style={{ color: "#8E8E93", fontSize: 15, fontWeight: "400", marginBottom: 12 }}>
            {profile.department} · {profile.university?.name ?? "Üniversite"}
          </Text>

          {profile.bio ? (
            <Text
              style={{ color: "#D1D5DB", fontSize: 13, marginBottom: 10 }}
              numberOfLines={2}
            >
              {profile.bio}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {hobbies.map((h) => (
              <Badge key={h} label={h} />
            ))}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
