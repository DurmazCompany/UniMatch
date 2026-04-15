import { forwardRef, useImperativeHandle } from "react";
import { View, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Profile } from "@/lib/types";
import { theme } from "@/lib/theme";
import { getZodiacSign, getZodiacDisplay } from "@/lib/astrology";

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeUp: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const SUPER_THRESHOLD = -120;

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

function isNewHere(profile: Profile): boolean {
  const charSum = profile.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return charSum % 3 === 0;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "like" | "pass" | "super") => void;
  isTop: boolean;
  index: number;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  function SwipeCard({ profile, onSwipe, isTop, index }, ref) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      setTimeout(() => triggerSwipe("pass"), 200);
    },
    swipeRight: () => {
      translateX.value = withTiming(SCREEN_WIDTH * 1.5, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      setTimeout(() => triggerSwipe("like"), 200);
    },
    swipeUp: () => {
      translateY.value = withTiming(-800, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      setTimeout(() => triggerSwipe("super"), 200);
    },
  }));

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
  const newHere = isNewHere(profile);
  const zodiacDisplay = getZodiacDisplay(getZodiacSign(profile.birthDate));

  const triggerSwipe = (direction: "like" | "pass" | "super") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipe(direction);
  };

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.25;
    })
    .onEnd((e) => {
      const isUpSwipe = e.translationY < SUPER_THRESHOLD && Math.abs(e.translationX) < 80;
      if (isUpSwipe) {
        translateY.value = withSpring(-800, { velocity: e.velocityY });
        runOnJS(triggerSwipe)("super");
      } else if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
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
    const offsetY = isTop ? translateY.value : index * -12;

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
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.25], [0, 1], "clamp"),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH * 0.25, 0], [1, 0], "clamp"),
  }));

  const superOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [SUPER_THRESHOLD, SUPER_THRESHOLD / 2], [1, 0], "clamp"),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: theme.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: isTop ? 0.5 : 0.15,
            shadowRadius: 32,
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
            colors={["#2C1A1A", "#1A0D0D"]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 100, fontWeight: "700" }}>
              {profile.name[0]?.toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        {/* Strong 4-stop bottom gradient */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.1)",
            "rgba(0,0,0,0.65)",
            "rgba(0,0,0,0.97)",
          ]}
          locations={[0, 0.4, 0.72, 1]}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />

        {/* Top badges row */}
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {newHere ? (
            <LinearGradient
              colors={["#E8445A", "#FF5E73"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 }}>
                Yeni Üye ✨
              </Text>
            </LinearGradient>
          ) : (
            <View />
          )}
        </View>

        {/* LIKE overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 56,
              left: 24,
              borderWidth: 3,
              borderColor: "#10B981",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 6,
              transform: [{ rotate: "-15deg" }],
            },
            likeOpacity,
          ]}
        >
          <Text style={{ color: "#10B981", fontSize: 30, fontWeight: "900", letterSpacing: 2 }}>
            LIKE
          </Text>
        </Animated.View>

        {/* NOPE overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 56,
              right: 24,
              borderWidth: 3,
              borderColor: "#EF4444",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 6,
              transform: [{ rotate: "15deg" }],
            },
            nopeOpacity,
          ]}
        >
          <Text style={{ color: "#EF4444", fontSize: 30, fontWeight: "900", letterSpacing: 2 }}>
            NOPE
          </Text>
        </Animated.View>

        {/* SUPER overlay (swipe up) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 56,
              alignSelf: "center",
              left: 0,
              right: 0,
              alignItems: "center",
            },
            superOpacity,
          ]}
        >
          <View
            style={{
              borderWidth: 3,
              borderColor: "#3B82F6",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#3B82F6", fontSize: 30, fontWeight: "900", letterSpacing: 2 }}>
              SUPER
            </Text>
          </View>
        </Animated.View>

        {/* Bottom content */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 24,
          }}
        >
          {/* Name + age */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 30,
                fontWeight: "800",
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {profile.name}, {age}
            </Text>
            <View
              style={{
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: "#4CD964",
                marginTop: 2,
              }}
            />
          </View>

          {/* Streak pill */}
          {profile.streakCount >= 1 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(249,115,22,0.25)",
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginBottom: 5,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={{ color: "#FB923C", fontSize: 13, fontWeight: "700", marginLeft: 3 }}>
                {profile.streakCount} gün
              </Text>
            </View>
          ) : null}

          {/* University full name */}
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 14,
              fontWeight: "500",
              marginBottom: 2,
              textShadowColor: "rgba(0,0,0,0.4)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {profile.university ?? "Üniversite"}
          </Text>

          {/* Department · Year */}
          <Text
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              fontWeight: "400",
              marginBottom: 10,
            }}
          >
            {profile.department} · {profile.year}. Sınıf
          </Text>

          {/* Bio */}
          {profile.bio ? (
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                lineHeight: 18,
                marginBottom: 12,
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
              numberOfLines={2}
            >
              {profile.bio}
            </Text>
          ) : null}

          {/* Bottom row: hobbies + zodiac */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Hobby chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 }}>
              {hobbies.map((h) => (
                <View
                  key={h}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderColor: "rgba(255,255,255,0.2)",
                    borderWidth: 0.5,
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "500" }}>
                    {h}
                  </Text>
                </View>
              ))}
            </View>

            {/* Zodiac tag */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.2)",
                borderWidth: 0.5,
                borderRadius: 16,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" }}>
                {zodiacDisplay}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});
