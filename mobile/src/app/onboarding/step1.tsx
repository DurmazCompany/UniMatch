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
import DateTimePicker from "@react-native-community/datetimepicker";
import { theme, gradients } from "@/lib/theme";
import { Calendar } from "lucide-react-native";

const GENDERS = [
  { label: "Erkek", value: "male" },
  { label: "Kadın", value: "female" },
  { label: "Diğer", value: "other" },
];

export default function Step1Screen() {
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [gender, setGender] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      setError("Lütfen adını gir");
      return;
    }
    if (!gender) {
      setError("Lütfen cinsiyetini seç");
      return;
    }
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 17 || age > 35) {
      setError("Yaş 17-35 arasında olmalı");
      return;
    }
    setOnboarding({
      name: name.trim(),
      birthDate: birthDate.toISOString().split("T")[0],
      gender,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/step2");
  };

  const formattedDate = birthDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
                  backgroundColor: step <= 1 ? theme.primary : theme.borderDefault,
                }}
              />
            ))}
          </View>

          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 28,
              fontFamily: "Syne_700Bold",
              marginBottom: 8,
            }}
          >
            Seni tanıyalım
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 36 }}>
            Profil bilgilerini gir
          </Text>

          {/* Name */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Adın
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="Adın"
              placeholderTextColor={theme.textPlaceholder}
              autoCapitalize="words"
              testID="name-input"
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

          {/* Birth Date */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Doğum Tarihi
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(!showDatePicker)}
              testID="birthdate-picker"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: showDatePicker ? theme.primary : theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{formattedDate}</Text>
              <Calendar size={18} color={theme.textSecondary} />
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                minimumDate={new Date(1990, 0, 1)}
                onChange={(_, date) => {
                  if (date) setBirthDate(date);
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                }}
                style={{ backgroundColor: theme.surface, marginTop: 8 }}
              />
            ) : null}
          </View>

          {/* Gender */}
          <View style={{ marginBottom: 36 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Cinsiyet
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g.value}
                  onPress={() => { setGender(g.value); setError(""); }}
                  testID={`gender-${g.value}`}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: gender === g.value ? theme.primary : theme.borderDefault,
                    backgroundColor: gender === g.value ? "rgba(225,29,72,0.15)" : theme.surface,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: gender === g.value ? theme.accent : theme.textSecondary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
