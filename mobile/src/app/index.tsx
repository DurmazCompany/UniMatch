import { useEffect, useMemo } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { theme, gradients } from "@/lib/theme";
import { Heart, GraduationCap, Sparkles } from "lucide-react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const HEART_COUNT = 12;

interface HeartParticleConfig {
  x: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function HeartParticle({ config }: { config: HeartParticleConfig }) {
  const y = useSharedValue(config.startY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const loop = () => {
      y.value = config.startY;
      opacity.value = 0;
      y.value = withDelay(
        config.delay,
        withTiming(config.startY - SH * 1.2, { duration: config.duration })
      );
      opacity.value = withDelay(
        config.delay,
        withSequence(
          withTiming(config.opacity, { duration: 600 }),
          withDelay(config.duration - 1200, withTiming(0, { duration: 600 }))
        )
      );
    };
    loop();
    const interval = setInterval(loop, config.duration + config.delay + 200);
    return () => clearInterval(interval);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: config.x,
          top: 0,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: config.size, filter: "blur(1px)" }}>♥</Text>
    </Animated.View>
  );
}

function FloatingHearts() {
  const configs: HeartParticleConfig[] = useMemo(
    () =>
      Array.from({ length: HEART_COUNT }, (_, i) => ({
        x: (SW / HEART_COUNT) * i + Math.random() * (SW / HEART_COUNT),
        startY: SH * 0.7 + Math.random() * SH * 0.3,
        size: 8 + Math.random() * 10,
        duration: 6000 + Math.random() * 6000,
        delay: Math.random() * 4000,
        opacity: 0.04 + Math.random() * 0.08,
      })),
    []
  );

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {configs.map((c, i) => (
        <HeartParticle key={i} config={c} />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/sign-up");
  };

  // Logo pulse
  const logoPulse = useSharedValue(1);
  useEffect(() => {
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1,
      false
    );
  }, []);
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoPulse.value }],
  }));

  return (
    <LinearGradient
      colors={gradients.background}
      style={{
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: insets.top + 60,
        paddingBottom: insets.bottom + 40,
      }}
    >
      {/* Floating hearts background */}
      <FloatingHearts />

      {/* Logo and Brand */}
      <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        {/* Pulsing heart logo */}
        <Animated.View
          style={[
            {
              width: 120,
              height: 120,
              borderRadius: 36,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.65,
              shadowRadius: 36,
            },
            logoStyle,
          ]}
        >
          <Heart size={64} color="#fff" fill="#fff" strokeWidth={0} />
        </Animated.View>

        {/* App Name */}
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 42,
            fontFamily: "Syne_700Bold",
            letterSpacing: -1,
            marginBottom: 12,
          }}
        >
          UniMatch
        </Text>

        {/* Tagline */}
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 18,
            textAlign: "center",
            lineHeight: 28,
            maxWidth: 280,
          }}
        >
          Kampüsünde aşkı bul.{"\n"}Gerçek bağlantılar kur.
        </Text>

        {/* Features */}
        <View style={{ marginTop: 48, gap: 16 }}>
          <FeatureItem
            icon={<GraduationCap size={20} color={theme.primary} />}
            text="Sadece üniversite öğrencileri"
          />
          <FeatureItem
            icon={<Sparkles size={20} color={theme.primary} />}
            text="Burç uyumuna göre eşleş"
          />
          <FeatureItem
            icon={<Heart size={20} color={theme.primary} />}
            text="Gerçek ilişkiler kur"
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={{ gap: 14 }}>
        <Pressable
          onPress={handleSignUp}
          testID="signup-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Kayıt Ol</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleSignIn}
          testID="signin-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <View
            style={{
              paddingVertical: 18,
              borderRadius: 14,
              alignItems: "center",
              borderWidth: 2,
              borderColor: theme.primary,
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            <Text style={{ color: theme.primary, fontSize: 17, fontWeight: "600" }}>Giriş Yap</Text>
          </View>
        </Pressable>
      </View>

      {/* Footer */}
      <Text
        style={{
          color: theme.textPlaceholder,
          fontSize: 12,
          textAlign: "center",
          marginTop: 24,
          lineHeight: 18,
        }}
      >
        Devam ederek{" "}
        <Text style={{ color: theme.primary }}>Kullanım Koşulları</Text>
        {" "}ve{" "}
        <Text style={{ color: theme.primary }}>Gizlilik Politikası</Text>
        {"'"}nı kabul etmiş olursunuz.
      </Text>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {icon}
      <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{text}</Text>
    </View>
  );
}
