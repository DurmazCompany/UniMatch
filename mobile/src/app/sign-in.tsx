import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
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
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/lib/auth/use-session";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";

const isUniversityEmail = (email: string) => {
  return email.includes(".edu");
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

  const isFormValid = email.trim() && password;

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
            Giris Yap
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 16,
              marginBottom: 32,
              lineHeight: 24,
            }}
          >
            Universite e-postanla devam et
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
                borderRadius: theme.radius.pill,
                paddingHorizontal: 20,
                paddingVertical: 18,
                color: theme.base.text,
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
          <View style={{ marginBottom: 12 }}>
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
                placeholder="Sifrenizi girin"
                placeholderTextColor={theme.textPlaceholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={handleSignIn}
                testID="password-input"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderColor:
                    focusedField === "password"
                      ? theme.primary
                      : theme.borderDefault,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  paddingRight: 56,
                  color: theme.base.text,
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
          </View>

          {/* Forgot Password Link */}
          <Pressable
            onPress={handleForgotPassword}
            testID="forgot-password-link"
            style={{ alignSelf: "flex-end", marginBottom: 24 }}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Sifremi Unuttum
            </Text>
          </Pressable>

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

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={loading || !isFormValid}
            testID="sign-in-button"
            style={({ pressed }) => ({
              opacity: pressed || !isFormValid ? 0.7 : 1,
            })}
          >
            <LinearGradient
              colors={theme.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                borderRadius: theme.radius.pill,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                {loading ? <ActivityIndicator color="#fff" /> : "Giris Yap"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Sign Up Link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              Hesabin yok mu?{" "}
            </Text>
            <Pressable
              onPress={() => router.replace("/sign-up")}
              testID="sign-up-link"
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Kayit Ol
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
