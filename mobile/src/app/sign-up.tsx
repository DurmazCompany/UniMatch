import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/lib/auth/use-session";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/lib/theme";
import { UMInput, UMButton } from "@/components/ui";

const isUniversityEmail = (email: string) => {
  return email.includes(".edu") || email.includes("@yeditepe.") || email.includes("@test.");
};

const isValidPassword = (password: string) => {
  return password.length >= 8;
};

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const setOnboarding = useAppStore((s) => s.setOnboarding);

  const handleSignUp = async () => {
    setError("");

    if (!isUniversityEmail(email.trim())) {
      setError("Lutfen gecerli bir universite e-postasi girin (.edu)");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!isValidPassword(password)) {
      setError("Sifre en az 8 karakter olmalidir");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError("Sifreler eslesmiyor");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password: password,
        name: email.trim().split("@")[0],
      });

      if (result.error) {
        setError(result.error.message || "Kayit olusturulamadi");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (referralCode.trim()) {
          setOnboarding({ referralCode: referralCode.trim() });
        }
        queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
        router.replace("/(app)");
      }
    } catch (e) {
      setError("Kayit olusturulamadi. Lutfen tekrar deneyin.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
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
          Aramıza Katıl 💜
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 16, color: Colors.textMuted, marginTop: 6 }}>
          Üniversite e-postanla başla
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
            placeholder="En az 8 karakter"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="password-input"
            error={password.length > 0 && password.length < 8 ? "En az 8 karakter olmalı" : undefined}
          />
          <UMInput
            label="Şifreyi Onayla"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
            placeholder="Şifreyi tekrar girin"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="confirm-password-input"
            error={confirmPassword.length > 0 && password !== confirmPassword ? "Şifreler eşleşmiyor" : undefined}
          />
        </View>

        <Pressable
          onPress={() => setShowReferral(!showReferral)}
          testID="toggle-referral"
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 12 }}
        >
          <Ionicons name="gift-outline" size={16} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
            Davet kodun var mı?
          </Text>
        </Pressable>
        {showReferral ? (
          <UMInput
            value={referralCode}
            onChangeText={(t) => setReferralCode(t.toUpperCase())}
            placeholder="Örn. ABC123"
            autoCapitalize="characters"
            autoCorrect={false}
            testID="referral-code-input"
            style={{ letterSpacing: 3 }}
          />
        ) : null}

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ height: 32 }} />

        <UMButton
          variant="primary"
          label="Devam Et"
          loading={loading}
          onPress={handleSignUp}
        />

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
          <Text style={{ color: Colors.textMuted, fontFamily: "DMSans_400Regular", fontSize: 14 }}>
            Zaten hesabın var mı?{" "}
          </Text>
          <Pressable onPress={() => router.replace("/sign-in")} testID="sign-in-link">
            <Text style={{ color: Colors.primary, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>
              Giriş Yap
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
