import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Eye, EyeOff, Gift } from "lucide-react-native";

const isUniversityEmail = (email: string) => {
  return email.includes(".edu");
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const invalidateSession = useInvalidateSession();
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
        await invalidateSession();
        router.replace("/(app)");
      }
    } catch (e) {
      setError("Kayit olusturulamadi. Lutfen tekrar deneyin.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim() &&
    isUniversityEmail(email.trim()) &&
    isValidPassword(password) &&
    password === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.background}
          style={{
            flex: 1,
            paddingHorizontal: 28,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            testID="back-button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <ChevronLeft size={24} color={theme.textPrimary} />
          </Pressable>

          {/* Header */}
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 32,
              fontFamily: "Syne_700Bold",
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            Hesap Olustur
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 16,
              marginBottom: 32,
              lineHeight: 24,
            }}
          >
            Universite e-postanla kaydol
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Universite E-Postaniz
            </Text>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              placeholder="isim@universite.edu.tr"
              placeholderTextColor={theme.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              testID="email-input"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor:
                  focusedField === "email"
                    ? theme.primary
                    : theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 18,
                color: theme.textPrimary,
                fontSize: 17,
              }}
            />
            <Text
              style={{
                color: theme.textPlaceholder,
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Sadece .edu e-postalari kabul edilir
            </Text>
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Sifre
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError("");
                }}
                placeholder="En az 8 karakter"
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                testID="password-input"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === "password"
                      ? theme.primary
                      : theme.borderDefault,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  paddingRight: 56,
                  color: theme.textPrimary,
                  fontSize: 17,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                testID="toggle-password-visibility"
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <EyeOff size={22} color={theme.textSecondary} />
                ) : (
                  <Eye size={22} color={theme.textSecondary} />
                )}
              </Pressable>
            </View>
            {password.length > 0 && password.length < 8 ? (
              <Text
                style={{ color: theme.warning, fontSize: 13, marginTop: 8 }}
              >
                Sifre en az 8 karakter olmali
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Sifreyi Onayla
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError("");
                }}
                placeholder="Sifreyi tekrar girin"
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                testID="confirm-password-input"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === "confirmPassword"
                      ? theme.primary
                      : theme.borderDefault,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  paddingRight: 56,
                  color: theme.textPrimary,
                  fontSize: 17,
                }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                testID="toggle-confirm-password-visibility"
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={22} color={theme.textSecondary} />
                ) : (
                  <Eye size={22} color={theme.textSecondary} />
                )}
              </Pressable>
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword ? (
              <Text style={{ color: theme.error, fontSize: 13, marginTop: 8 }}>
                Sifreler eslesmiyor
              </Text>
            ) : null}
          </View>

          {/* Referral Code (optional collapsible) */}
          <Pressable
            onPress={() => setShowReferral(!showReferral)}
            testID="toggle-referral"
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 4 }}
          >
            <Gift size={16} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              Davet kodun var mı?
            </Text>
          </Pressable>
          {showReferral ? (
            <View style={{ marginBottom: 20 }}>
              <TextInput
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                placeholder="Örn. ABC123"
                placeholderTextColor={theme.textPlaceholder}
                autoCapitalize="characters"
                autoCorrect={false}
                testID="referral-code-input"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderColor: theme.borderDefault,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  color: theme.textPrimary,
                  fontSize: 17,
                  letterSpacing: 3,
                }}
              />
            </View>
          ) : null}

          {/* Error Message */}
          {error ? (
            <Text
              style={{
                color: theme.error,
                fontSize: 14,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={loading || !isFormValid}
            testID="sign-up-button"
            style={({ pressed }) => ({
              opacity: pressed || !isFormValid ? 0.7 : 1,
              marginTop: 8,
            })}
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
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                {loading ? <ActivityIndicator color="#fff" /> : "Kayit Ol"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              Zaten hesabin var mi?{" "}
            </Text>
            <Pressable
              onPress={() => router.replace("/sign-in")}
              testID="sign-in-link"
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Giris Yap
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
