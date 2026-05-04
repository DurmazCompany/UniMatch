import {
  View,
  Text,
  Pressable,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Colors, Radius, gradients } from "@/lib/theme";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/onboarding/step1");
  };

  const handleSignIn = () => {
    Haptics.selectionAsync();
    router.push("/sign-in");
  };

  return (
    <View style={{ flex: 1 }} testID="welcome-screen">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={gradients.onboarding}
        style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: "center" }}>
            <Ionicons name="sparkles" size={80} color="#fff" />
            <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 48, color: "#fff", marginTop: 24 }}>
              UniMatch
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 18, color: "rgba(255,255,255,0.85)", marginTop: 8, textAlign: "center" }}>
              Üniversitenden eşleşmeler
            </Text>
          </Animated.View>
        </View>

        <View style={{ alignItems: "center" }}>
          <Pressable
            onPress={handleStart}
            testID="start-button"
            style={({ pressed }) => ({
              backgroundColor: Colors.white,
              height: 54,
              borderRadius: Radius.pill,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "stretch",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: Colors.primary, fontFamily: "DMSans_700Bold", fontSize: 17 }}>
              Başla
            </Text>
          </Pressable>
          <Pressable onPress={handleSignIn} testID="sign-in-link" style={{ marginTop: 16 }}>
            <Text style={{ color: "#fff", fontFamily: "DMSans_500Medium", fontSize: 14, textDecorationLine: "underline" }}>
              Zaten hesabım var
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}
