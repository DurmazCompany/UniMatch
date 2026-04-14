import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft } from "lucide-react-native";

const YEARS = [1, 2, 3, 4, 5, 6];

export default function Step2Screen() {
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const insets = useSafeAreaInsets();

  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState(0);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!university.trim() || university.trim().length < 2) {
      setError("Üniversite adı en az 2 karakter olmalı");
      return;
    }
    if (!department.trim() || department.trim().length < 2) {
      setError("Bölüm adı en az 2 karakter olmalı");
      return;
    }
    if (!year) { setError("Sınıfını seç"); return; }

    setOnboarding({
      university: university.trim(),
      department: department.trim(),
      year,
      bio: bio.trim(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/step3");
  };

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
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
          }}
        >
          {/* Progress */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 36 }}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: step <= 2 ? theme.primary : theme.borderDefault,
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <ChevronLeft size={24} color={theme.textPrimary} />
          </Pressable>

          <Text style={{ color: theme.textPrimary, fontSize: 28, fontFamily: "Syne_700Bold", marginBottom: 8 }}>
            Kampüsün hangisi?
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 28 }}>
            Üniversite ve bölüm bilgilerini gir
          </Text>

          {/* University input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Üniversite
            </Text>
            <TextInput
              value={university}
              onChangeText={(t) => { setUniversity(t); setError(""); }}
              placeholder="Örn. İstanbul Teknik Üniversitesi"
              placeholderTextColor={theme.textPlaceholder}
              testID="university-input"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                color: theme.textPrimary,
                fontSize: 16,
              }}
            />
          </View>

          {/* Department */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Bölüm
            </Text>
            <TextInput
              value={department}
              onChangeText={(t) => { setDepartment(t); setError(""); }}
              placeholder="Örn. Bilgisayar Mühendisliği"
              placeholderTextColor={theme.textPlaceholder}
              testID="department-input"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                color: theme.textPrimary,
                fontSize: 16,
              }}
            />
          </View>

          {/* Year */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Sınıf
            </Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {YEARS.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => { setYear(y); setError(""); }}
                  testID={`year-${y}`}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: year === y ? theme.primary : theme.borderDefault,
                    backgroundColor: year === y ? "rgba(225,29,72,0.15)" : theme.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: year === y ? theme.accent : theme.textSecondary, fontSize: 16, fontWeight: "700" }}>
                    {y}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Hakkında (isteğe bağlı)
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinden kısaca bahset..."
              placeholderTextColor={theme.textPlaceholder}
              multiline
              numberOfLines={3}
              maxLength={200}
              testID="bio-input"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 14,
                color: theme.textPrimary,
                fontSize: 15,
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
            <Text style={{ color: theme.textPlaceholder, fontSize: 12, textAlign: "right", marginTop: 4 }}>
              {bio.length}/200
            </Text>
          </View>

          {error ? (
            <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleNext}
            testID="next-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, borderRadius: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Devam →</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
