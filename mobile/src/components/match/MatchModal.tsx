import { useEffect } from "react";
import { View, Text, Modal, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Match } from "@/lib/types";
import { router } from "expo-router";
import { theme, gradients } from "@/lib/theme";
import { getZodiacSign, getZodiacDisplay, getAstrologyComment } from "@/lib/astrology";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [theme.primary, theme.accent, "#F59E0B", "#10B981", "#EF4444", "#60A5FA"];

function ConfettiPiece({ index }: { index: number }) {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const y = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 8;
  const duration = 2000 + Math.random() * 2000;
  const delay = Math.random() * 1500;

  useEffect(() => {
    y.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 40, { duration }));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 800 }), -1));
    opacity.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

interface MatchModalProps {
  match: Match | null;
  currentUserId: string;
  onDismiss: () => void;
}

export function MatchModal({ match, currentUserId, onDismiss }: MatchModalProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const zodiacScale = useSharedValue(0);

  useEffect(() => {
    if (match) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 300 });
      zodiacScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 150 }));
    } else {
      scale.value = 0.5;
      opacity.value = 0;
      zodiacScale.value = 0;
    }
  }, [match]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const zodiacStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zodiacScale.value }],
  }));

  if (!match) return null;

  const otherProfile = match.user1.userId === currentUserId ? match.user2 : match.user1;
  const myProfile = match.user1.userId === currentUserId ? match.user1 : match.user2;

  const getAvatar = (profile: typeof otherProfile) => {
    try {
      const photos = JSON.parse(profile.photos) as string[];
      return photos[0] ?? null;
    } catch {
      return null;
    }
  };

  const myPhoto = getAvatar(myProfile);
  const theirPhoto = getAvatar(otherProfile);

  const profileGradients: [string, string][] = [
    [theme.gradientStart, "#2D1B29"],
    ["#0A1A2E", "#0D2B4E"],
  ];

  const mySign = getZodiacSign(myProfile.birthDate);
  const theirSign = getZodiacSign(otherProfile.birthDate);
  const myZodiac = getZodiacDisplay(mySign);
  const theirZodiac = getZodiacDisplay(theirSign);
  const astrologyComment = getAstrologyComment(mySign, theirSign);

  return (
    <Modal transparent animationType="fade" visible={!!match} testID="match-modal">
      <View style={{ flex: 1, backgroundColor: "rgba(10,10,15,0.97)" }}>
        {/* Confetti */}
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}

        <Animated.View
          style={[
            { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
            contentStyle,
          ]}
        >
          {/* Profile photos */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28, gap: -20 }}>
            {/* My photo */}
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                borderWidth: 3,
                borderColor: theme.primary,
                overflow: "hidden",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                zIndex: 2,
              }}
            >
              {myPhoto ? (
                <Animated.Image
                  source={{ uri: myPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient colors={profileGradients[0]} style={{ width: "100%", height: "100%" }} />
              )}
            </View>

            {/* Heart between */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 12,
              }}
            >
              <Text style={{ fontSize: 18 }}>❤️</Text>
            </View>

            {/* Their photo */}
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                borderWidth: 3,
                borderColor: theme.accent,
                overflow: "hidden",
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                zIndex: 2,
              }}
            >
              {theirPhoto ? (
                <Animated.Image
                  source={{ uri: theirPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient colors={profileGradients[1]} style={{ width: "100%", height: "100%" }} />
              )}
            </View>
          </View>

          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 36,
              fontWeight: "900",
              marginBottom: 8,
              letterSpacing: -0.5,
            }}
          >
            Eşleşme! 🎉
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 16, marginBottom: 20 }}>
            Sen ve {otherProfile.name} birbirinizi beğendiniz
          </Text>

          {/* Zodiac signs */}
          <Animated.View
            style={[
              {
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 14,
                marginBottom: 12,
                width: "100%",
                alignItems: "center",
              },
              zodiacStyle,
            ]}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 6 }}>
              {myZodiac}  ·  {theirZodiac}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {astrologyComment}
            </Text>
          </Animated.View>

          {match.iceBreakerQuestion ? (
            <View
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                padding: 16,
                marginBottom: 28,
                width: "100%",
              }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 6 }}>
                Buz Kırıcı Soru
              </Text>
              <Text style={{ color: theme.textPrimary, fontSize: 15, lineHeight: 22 }}>
                {match.iceBreakerQuestion}
              </Text>
            </View>
          ) : (
            <View style={{ height: 28 }} />
          )}

          <Pressable
            onPress={() => {
              onDismiss();
              router.push(`/(app)/chat/${match.id}` as never);
            }}
            testID="match-message-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: "100%" })}
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Mesajlaş 💬</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            testID="match-dismiss-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 16, paddingVertical: 8 }}>Sonra</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
