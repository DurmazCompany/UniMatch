import { View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { theme, gradients } from "@/lib/theme";
import { Heart, GraduationCap, Sparkles } from "lucide-react-native";

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
      {/* Logo and Brand */}
      <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        {/* Animated Heart Logo */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 36,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 32,
          }}
        >
          <Heart
            size={64}
            color="#fff"
            fill="#fff"
            strokeWidth={0}
          />
        </View>

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
            text="Sadece universite ogrencileri"
          />
          <FeatureItem
            icon={<Sparkles size={20} color={theme.primary} />}
            text="Universite ogrencileri ile esles"
          />
          <FeatureItem
            icon={<Heart size={20} color={theme.primary} />}
            text="Gercek iliskiler kur"
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={{ gap: 14 }}>
        {/* Sign Up Button (Primary) */}
        <Pressable
          onPress={handleSignUp}
          testID="signup-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Kayıt Ol
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Sign In Button (Secondary) */}
        <Pressable
          onPress={handleSignIn}
          testID="signin-button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            paddingVertical: 18,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: theme.borderDefault,
            backgroundColor: theme.surface,
          })}
        >
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 17,
              fontWeight: "600",
            }}
          >
            Giriş Yap
          </Text>
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
        'nı kabul etmiş olursunuz.
      </Text>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {icon}
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 15,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
