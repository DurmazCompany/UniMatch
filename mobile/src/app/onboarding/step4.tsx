import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft } from "lucide-react-native";

const HOBBIES = [
  { value: "music", label: "Müzik", emoji: "🎵" },
  { value: "sports", label: "Spor", emoji: "⚽" },
  { value: "gaming", label: "Oyun", emoji: "🎮" },
  { value: "movies", label: "Film/Dizi", emoji: "🎬" },
  { value: "reading", label: "Kitap", emoji: "📚" },
  { value: "travel", label: "Seyahat", emoji: "✈️" },
  { value: "photography", label: "Fotoğraf", emoji: "📸" },
  { value: "cooking", label: "Yemek", emoji: "🍳" },
  { value: "art", label: "Sanat", emoji: "🎨" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "coding", label: "Kodlama", emoji: "💻" },
  { value: "dance", label: "Dans", emoji: "💃" },
];

export default function Step4Screen() {
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const insets = useSafeAreaInsets();

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleHobby = (value: string) => {
    setError("");
    if (selectedHobbies.includes(value)) {
      setSelectedHobbies((prev) => prev.filter((h) => h !== value));
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies((prev) => [...prev, value]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = async () => {
    if (selectedHobbies.length < 1) {
      setError("En az 1 hobi seç");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        ...onboarding,
        hobbies: JSON.stringify(selectedHobbies),
        photos: JSON.stringify(onboarding.photos ?? []),
      };
      await api.post("/api/profile", payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/onboarding/step5");
    } catch {
      setError("Profil kaydedilemedi. Lütfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
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
                backgroundColor: theme.primary,
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
          Hobilerin
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 8 }}>
          İlgi alanlarından en fazla 5 tane seç
        </Text>
        <Text style={{ color: theme.accent, fontSize: 13, marginBottom: 28 }}>
          {selectedHobbies.length}/5 seçildi
        </Text>

        {/* Hobbies grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
          {HOBBIES.map((hobby) => {
            const isSelected = selectedHobbies.includes(hobby.value);
            const isDisabled = !isSelected && selectedHobbies.length >= 5;
            return (
              <Pressable
                key={hobby.value}
                onPress={() => toggleHobby(hobby.value)}
                disabled={isDisabled}
                testID={`hobby-${hobby.value}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  borderColor: isSelected ? theme.primary : theme.borderDefault,
                  backgroundColor: isSelected ? "rgba(225,29,72,0.15)" : theme.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 18 }}>{hobby.emoji}</Text>
                <Text
                  style={{
                    color: isSelected ? theme.accent : theme.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {hobby.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleNext}
          disabled={loading}
          testID="next-button"
          style={({ pressed }) => ({ opacity: pressed || loading ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, borderRadius: 14, alignItems: "center" }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Tamamla →</Text>
            )}
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
}
