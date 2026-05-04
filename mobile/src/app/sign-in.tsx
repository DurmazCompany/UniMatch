import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/lib/auth/use-session";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "@/lib/theme";
import { UMInput, UMButton } from "@/components/ui";

const isUniversityEmail = (email: string) => {
  return email.includes(".edu") || email.includes("@yeditepe.") || email.includes("@test.");
};

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("campusmatch_last_email").then((saved) => {
      if (saved) setEmail(saved);
    });
  }, []);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const handleSignIn = async () => {
    setError("");
    if (!isUniversityEmail(email.trim())) {
      setError("Lutfen gecerli bir universite e-postasi girin (.edu)");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!password) {
      setError("Lutfen sifrenizi girin");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (result.error) {
        setError(result.error.message || "Giris yapilamadi");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await SecureStore.setItemAsync("campusmatch_last_email", email.trim().toLowerCase());
        queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
        router.replace("/(app)");
      }
    } catch (e) {
      setError("Giris yapilamadi. Lutfen tekrar deneyin.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/forgot-password");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgLight }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 36, color: Colors.textDark }}>
          Hoş geldin 👋
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 16, color: Colors.textMuted, marginTop: 6 }}>
          Hesabına giriş yap
        </Text>

        <View style={{ height: 32 }} />

        <View style={{ gap: 16 }}>
          <UMInput
            label="E-posta"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(""); }}
            placeholder="ornek@yeditepe.edu.tr"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="email-input"
          />
          <UMInput
            label="Şifre"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            placeholder="Şifrenizi girin"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSignIn}
            testID="password-input"
          />
        </View>

        <Pressable
          onPress={handleForgotPassword}
          testID="forgot-password-link"
          style={{ alignSelf: "flex-end", marginTop: 8 }}
        >
          <Text style={{ color: Colors.primary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
            Şifreni mi unuttun?
          </Text>
        </Pressable>

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ height: 32 }} />

        <UMButton
          variant="primary"
          label="Giriş Yap"
          loading={loading}
          onPress={handleSignIn}
        />

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
          <Text style={{ marginHorizontal: 12, color: Colors.textMuted, fontFamily: "DMSans_400Regular", fontSize: 13 }}>
            veya
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={{ color: Colors.textMuted, fontFamily: "DMSans_400Regular", fontSize: 14 }}>
            Hesabın yok mu?{" "}
          </Text>
          <Pressable onPress={() => router.replace("/sign-up")} testID="sign-up-link">
            <Text style={{ color: Colors.primary, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>
              Kayıt Ol
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
