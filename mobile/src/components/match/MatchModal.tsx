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
import * as Haptics from "expo-haptics";
import { Match } from "@/lib/types";
import { router } from "expo-router";
import { theme, gradients } from "@/lib/theme";
import { getZodiacSign, getZodiacDisplay, getAstrologyComment } from "@/lib/astrology";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [theme.primary, "#FFD700", "#00C896", "#4FC3F7"];

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  const x = Math.random() * SCREEN_WIDTH;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 8;
  const borderRadius = index % 2 === 0 ? 4 : 2;
  const delay = index * 80;
  const duration = 2000;

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT, { duration }));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 600 }), -1));
    opacity.value = withDelay(delay + duration * 0.75, withTiming(0, { duration: duration * 0.25 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius,
        },
        animatedStyle,
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
  // Container animation
  const containerScale = useSharedValue(0.5);
  const containerOpacity = useSharedValue(0);

  // Individual photo animations
  const myPhotoScale = useSharedValue(0);
  const myPhotoOpacity = useSharedValue(0);
  const theirPhotoScale = useSharedValue(0);
  const theirPhotoOpacity = useSharedValue(0);

  // Heart pop animation
  const heartScale = useSharedValue(0);

  // Zodiac card animation
  const zodiacScale = useSharedValue(0);

  useEffect(() => {
    if (match) {
      // Haptic feedback on match reveal
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Container entrance
      containerScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      containerOpacity.value = withTiming(1, { duration: 300 });

      // Profile photos: scale 0→1 + opacity 0→1 with spring
      myPhotoScale.value = withSpring(1, { damping: 14, stiffness: 200 });
      myPhotoOpacity.value = withTiming(1, { duration: 350 });
      theirPhotoScale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 200 }));
      theirPhotoOpacity.value = withDelay(100, withTiming(1, { duration: 350 }));

      // Heart: 0.5s delay, pop 0→1.2→1
      heartScale.value = withDelay(
        500,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        )
      );

      // Zodiac card
      zodiacScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 150 }));
    } else {
      // Reset all values when modal closes
      containerScale.value = 0.5;
      containerOpacity.value = 0;
      myPhotoScale.value = 0;
      myPhotoOpacity.value = 0;
      theirPhotoScale.value = 0;
      theirPhotoOpacity.value = 0;
      heartScale.value = 0;
      zodiacScale.value = 0;
    }
  }, [match]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const myPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: myPhotoScale.value }],
    opacity: myPhotoOpacity.value,
  }));

  const theirPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: theirPhotoScale.value }],
    opacity: theirPhotoOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
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
        {/* Confetti: 25 pieces staggered by index * 80ms */}
        {Array.from({ length: 25 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}

        <Animated.View
          style={[
            { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
            containerStyle,
          ]}
        >
          {/* Profile photos row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
            {/* My photo: scale 0→1 + opacity 0→1 */}
            <Animated.View
              style={[
                {
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
                },
                myPhotoStyle,
              ]}
            >
              {myPhoto ? (
                <Animated.Image
                  source={{ uri: myPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={profileGradients[0]}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </Animated.View>

            {/* Heart between photos: 0.5s delay, pop 0→1.2→1 */}
            <Animated.View
              style={[
                {
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                  marginHorizontal: -8,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                },
                heartStyle,
              ]}
            >
              <Text style={{ fontSize: 18 }}>❤️</Text>
            </Animated.View>

            {/* Their photo: scale 0→1 + opacity 0→1 (100ms stagger) */}
            <Animated.View
              style={[
                {
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
                },
                theirPhotoStyle,
              ]}
            >
              {theirPhoto ? (
                <Animated.Image
                  source={{ uri: theirPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={profileGradients[1]}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </Animated.View>
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

          {/* Button row */}
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            {/* Mesaj Gönder — gradient primary button */}
            <Pressable
              onPress={() => {
                onDismiss();
                router.push(`/(app)/chat/${match.id}` as never);
              }}
              testID="match-message-button"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, flex: 1 })}
            >
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Mesaj Gönder 💬</Text>
              </LinearGradient>
            </Pressable>

            {/* Sonra — ghost button */}
            <Pressable
              onPress={onDismiss}
              testID="match-dismiss-button"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                flex: 0,
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: "600" }}>Sonra</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
