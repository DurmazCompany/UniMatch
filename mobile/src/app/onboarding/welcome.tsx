import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown,
  runOnJS,
} from "react-native-reanimated";
import { theme, gradients } from "@/lib/theme";
import { Heart, GraduationCap, MapPin } from "lucide-react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 3000;

interface SlideData {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  icon: React.ReactNode;
  accentColor: string;
}

function HeartFloat({ x, size, delay, duration, opacity }: {
  x: number; size: number; delay: number; duration: number; opacity: number;
}) {
  const y = useSharedValue(SH * 0.8);
  const op = useSharedValue(0);

  useEffect(() => {
    const start = () => {
      y.value = SH * 0.8;
      op.value = 0;
      y.value = withDelay(delay, withTiming(-120, { duration }));
      op.value = withDelay(
        delay,
        withSequence(
          withTiming(opacity, { duration: 800 }),
          withDelay(duration - 1200, withTiming(0, { duration: 400 }))
        )
      );
    };
    start();
    const id = setInterval(start, duration + delay + 300);
    return () => clearInterval(id);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[{ position: "absolute", left: x }, style]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: size, color: theme.primary }}>♥</Text>
    </Animated.View>
  );
}

function FloatingHearts() {
  const hearts = Array.from({ length: 8 }, (_, i) => ({
    x: (SW / 8) * i + Math.random() * (SW / 8),
    size: 8 + Math.random() * 10,
    delay: Math.random() * 3000,
    duration: 7000 + Math.random() * 5000,
    opacity: 0.04 + Math.random() * 0.06,
  }));

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {hearts.map((h, i) => (
        <HeartFloat key={i} {...h} />
      ))}
    </View>
  );
}

function ConstellationDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  const op = useSharedValue(0.2);
  useEffect(() => {
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0.2, { duration: 1200 })
        ),
        -1,
        false
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x - 3,
          top: y - 3,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.primary,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

const CONSTELLATION_DOTS = [
  { x: SW * 0.3, y: 40 }, { x: SW * 0.5, y: 20 }, { x: SW * 0.65, y: 55 },
  { x: SW * 0.45, y: 80 }, { x: SW * 0.25, y: 90 }, { x: SW * 0.7, y: 100 },
  { x: SW * 0.55, y: 130 }, { x: SW * 0.35, y: 140 }, { x: SW * 0.6, y: 160 },
];

function ConstellationBg() {
  return (
    <View
      style={{ position: "absolute", top: 60, left: 0, right: 0, height: 200 }}
      pointerEvents="none"
    >
      {CONSTELLATION_DOTS.map((d, i) => (
        <ConstellationDot key={i} x={d.x} y={d.y} delay={i * 180} />
      ))}
      {/* Lines between dots */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        {/* Simple connecting lines via thin Views positioned absolutely */}
      </View>
    </View>
  );
}

const SLIDES: SlideData[] = [
  {
    key: "love",
    title: "Kampüsünde\naşkı bul",
    subtitle: "Üniversite hayatının en güzel macerası seni bekliyor.",
    emoji: "💕",
    icon: <Heart size={52} color="#fff" fill="#fff" strokeWidth={0} />,
    accentColor: theme.primary,
  },
  {
    key: "exclusive",
    title: "Sadece üniversite\nöğrencileri",
    subtitle: "Sadece .edu uzantılı öğrenci mailiyle giriş yapılabiliyor. Gerçek bir kampüs deneyimi.",
    emoji: "🎓",
    icon: <GraduationCap size={52} color="#fff" strokeWidth={1.5} />,
    accentColor: "#7C3AED",
  },
  {
    key: "campus",
    title: "Aynı kampüste\neşleş",
    subtitle: "Aynı koridorları paylaştığın biriyle gerçek bir bağlantı kur.",
    emoji: "📍",
    icon: <MapPin size={52} color="#fff" fill="rgba(255,255,255,0.2)" strokeWidth={1.5} />,
    accentColor: "#0EA5E9",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLast) {
      timerRef.current = setTimeout(() => {
        advanceSlide();
      }, AUTO_ADVANCE_MS);
    }
  };

  const advanceSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    iconOpacity.value = withTiming(0, { duration: 250 });
    textOpacity.value = withTiming(0, { duration: 250 });
    iconScale.value = withTiming(0.85, { duration: 250 });

    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next < SLIDES.length ? next : prev;
      });
      iconOpacity.value = withTiming(1, { duration: 350 });
      textOpacity.value = withTiming(1, { duration: 350 });
      iconScale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 150 })
      );
      setIsAnimating(false);
    }, 260);
  };

  useEffect(() => {
    // Reset icon on slide change
    iconOpacity.value = 1;
    textOpacity.value = 1;
    iconScale.value = 1;

    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLast) {
      advanceSlide();
    }
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) clearTimeout(timerRef.current);
    router.push("/onboarding/step1");
  };

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const accentGlow: [string, string] = [slide.accentColor + "33", "transparent"];

  return (
    <Pressable
      onPress={handlePress}
      testID="welcome-screen"
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <LinearGradient
        colors={gradients.background}
        style={{ flex: 1 }}
      >
        {/* First slide: floating hearts */}
        {currentIndex === 0 ? <FloatingHearts /> : null}

        {/* Third slide: constellation bg */}
        {currentIndex === 2 ? <ConstellationBg /> : null}

        {/* Accent glow blob */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: SH * 0.15,
              alignSelf: "center",
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: slide.accentColor + "18",
            },
            iconStyle,
          ]}
          pointerEvents="none"
        />

        {/* Main content */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 120,
          }}
        >
          {/* Icon circle */}
          <Animated.View
            style={[
              {
                width: 120,
                height: 120,
                borderRadius: 36,
                backgroundColor: slide.accentColor,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
                shadowColor: slide.accentColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.55,
                shadowRadius: 32,
                elevation: 12,
              },
              iconStyle,
            ]}
          >
            {slide.icon}
          </Animated.View>

          {/* Text */}
          <Animated.View style={[{ alignItems: "center" }, textStyle]}>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 34,
                fontFamily: "Syne_700Bold",
                letterSpacing: -0.8,
                textAlign: "center",
                lineHeight: 42,
                marginBottom: 16,
              }}
            >
              {slide.title}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 16,
                textAlign: "center",
                lineHeight: 24,
                maxWidth: 280,
              }}
            >
              {slide.subtitle}
            </Text>
          </Animated.View>
        </View>

        {/* Bottom area: dots + button */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 40,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Dot indicators */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {SLIDES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (isAnimating) return;
                  Haptics.selectionAsync();
                  if (timerRef.current) clearTimeout(timerRef.current);
                  iconOpacity.value = withTiming(0, { duration: 200 });
                  textOpacity.value = withTiming(0, { duration: 200 });
                  iconScale.value = withTiming(0.85, { duration: 200 });
                  setTimeout(() => {
                    setCurrentIndex(i);
                    iconOpacity.value = withTiming(1, { duration: 300 });
                    textOpacity.value = withTiming(1, { duration: 300 });
                    iconScale.value = withSequence(
                      withTiming(1.1, { duration: 180 }),
                      withTiming(1, { duration: 120 })
                    );
                  }, 210);
                }}
                testID={`dot-${i}`}
                style={{
                  width: currentIndex === i ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    currentIndex === i ? slide.accentColor : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </View>

          {/* CTA button — only on last slide */}
          {isLast ? (
            <Pressable
              onPress={handleStart}
              testID="start-button"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: SW - 64 })}
            >
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: "700",
                    letterSpacing: 0.2,
                  }}
                >
                  Başla
                </Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePress}
              testID="next-slide-button"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                paddingVertical: 12,
                paddingHorizontal: 24,
              })}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Devam →
              </Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
