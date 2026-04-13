import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Mail } from "lucide-react-native";

const isUniversityEmail = (email: string) => {
  return email.includes(".edu");
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const handleResetPassword = async () => {
    setError("");

    if (!isUniversityEmail(email.trim())) {
      setError("Lutfen gecerli bir universite e-postasi girin (.edu)");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email: email.trim().toLowerCase(),
        callbackURL: "/reset-password",
      });
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError("Istek gonderilemedi. Lutfen tekrar deneyin.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
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

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Mail size={40} color={theme.success} />
          </View>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 24,
              fontFamily: "Syne_700Bold",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            E-posta Gonderildi
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 16,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 300,
              marginBottom: 32,
            }}
          >
            Sifre sifirlama baglantisi{" "}
            <Text style={{ color: theme.primary }}>{email}</Text>
            {"\n"}adresine gonderildi.
          </Text>
          <Pressable
            onPress={() => router.replace("/sign-in")}
            testID="back-to-signin-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Girise Don
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

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
            Sifremi Unuttum
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 16,
              marginBottom: 32,
              lineHeight: 24,
            }}
          >
            E-posta adresini gir, sana sifre sifirlama baglantisi gonderelim.
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 24 }}>
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
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleResetPassword}
              testID="email-input"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: focused ? theme.primary : theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 18,
                color: theme.textPrimary,
                fontSize: 17,
              }}
            />
          </View>

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

          {/* Reset Password Button */}
          <Pressable
            onPress={handleResetPassword}
            disabled={loading || !email.trim()}
            testID="reset-password-button"
            style={({ pressed }) => ({
              opacity: pressed || !email.trim() ? 0.7 : 1,
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
                {loading ? "Gonderiliyor..." : "Sifirlama Baglantisi Gonder"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Back to Sign In */}
          <Pressable
            onPress={() => router.back()}
            testID="back-to-signin-link"
            style={{ alignItems: "center", marginTop: 24 }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              Girise don
            </Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
