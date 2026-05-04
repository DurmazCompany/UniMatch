import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { useSession } from "@/lib/auth/use-session";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius } from "@/lib/theme";
import { UMInput, UMButton } from "@/components/ui";
import { OnboardingHeader } from "./step1";

const YEARS = [1, 2, 3, 4, 5, 6];

function extractUniversityName(email: string): string {
  const rawDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const parts = rawDomain.split(".");
  const SKIP = new Set(["std", "ogr", "mail", "student", "ogrenci", "edu", "tr", "com", "ac", "uk"]);
  const meaningful = parts.filter((p) => !SKIP.has(p));
  const slugRaw = meaningful[0] ?? parts[0] ?? "universite";
  return slugRaw.charAt(0).toUpperCase() + slugRaw.slice(1) + " Üniversitesi";
}

export default function Step2Screen() {
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const detectedUniversity = extractUniversityName(session?.user?.email ?? "");

  const [department, setDepartment] = useState("");
  const [year, setYear] = useState(0);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!department.trim() || department.trim().length < 2) {
      setError("Bölüm adı en az 2 karakter olmalı");
      return;
    }
    if (!year) { setError("Sınıfını seç"); return; }

    setOnboarding({
      university: detectedUniversity,
      department: department.trim(),
      year,
      bio: bio.trim(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/step3");
  };

  const isValid = department.trim().length >= 2 && year > 0;

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
        <OnboardingHeader step={2} />

        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, color: Colors.textDark, marginTop: 16 }}>
          Kampüsün hangisi?
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 28 }}>
          Üniversite ve bölüm bilgilerini gir
        </Text>

        <View style={{ gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.textDark }}>
              Üniversite
            </Text>
            <View style={{
              backgroundColor: Colors.primaryPale,
              borderWidth: 1.5,
              borderColor: Colors.primary,
              borderRadius: Radius.input,
              height: 54,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Text style={{ color: Colors.textDark, fontSize: 15, fontFamily: "DMSans_500Medium" }}>{detectedUniversity}</Text>
              <Text style={{ fontSize: 16 }}>🎓</Text>
            </View>
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
              E-postandan otomatik algılandı
            </Text>
          </View>

          <UMInput
            label="Bölüm"
            value={department}
            onChangeText={(t) => { setDepartment(t); setError(""); }}
            placeholder="Örn. Bilgisayar Mühendisliği"
            testID="department-input"
          />

          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.textDark }}>
              Sınıf
            </Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {YEARS.map((y) => {
                const isSelected = year === y;
                return (
                  <Pressable
                    key={y}
                    onPress={() => { setYear(y); setError(""); }}
                    testID={`year-${y}`}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: Radius.pill,
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: "rgba(0,0,0,0.1)",
                      backgroundColor: isSelected ? Colors.primary : Colors.white,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: isSelected ? Colors.white : Colors.textDark, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
                      {y}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.textDark }}>
              Hakkında (isteğe bağlı)
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinden kısaca bahset..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              testID="bio-input"
              style={{
                backgroundColor: Colors.white,
                borderWidth: 1.5,
                borderColor: "rgba(0,0,0,0.1)",
                borderRadius: 22,
                paddingHorizontal: 18,
                paddingVertical: 14,
                color: Colors.textDark,
                fontSize: 15,
                fontFamily: "DMSans_400Regular",
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
            <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: "right", fontFamily: "DMSans_400Regular" }}>
              {bio.length}/200
            </Text>
          </View>
        </View>

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginTop: 16, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ marginTop: 32 }}>
          <UMButton variant="primary" label="Devam" disabled={!isValid} onPress={handleNext} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
