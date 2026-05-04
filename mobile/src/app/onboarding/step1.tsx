import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius } from "@/lib/theme";
import { UMInput, UMButton } from "@/components/ui";

const GENDERS = [
  { label: "Erkek", value: "male" },
  { label: "Kadın", value: "female" },
  { label: "Diğer", value: "other" },
];

const TOTAL_STEPS = 5;
const STEP = 1;

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

  const isValid = name.trim().length > 0 && gender !== "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgLight }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader step={STEP} />

        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, color: Colors.textDark, marginTop: 16 }}>
          Seni tanıyalım
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 28 }}>
          Profil bilgilerini gir
        </Text>

        <View style={{ gap: 20 }}>
          <UMInput
            label="Adın"
            value={name}
            onChangeText={(t) => { setName(t); setError(""); }}
            placeholder="Adın"
            autoCapitalize="words"
            testID="name-input"
          />

          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.textDark }}>
              Doğum Tarihi
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(!showDatePicker)}
              testID="birthdate-picker"
              style={{
                backgroundColor: Colors.white,
                borderWidth: 1.5,
                borderColor: showDatePicker ? Colors.primary : "rgba(0,0,0,0.1)",
                borderRadius: Radius.input,
                height: 54,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: Colors.textDark, fontSize: 15, fontFamily: "DMSans_400Regular" }}>{formattedDate}</Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
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
                style={{ backgroundColor: Colors.white, marginTop: 8 }}
              />
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.textDark }}>
              Cinsiyet
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {GENDERS.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => { setGender(g.value); setError(""); }}
                    testID={`gender-${g.value}`}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: Radius.pill,
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: "rgba(0,0,0,0.1)",
                      backgroundColor: isSelected ? Colors.primary : Colors.white,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: isSelected ? Colors.white : Colors.textDark, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginTop: 16, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ marginTop: 32 }}>
          <UMButton
            variant="primary"
            label="Devam"
            disabled={!isValid}
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function OnboardingHeader({ step }: { step: number }) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Ionicons name="chevron-back-outline" size={24} color={Colors.textDark} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < step ? Colors.primary : Colors.primaryPale,
              }}
            />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 12 }}>
        Adım {step} / {TOTAL_STEPS}
      </Text>
    </View>
  );
}
